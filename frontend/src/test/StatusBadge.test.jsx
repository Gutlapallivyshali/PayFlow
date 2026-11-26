import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders SUCCESS status badge correctly', () => {
    render(<StatusBadge status="SUCCESS" />);
    const badge = screen.getByText('SUCCESS');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.badge')).toHaveClass('badge-success');
  });

  it('renders FAILED status badge correctly', () => {
    render(<StatusBadge status="FAILED" />);
    const badge = screen.getByText('FAILED');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.badge')).toHaveClass('badge-failed');
  });

  it('renders PENDING status badge correctly', () => {
    render(<StatusBadge status="PENDING" />);
    const badge = screen.getByText('PENDING');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.badge')).toHaveClass('badge-pending');
  });

  it('returns null when status is empty or undefined', () => {
    const { container } = render(<StatusBadge status={null} />);
    expect(container.firstChild).toBeNull();
  });
});
