import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../components/ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('renders title, message and triggers onConfirm and onCancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Cancel Payment?"
        message="This action is irreversible."
        confirmText="Yes, Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Cancel Payment?')).toBeInTheDocument();
    expect(screen.getByText('This action is irreversible.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Yes, Cancel'));
    expect(onConfirm).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={false}
        title="Hidden Dialog"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
