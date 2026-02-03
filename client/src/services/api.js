import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000'}/api`;

/**
 * Fetches all processed receipts from the backend.
 */
export const getReceipts = async () => {
    const response = await axios.get(`${API_BASE}/receipts`);
    return response.data;
};

/**
 * Uploads a receipt file.
 */
export const uploadReceiptFile = async (formData) => {
    const response = await axios.post(`${API_BASE}/upload`, formData);
    return response.data;
};

/**
 * Triggers validation for a receipt.
 */
export const validateReceipt = async (id) => {
    const response = await axios.post(`${API_BASE}/validate`, { id });
    return response.data;
};

/**
 * Triggers AI processing for a receipt.
 */
export const processReceipt = async (id) => {
    const response = await axios.post(`${API_BASE}/process`, { id });
    return response.data;
};
