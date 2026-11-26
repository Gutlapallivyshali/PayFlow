import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../components/Pagination';

describe('Pagination Component', () => {
  it('renders page information and handles next/previous clicks', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalElements={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    const prevButton = screen.getByLabelText('Previous Page');
    const nextButton = screen.getByLabelText('Next Page');

    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(0);

    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on the first page', () => {
    render(
      <Pagination
        currentPage={0}
        totalPages={3}
        totalElements={30}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Previous Page')).toBeDisabled();
    expect(screen.getByLabelText('Next Page')).not.toBeDisabled();
  });
});
