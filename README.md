# Receipt Processor Solution

This is a full-stack solution for automatically processing scanned PDF receipts.

## Getting Started

### Prerequisites
- Node.js (v20+)
- npm

### Installation

1. Navigate to the project directory:
   ```bash
   cd receipt-processor
   ```

2. Install dependencies for the backend:
   ```bash
   npm install
   ```

3. Install dependencies for the frontend:
   ```bash
   cd client
   npm install
   cd ..
   ```

### Running the Application

1. **Start the Backend Server**:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3000`.

2. **Start the Frontend (Vite)**:
   ```bash
   cd client
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

## API Documentation

### `POST /api/upload`
Uploads a receipt PDF.
- **Form Data**: `receipt` (file)
- **Response**: `{ id, message }`

### `POST /api/validate`
Validates if the file is a valid PDF.
- **Body**: `{ id }`
- **Response**: `{ id, is_valid }`

### `POST /api/process`
Extracts data from the PDF using OCR.
- **Body**: `{ id }`
- **Response**: `{ message, data: { merchant_name, purchased_at, total_amount } }`

### `GET /api/receipts`
Lists all processed receipts.

### `GET /api/receipts/:id`
Gets details of a specific receipt.

## Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite3, Knex.js
- **OCR/Extraction**: Google Gemini 2.0 Flash (Multimodal PDF Processing)
- **Frontend**: React.js, Vite
- **Styling**: Vanilla CSS 

---

## Assessment Requirements Fulfillment

| Requirement | Implementation Detail |
|-------------|-----------------------|
| **PDF Upload** | Handled via `/upload` using Multer. Validates MIME type. |
| **OCR Extraction** | Uses Gemini 2.0 Flash to extract text, tables, and currency directly from PDFs. |
| **Database** | SQLite schema implemented with `receipt_file` and `receipt` tables. |
| **Year Organization** | Processed files are automatically moved to `uploads/YYYY/` folders. |
| **Duplicate Handling** | Re-uploading a file with the same name updates existing metadata and records. |
| **REST APIs** | Full suite of CRUD and processing APIs as per specifications. |
| **UI/UX** | Premium glassmorphism dashboard with real-time status updates. |

---

## Detailed API Usage

### 1. Upload Receipt
`POST /api/upload`
- **Request**: Multipart Form Data (`receipt: file.pdf`)
- **Response** (201):
```json
{
  "id": 1,
  "message": "File uploaded successfully"
}
```

### 2. Validate PDF
`POST /api/validate`
- **Request**: `{ "id": 1 }`
- **Response** (200):
```json
{
  "id": 1,
  "is_valid": true
}
```

### 3. Process with AI
`POST /api/process`
- **Request**: `{ "id": 1 }`
- **Response** (200):
```json
{
  "message": "Receipt processed successfully and organized by year",
  "data": {
    "merchant_name": "Walmart",
    "purchased_at": "2024-05-12",
    "total_amount": 124.50,
    "tax_amount": 8.50,
    "currency": "$"
  }
}
```

### 4. Fetch All
`GET /api/receipts`
- **Response**: Array of finalized receipt objects.
