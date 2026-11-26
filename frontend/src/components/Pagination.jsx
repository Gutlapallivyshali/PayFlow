import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 0,
  totalPages = 1,
  totalElements = 0,
  pageSize = 10,
  onPageChange,
}) => {
  if (totalPages <= 1 && totalElements <= pageSize) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.25rem',
      borderTop: '1px solid var(--border-color)',
      fontSize: '0.85rem',
      color: 'var(--text-secondary)',
      flexWrap: 'wrap',
      gap: '0.75rem',
    }}>
      <div>
        Showing page <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentPage + 1}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{Math.max(1, totalPages)}</span> ({totalElements} total items)
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          className="btn btn-secondary btn-sm"
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
