import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeMap = {
    small: { width: '20px', height: '20px', border: '2px' },
    medium: { width: '36px', height: '36px', border: '3px' },
    large: { width: '56px', height: '56px', border: '4px' }
  };

  const currentSize = sizeMap[size] || sizeMap.medium;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem',
      gap: '1rem',
      width: '100%'
    }}>
      <div
        style={{
          width: currentSize.width,
          height: currentSize.height,
          border: `${currentSize.border} solid rgba(255, 255, 255, 0.1)`,
          borderTopColor: 'var(--brand-blue)',
          borderRadius: '50%',
          animation: 'pf-spin 0.8s linear infinite'
        }}
      />
      {message && (
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {message}
        </span>
      )}
      <style>{`
        @keyframes pf-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
