import React from 'react';
import { Upload, RefreshCw } from 'lucide-react';

const UploadZone = ({ uploading, onUpload }) => {
    return (
        <section className="upload-section">
            <label className={`dropzone ${uploading ? 'uploading' : ''}`}>
                <input
                    type="file"
                    hidden
                    onChange={onUpload}
                    disabled={uploading}
                    accept=".pdf"
                />
                <Upload className="icon" size={48} />
                <h3>{uploading ? 'Processing with AI...' : 'Click or Drag to Upload PDF'}</h3>
                <p className="subtitle">Only scanned PDF receipts supported</p>
                {uploading && <RefreshCw className="animate-spin mt-4" size={24} />}
            </label>
        </section>
    );
};

export default UploadZone;
