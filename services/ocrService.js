const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

/**
 * Service to handle high-accuracy data extraction from receipts using AI.
 * This utilizes Google Gemini's multimodal capabilities to process PDFs directly.
 */

// Initialize the Gemini AI client using the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Selecting the best model for cost-effective and fast multimodal processing
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Helper function to prepare local file data for the Gemini API.
 * Converts a file to a base64 string wrapped in the expected AI Part structure.
 * 
 * @param {string} path - Absolute or relative path to the file.
 * @param {string} mimeType - The mime type of the file (e.g., 'application/pdf').
 * @returns {object} - A part object compatible with GoogleGenerativeAI.
 */
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

/**
 * Main extraction function.
 * Sends the receipt document to Gemini AI with a specific prompt to extract structured data.
 * 
 * @param {string} filePath - Path to the PDF receipt to be processed.
 * @returns {Promise<object>} - Resolves to an object containing merchant_name, purchased_at, and total_amount.
 */
const extractData = async (filePath) => {
    try {
        // Basic security check for the required API key
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not found in .env");
        }

        // System prompt designed to force Gemini to return structured, clean JSON
        const prompt = `
      Analyze this receipt image/PDF and extract the following details in JSON format:
      - merchant_name (The store or company name, precisely as it appears)
      - purchased_at (The date of purchase in YYYY-MM-DD format)
      - total_amount (The final total amount shown, as a numeric value)
      - tax_amount (The tax amount if visible, otherwise 0.00)
      - currency (The currency symbol or code, e.g., $, USD, EUR)

      Return ONLY the JSON object. Do not include markdown formatting or explanations.
    `;

        // Convert the PDF to a multimodal part
        const pdfPart = fileToGenerativePart(filePath, "application/pdf");

        // Execute the AI generation request
        const result = await model.generateContent([prompt, pdfPart]);
        const response = await result.response;
        const text = response.text();

        // Safety: Extract JSON even if the AI occasionally wraps it in markdown code blocks
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI failed to return valid JSON");
        }

        // Parse the string response into a JavaScript object
        const aiResult = JSON.parse(jsonMatch[0]);

        // Construct the final normalized result object
        return {
            merchant_name: aiResult.merchant_name || 'Unknown Merchant',
            purchased_at: aiResult.purchased_at ? new Date(aiResult.purchased_at) : new Date(),
            total_amount: aiResult.total_amount || 0.00,
            tax_amount: aiResult.tax_amount || 0.00,
            currency: aiResult.currency || 'USD'
        };

    } catch (error) {
        // Log failures clearly for debugging server-side issues
        console.error('AI Extraction error:', error);

        // Check if it's a 429 (Too Many Requests) error
        // Google SDK usually wraps these in an error object
        if (error.status === 429 || (error.message && error.message.includes('429')) || (error.response && error.response.status === 429)) {
            error.isRateLimit = true;
        }

        throw error;
    }
};

module.exports = { extractData };
