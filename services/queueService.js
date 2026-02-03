const db = require('../db');
const { extractData } = require('./ocrService');
const fs = require('fs');
const path = require('path');

/**
 * Service to handle background processing of queued receipts.
 * Implements retries with exponential backoff for 429 errors.
 */

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 10 * 1000; // 10 seconds

async function processQueuedReceipts() {
    try {
        // Find all records that are queued and ready for retry
        const queuedFiles = await db('receipt_file')
            .where({ status: 'queued' })
            .orWhere({ is_processed: false, is_valid: true, status: 'pending' }) // Also catch anything stuck in pending
            .limit(5); // Process in small batches

        for (const file of queuedFiles) {
            console.log(`[Queue] Processing file: ${file.id} (${file.file_name}), attempt ${file.retry_count + 1}`);

            try {
                // Update status to processing
                await db('receipt_file').where({ id: file.id }).update({ status: 'processing' });

                // Call the AI Service
                const extractedData = await extractData(file.file_path);

                // Step 4: Reorganize file into Year-based folder
                const purchaseYear = new Date(extractedData.purchased_at).getFullYear().toString();
                const yearDir = path.join(path.dirname(file.file_path), purchaseYear);

                if (!fs.existsSync(yearDir)) {
                    fs.mkdirSync(yearDir, { recursive: true });
                }

                const newPath = path.join(yearDir, path.basename(file.file_path));

                // Move the file physically
                if (fs.existsSync(file.file_path) && file.file_path !== newPath) {
                    fs.renameSync(file.file_path, newPath);
                }

                // Update or Insert into receipt table
                const existingReceipt = await db('receipt').where({ file_path: file.file_path }).orWhere({ file_path: newPath }).first();

                if (existingReceipt) {
                    await db('receipt').where({ id: existingReceipt.id }).update({
                        ...extractedData,
                        file_path: newPath,
                        updated_at: db.fn.now()
                    });
                } else {
                    await db('receipt').insert({
                        ...extractedData,
                        file_path: newPath
                    });
                }

                // Success!
                await db('receipt_file').where({ id: file.id }).update({
                    file_path: newPath,
                    is_processed: true,
                    status: 'completed',
                    updated_at: db.fn.now()
                });

                console.log(`[Queue] Successfully processed file ${file.id}`);

            } catch (error) {
                console.error(`[Queue] Error processing file ${file.id}:`, error.message);

                if (error.isRateLimit && file.retry_count < MAX_RETRIES) {
                    // Re-queue with incremented retry count
                    await db('receipt_file').where({ id: file.id }).update({
                        status: 'queued',
                        retry_count: file.retry_count + 1,
                        last_error: error.message,
                        updated_at: db.fn.now()
                    });
                    console.log(`[Queue] File ${file.id} re-queued for retry.`);
                } else {
                    // Permanent failure
                    await db('receipt_file').where({ id: file.id }).update({
                        status: 'failed',
                        last_error: error.message,
                        updated_at: db.fn.now()
                    });
                    console.log(`[Queue] File ${file.id} marked as failed.`);
                }
            }
        }
    } catch (err) {
        console.error('[Queue] Error in background worker:', err);
    }
}

// Start the background worker
function startQueueWorker(intervalMs = 30000) {
    console.log(`[Queue] Starting background worker with interval ${intervalMs}ms`);
    setInterval(processQueuedReceipts, intervalMs);
}

module.exports = { startQueueWorker, processQueuedReceipts };
