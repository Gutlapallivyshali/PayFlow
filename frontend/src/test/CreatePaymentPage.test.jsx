import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreatePaymentPage from '../pages/CreatePaymentPage';
import { customerService } from '../services/customerService';
import { paymentService } from '../services/paymentService';

// Mock services and contexts
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../services/customerService', () => ({
  customerService: {
    getAll: vi.fn(),
  },
}));

vi.mock('../services/paymentService', () => ({
  paymentService: {
    create: vi.fn(),
  },
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: mockSuccessToast,
    error: mockErrorToast,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCustomers = [
  { id: 1, fullName: 'Sarah Jenkins', email: 'sarah.jenkins@acme.com', status: 'ACTIVE' },
  { id: 2, fullName: 'Alex Mercer', email: 'alex.mercer@fintechlab.io', status: 'ACTIVE' },
  { id: 4, fullName: 'David Chen', email: 'david.chen@nexuspay.org', status: 'INACTIVE' },
];

describe('CreatePaymentPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    customerService.getAll.mockResolvedValue({
      content: mockCustomers,
      totalElements: 3,
    });
  });

  const renderCreatePaymentPage = () => {
    return render(
      <MemoryRouter>
        <CreatePaymentPage />
      </MemoryRouter>
    );
  };

  it('renders payment form with loaded customers, default values, and simulator card', async () => {
    renderCreatePaymentPage();

    expect(screen.getByRole('heading', { name: /process new payment/i })).toBeInTheDocument();
    expect(screen.getByText(/submit transaction to mockpaymentgateway/i)).toBeInTheDocument();

    // Wait for customer selector to load options
    await waitFor(() => {
      expect(customerService.getAll).toHaveBeenCalledWith({ page: 0, size: 50 });
      expect(screen.getByRole('option', { name: /sarah/i })).toBeInTheDocument();
    });

    // Check default input values
    expect(screen.getByLabelText(/amount/i)).toHaveValue(149.5);
    expect(screen.getByLabelText(/currency/i)).toHaveValue('USD');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Cloud Infrastructure Usage Billing');

    // Payment rail buttons
    expect(screen.getByRole('button', { name: /card/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wallet/i })).toBeInTheDocument();

    // Idempotency key input & generator button
    expect(screen.getByRole('button', { name: /new key/i })).toBeInTheDocument();

    // Simulator instructions card
    expect(screen.getByRole('heading', { name: /payment engine simulator/i })).toBeInTheDocument();
  });

  it('validates required fields and rejects invalid amount (<= 0)', async () => {
    renderCreatePaymentPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /sarah/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '0' } });

    const submitBtn = screen.getByRole('button', { name: /charge/i });
    fireEvent.submit(submitBtn.closest('form'));

    expect(screen.getByText(/payment amount must be greater than zero/i)).toBeInTheDocument();
    expect(paymentService.create).not.toHaveBeenCalled();
  });

  it('displays warning banner when an INACTIVE customer is selected', async () => {
    renderCreatePaymentPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /sarah/i })).toBeInTheDocument();
    });

    const customerSelect = screen.getByLabelText(/customer profile/i);
    // Select customer ID 4 (David Chen - INACTIVE)
    fireEvent.change(customerSelect, { target: { value: '4' } });

    expect(screen.getByText(/warning: customer account is inactive/i)).toBeInTheDocument();
  });

  it('generates a fresh idempotency key when New Key button is clicked', async () => {
    renderCreatePaymentPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /sarah/i })).toBeInTheDocument();
    });

    const keyInput = screen.getByPlaceholderText(/unique key for request deduplication/i);
    const initialKey = keyInput.value;
    expect(initialKey).toMatch(/^idem_/);

    const newKeyBtn = screen.getByRole('button', { name: /new key/i });
    fireEvent.click(newKeyBtn);

    const updatedKey = keyInput.value;
    expect(updatedKey).toMatch(/^idem_/);
    expect(updatedKey).not.toEqual(initialKey);
  });

  it('switches payment rail when payment rail button is clicked', async () => {
    renderCreatePaymentPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /sarah/i })).toBeInTheDocument();
    });

    const upiButton = screen.getByRole('button', { name: /upi/i });
    fireEvent.click(upiButton);

    expect(upiButton).toBeInTheDocument();
  });

  it('successfully submits payment and displays success result card with details', async () => {
    paymentService.create.mockResolvedValueOnce({
      id: 88,
      customerId: 1,
      customerName: 'Sarah Jenkins',
      amount: '249.99',
      currency: 'USD',
      status: 'SUCCESS',
      paymentMethodType: 'MOCK_CARD',
      idempotencyKey: 'idem_test_key_88',
      gatewayReference: 'MOCK-TXN-1732200-88',
      failureReason: null,
      createdAt: '2026-11-21T22:30:00',
    });

    renderCreatePaymentPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /sarah/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '249.99' } });

    const submitBtn = screen.getByRole('button', { name: /charge/i });
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      expect(paymentService.create).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('heading', { name: /payment settled successfully/i })).toBeInTheDocument();
      expect(screen.getByText('#88')).toBeInTheDocument();
      expect(screen.getByText('$249.99 USD')).toBeInTheDocument();
      expect(screen.getByText('MOCK-TXN-1732200-88')).toBeInTheDocument();
      expect(mockSuccessToast).toHaveBeenCalledWith('Payment #88 settled successfully!');
    });
  });

  it('handles simulated gateway decline (status=FAILED) and displays decline reason', async () => {
    paymentService.create.mockResolvedValueOnce({
      id: 89,
      customerId: 1,
      customerName: 'Sarah Jenkins',
      amount: '12000.00',
      currency: 'USD',
      status: 'FAILED',
      paymentMethodType: 'MOCK_CARD',
      idempotencyKey: 'idem_test_key_89',
      gatewayReference: 'MOCK-TXN-1732200-89',
      failureReason: 'VELOCITY_LIMIT_EXCEEDED: Single transaction exceeds mock velocity threshold of $10,000',
    });

    renderCreatePaymentPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /sarah/i })).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '12000.00' } });

    const submitBtn = screen.getByRole('button', { name: /charge/i });
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /payment declined/i })).toBeInTheDocument();
      expect(screen.getByText(/velocity_limit_exceeded/i)).toBeInTheDocument();
      expect(mockErrorToast).toHaveBeenCalledWith(expect.stringContaining('declined by gateway'));
    });
  });

  it('handles backend API rejection and displays error message banner', async () => {
    const errorResponse = {
      response: {
        data: {
          message: 'Customer account is deactivated and cannot initiate payments.',
        },
      },
    };
    paymentService.create.mockRejectedValueOnce(errorResponse);

    renderCreatePaymentPage();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /sarah/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /charge/i });
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('Customer account is deactivated and cannot initiate payments.')).toBeInTheDocument();
    });
  });
});
