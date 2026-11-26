import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

// Mock contexts and router navigation
const mockLogin = vi.fn();
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  it('renders login form elements, inputs, demo buttons and register link', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /sign in to console/i })).toBeInTheDocument();
    expect(screen.getByText(/enterprise payment processing & transaction platform/i)).toBeInTheDocument();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /demo admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /demo customer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
  });

  it('verifies required attributes on username and password input fields', () => {
    renderLoginPage();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('populates credentials when quick demo buttons are clicked', () => {
    renderLoginPage();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Click Demo Customer
    fireEvent.click(screen.getByRole('button', { name: /demo customer/i }));
    expect(usernameInput).toHaveValue('sarah');
    expect(passwordInput).toHaveValue('customer123');

    // Click Demo Admin
    fireEvent.click(screen.getByRole('button', { name: /demo admin/i }));
    expect(usernameInput).toHaveValue('admin');
    expect(passwordInput).toHaveValue('admin123');
  });

  it('executes successful login flow, calls toast.success, and navigates to dashboard', async () => {
    mockLogin.mockResolvedValueOnce({
      token: 'mock-jwt-token',
      username: 'admin',
      role: 'ADMIN',
    });

    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      });
      expect(mockSuccess).toHaveBeenCalledWith('Authentication successful! Welcome to PayFlow.');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays API error message when login fails with server error response', async () => {
    const errorResponse = {
      response: {
        data: {
          message: 'Invalid username or password credentials.',
        },
      },
    };
    mockLogin.mockRejectedValueOnce(errorResponse);

    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(screen.getByText('Invalid username or password credentials.')).toBeInTheDocument();
    });

    // Verify did not navigate or show success
    expect(mockSuccess).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays fallback error message when server response does not contain message', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network Error'));

    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid username or password credentials.')).toBeInTheDocument();
    });
  });

  it('shows loading state on button while authentication request is in flight', async () => {
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValueOnce(loginPromise);

    renderLoginPage();

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    // While promise is pending
    expect(screen.getByRole('button', { name: /authenticating.../i })).toBeDisabled();

    // Resolve the promise
    resolveLogin({ username: 'admin', role: 'ADMIN' });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
