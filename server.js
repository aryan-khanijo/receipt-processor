require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const receiptRoutes = require('./routes/receiptRoutes');
const { startQueueWorker } = require('./services/queueService');

/**
 * Main Server Entry Point.
 * Configures the Express application, middleware, and routes.
 */

const app = express();
const PORT = process.env.PORT || 3000;

// Standard Middlewares
app.use(cors()); // Allow requests from the frontend (Vite runs on a different port)
app.use(express.json()); // Parse JSON request bodies

// Register API Routes
app.use('/api', receiptRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Receipt Processor API is running' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // Start the background retry worker
    startQueueWorker();
});
