import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import ReceiptCard from './ReceiptCard';

const ReceiptGrid = ({ receipts, loading, onRefresh }) => {
    if (loading) {
        return (
            <div className="empty-state">
                <RefreshCw className="animate-spin mb-4" size={32} />
                <p>Loading your receipts...</p>
            </div>
        );
    }

    if (receipts.length === 0) {
        return (
            <div className="empty-state">
                <FileText size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
                <p>No receipts processed yet. Start by uploading one!</p>
            </div>
        );
    }

    return (
        <section className="receipts-list">
            <div className="section-header">
                <h2>Processed Receipts</h2>
                <button className="btn" onClick={onRefresh}>
                    <RefreshCw size={18} /> Refresh
                </button>
            </div>
            <div className="receipt-grid">
                {receipts.map((receipt) => (
                    <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
            </div>
        </section>
    );
};

export default ReceiptGrid;
