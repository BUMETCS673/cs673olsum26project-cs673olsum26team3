// AI-USAGE SUMMARY
// Tools: Claude (Claude Code)
// Overall AI Contribution: ~40%
// AI-Assisted Areas: Helped fix userEvent patterns and mode-switching assertions
// Human Contributions: Implemented login, register, and forgot password test cases, defined validation and error scenarios
// Notes: AI-generated code was significantly refactored and tested before integration

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../views/Login/Login';

const mockOnLogin = vi.fn();

function renderLogin() {
  return render(<Login onLogin={mockOnLogin} />);
}

describe('Login – initial render', () => {
  test('renders the Login heading', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });

  test('renders username and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/enter your username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
  });

  test('renders Sign in submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders "Register here" link', () => {
    renderLogin();
    expect(screen.getByText(/register here/i)).toBeInTheDocument();
  });

  test('renders "Forgot password?" link', () => {
    renderLogin();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });
});

describe('Login – mode switching', () => {
  test('switches to register mode and shows "Create Account" heading', async () => {
    renderLogin();
    await userEvent.click(screen.getByText(/register here/i));
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });

  test('shows Confirm Password field in register mode', async () => {
    renderLogin();
    await userEvent.click(screen.getByText(/register here/i));
    expect(screen.getByPlaceholderText(/re-type password/i)).toBeInTheDocument();
  });

  test('shows Register submit button in register mode', async () => {
    renderLogin();
    await userEvent.click(screen.getByText(/register here/i));
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('switches to forgot password mode and shows "Update Password" heading', async () => {
    renderLogin();
    await userEvent.click(screen.getByText(/forgot password/i));
    expect(screen.getByRole('heading', { name: /update password/i })).toBeInTheDocument();
  });

  test('switches back to login from register mode', async () => {
    renderLogin();
    await userEvent.click(screen.getByText(/register here/i));
    await userEvent.click(screen.getByText(/login here/i));
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });
});

describe('Login – form validation', () => {
  test('shows password mismatch error in register mode', async () => {
    global.fetch = vi.fn();
    renderLogin();
    await userEvent.click(screen.getByText(/register here/i));
    await userEvent.type(screen.getByPlaceholderText(/enter your username/i), 'alice');
    await userEvent.type(screen.getByPlaceholderText(/enter password/i), 'pass1');
    await userEvent.type(screen.getByPlaceholderText(/re-type password/i), 'pass2');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('Login – API interactions', () => {
  test('calls onLogin with user data on successful login', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, user: { id: 'u1', username: 'alice' } }),
    });
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/enter your username/i), 'alice');
    await userEvent.type(screen.getByPlaceholderText(/enter password/i), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(mockOnLogin).toHaveBeenCalledWith({ id: 'u1', username: 'alice' }));
  });

  test('shows API error message on failed login', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, message: 'Incorrect username or password' }),
    });
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/enter your username/i), 'alice');
    await userEvent.type(screen.getByPlaceholderText(/enter password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/incorrect username or password/i)).toBeInTheDocument();
  });

  test('shows network error message when server is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/enter your username/i), 'alice');
    await userEvent.type(screen.getByPlaceholderText(/enter password/i), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/could not connect/i)).toBeInTheDocument();
  });

  test('shows success message and returns to login after successful registration', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Account created successfully!' }),
    });
    renderLogin();
    await userEvent.click(screen.getByText(/register here/i));
    await userEvent.type(screen.getByPlaceholderText(/enter your username/i), 'newuser');
    await userEvent.type(screen.getByPlaceholderText(/enter password/i), 'pass123');
    await userEvent.type(screen.getByPlaceholderText(/re-type password/i), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/account created successfully/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });
});
