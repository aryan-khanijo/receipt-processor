import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const ReceiptCard = ({ receipt }) => {
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'completed': return 'processed';
            case 'queued': return 'waiting';
            case 'failed': return 'error';
            default: return 'processed';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle size={14} style={{ marginRight: '8px' }} />;
            case 'queued': return <Clock size={14} style={{ marginRight: '8px' }} />;
            case 'failed': return <AlertCircle size={14} style={{ marginRight: '8px' }} />;
            default: return <CheckCircle size={14} style={{ marginRight: '8px' }} />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed': return 'Processed';
            case 'queued': return 'Queued (Retrying)';
            case 'failed': return 'Error';
            default: return 'Processed';
        }
    };

    return (
        <div className="receipt-card">
            <div className="merchant">{receipt.merchant_name}</div>
            <div className="amount">
                {receipt.currency}{' '}
                {parseFloat(receipt.total_amount).toFixed(2)}
            </div>
            {receipt.tax_amount > 0 && (
                <div className="tax-amount">
                    Tax: {receipt.currency}{' '}
                    {parseFloat(receipt.tax_amount).toFixed(2)}
                </div>
            )}
            <div className="date">
                <Clock size={16} /> {formatDate(receipt.purchased_at)}
            </div>
            <div className={`status ${getStatusClass(receipt.status)}`}>
                {getStatusIcon(receipt.status)}
                {getStatusText(receipt.status)}
            </div>
        </div>
    );
};

export default ReceiptCard;
