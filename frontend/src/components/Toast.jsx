import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ id, message, type = 'info', onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} color="var(--status-success)" />;
      case 'error':
        return <AlertCircle size={18} color="var(--status-failed)" />;
      case 'info':
      default:
        return <Info size={18} color="var(--brand-blue)" />;
    }
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      <div style={{ flexShrink: 0 }}>{getIcon()}</div>
      <div style={{ flex: 1, fontSize: '0.875rem' }}>{message}</div>
      <button
        onClick={onClose}
        style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
