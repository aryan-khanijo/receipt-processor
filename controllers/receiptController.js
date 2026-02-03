const db = require('../db');
const { extractData } = require('../services/ocrService');
const fs = require('fs');
const path = require('path');

/**
 * Controller for handling all receipt-related API endpoints.
 */

/**
 * Handles PDF file uploads.
 * Checks for duplicates based on original file name and updates existing records.
 */
const uploadReceipt = async (req, res) => {
    try {
        // Multer populates req.file if the upload is successful
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Task 3: Duplicate Handling - Check if file already exists in metadata table
        const existingFile = await db('receipt_file').where({ file_name: req.file.originalname }).first();

        if (existingFile) {
            // Update its path and timestamp instead of creating a new row
            await db('receipt_file').where({ id: existingFile.id }).update({
                file_path: req.file.path,
                updated_at: db.fn.now()
            });
            return res.json({ id: existingFile.id, message: 'File updated successfully' });
        }

        // Create a new entry for a first-time upload
        const [id] = await db('receipt_file').insert({
            file_name: req.file.originalname,
            file_path: req.file.path,
            is_valid: true, // Basic validity assumed given Multer filters for PDF
            is_processed: false
        });

        res.status(201).json({ id, message: 'File uploaded successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Validates whether the uploaded file is a standard PDF.
 * This can be expanded to perform deeper structure checks.
 */
const validateReceipt = async (req, res) => {
    const { id } = req.body;
    try {
        const file = await db('receipt_file').where({ id }).first();
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Heuristic check: Ensuring the stored extension is .pdf
        const isValid = file.file_path.toLowerCase().endsWith('.pdf');

        await db('receipt_file').where({ id }).update({
            is_valid: isValid,
            invalid_reason: isValid ? null : 'Not a valid PDF file'
        });

        res.json({ id, is_valid: isValid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Processes a receipt using AI extraction.
 * Updates the 'receipt' table with structured data.
 */
const processReceipt = async (req, res) => {
    const { id } = req.body;
    try {
        // Lookup the file metadata
        const file = await db('receipt_file').where({ id }).first();
        if (!file || !file.is_valid) {
            return res.status(400).json({ error: 'Valid file not found' });
        }

        // Create a flag for status
        let processingStatus = 'completed';

        try {
            // Update status to processing
            await db('receipt_file').where({ id }).update({ status: 'processing' });

            // Call the AI Service to analyze the PDF
            const extractedData = await extractData(file.file_path);

            // Step 4: Reorganize file into Year-based folder (Assessment Requirement)
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

            // Check if we've already extracted data for this specific file path before
            const existingReceipt = await db('receipt').where({ file_path: file.file_path }).orWhere({ file_path: newPath }).first();

            if (existingReceipt) {
                // Update existing extraction results (Overwrite logic)
                await db('receipt').where({ id: existingReceipt.id }).update({
                    ...extractedData,
                    file_path: newPath,
                    updated_at: db.fn.now()
                });
            } else {
                // Create new extraction record
                await db('receipt').insert({
                    ...extractedData,
                    file_path: newPath
                });
            }

            // Mark the file as successfully processed and update its location
            await db('receipt_file').where({ id }).update({
                file_path: newPath,
                is_processed: true,
                status: 'completed',
                updated_at: db.fn.now()
            });

            res.json({ message: 'Receipt processed successfully and organized by year', data: extractedData });

        } catch (error) {
            console.error('Processing error:', error);

            if (error.isRateLimit) {
                // Handle 429 error by queuing the file
                await db('receipt_file').where({ id }).update({
                    status: 'queued',
                    last_error: error.message,
                    updated_at: db.fn.now()
                });
                return res.status(429).json({
                    message: 'Rate limit hit. Receipt has been queued for background processing.',
                    id: file.id,
                    status: 'queued'
                });
            } else {
                // Handle other errors
                await db('receipt_file').where({ id }).update({
                    status: 'failed',
                    last_error: error.message,
                    updated_at: db.fn.now()
                });
                return res.status(500).json({ error: error.message });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Returns a list of all extracted receipts from the database.
 */
const getAllReceipts = async (req, res) => {
    try {
        const receipts = await db('receipt').select('*').orderBy('created_at', 'desc');
        res.json(receipts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Returns detailed info for a single receipt by its database ID.
 */
const getReceiptById = async (req, res) => {
    const { id } = req.params;
    try {
        const receipt = await db('receipt').where({ id }).first();
        if (!receipt) {
            return res.status(404).json({ error: 'Receipt not found' });
        }
        res.json(receipt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    uploadReceipt,
    validateReceipt,
    processReceipt,
    getAllReceipts,
    getReceiptById
};
