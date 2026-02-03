import { useState, useEffect } from 'react';
import { getReceipts, uploadReceiptFile, validateReceipt, processReceipt } from './services/api';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ReceiptGrid from './components/ReceiptGrid';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';

/**
 * Main Application Component.
 * Manages the state for the receipt list, upload progress, and global application state.
 */
function App() {
  // State for storing the list of receipts from the backend
  const [receipts, setReceipts] = useState([]);
  // State to show/hide processing animations during upload
  const [uploading, setUploading] = useState(false);
  // Initial loading state for the data grid
  const [loading, setLoading] = useState(true);

  // Fetch receipts once on initial component mount
  useEffect(() => {
    fetchReceipts();
  }, []);

  /**
   * Fetches all processed receipts from the backend API.
   */
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const data = await getReceipts();
      setReceipts(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Primary handler for file selection.
   * Performs an automated 'pipeline' of Upload -> Validate -> Process.
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Client-side guard for file type
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', file);

    const loadingToast = toast.loading('Uploading and processing receipt...');

    try {
      setUploading(true);

      // Step 1: Upload the file and get its database meta ID
      const { id } = await uploadReceiptFile(formData);

      // Step 2 & 3: Trigger backend validation and AI processing sequentially
      await validateReceipt(id);

      try {
        await processReceipt(id);
        toast.success('Receipt processed successfully!', { id: loadingToast });
      } catch (err) {
        // Handle 429 specifically if caught here, though API service might throw
        if (err.response && err.response.status === 429) {
          toast.success('Rate limit hit. Queued for background processing.', {
            id: loadingToast,
            icon: '⏳'
          });
        } else {
          throw err;
        }
      }

      // Refresh the view with the new data
      await fetchReceipts();
    } catch (err) {
      toast.error('Processing failed. Check console.', { id: loadingToast });
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '0',
            border: '3px solid #000',
            padding: '16px',
            color: '#000',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: '700',
            background: '#fff',
            boxShadow: '8px 8px 0px #000',
            textTransform: 'uppercase',
            fontSize: '0.9rem'
          },
          success: {
            iconTheme: {
              primary: '#0057ae',
              secondary: '#fff',
            },
            style: {
              boxShadow: '8px 8px 0px #0057ae',
            }
          },
          error: {
            iconTheme: {
              primary: '#d62d20',
              secondary: '#fff',
            },
            style: {
              boxShadow: '8px 8px 0px #d62d20',
            }
          },
          loading: {
            style: {
              boxShadow: '8px 8px 0px #f7b500',
            }
          }
        }}
      />
      <Header />
      <UploadZone uploading={uploading} onUpload={handleFileUpload} />
      <ReceiptGrid
        receipts={receipts}
        loading={loading}
        onRefresh={fetchReceipts}
      />
    </div>
  );
}

export default App;
