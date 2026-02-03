const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const receiptController = require('../controllers/receiptController');

/**
 * Route Definitions for the Receipt Processing API.
 * Maps endpoints to their respective controller logic.
 */

// Route to handle initial file upload (includes Multer middleware)
router.post('/upload', upload.single('receipt'), receiptController.uploadReceipt);

// Route to trigger logical validation of the uploaded file
router.post('/validate', receiptController.validateReceipt);

// Route to initiate AI-powered data extraction
router.post('/process', receiptController.processReceipt);

// Route to retrieve the full history of processed receipts
router.get('/receipts', receiptController.getAllReceipts);

// Route to retrieve a specific receipt's details
router.get('/receipts/:id', receiptController.getReceiptById);

module.exports = router;
