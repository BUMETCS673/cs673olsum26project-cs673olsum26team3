// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
// AI-USAGE SUMMARY
// Tools: Claude (Claude Code)
// Overall AI Contribution: ~35%
// AI-Assisted Areas: Helped fix heading query using getByRole to resolve multiple matches and implemented API call test scenarios
// Human Contributions: Wrote checkbox interaction tests, implemented form validation
// Notes: AI-generated code was significantly refactored and tested before integration

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserStoryInputView from '../views/UserStoryInput/UserStoryInputView';

const mockOnGenerationComplete = vi.fn();
const mockOnBack               = vi.fn();

function renderView() {
  return render(
    <UserStoryInputView
      projectId="proj-1"
      onGenerationComplete={mockOnGenerationComplete}
      onBack={mockOnBack}
    />
  );
}

describe('UserStoryInputView – initial render', () => {
  test('renders the "Generate Test Cases" heading', () => {
    renderView();
    expect(screen.getByRole('heading', { name: /generate test cases/i })).toBeInTheDocument();
  });

  test('renders the user story textarea', () => {
    renderView();
    expect(screen.getByPlaceholderText(/as a user, i want to/i)).toBeInTheDocument();
  });

  test('renders Positive Scenarios checkbox', () => {
    renderView();
    expect(screen.getByLabelText(/positive scenarios/i)).toBeInTheDocument();
  });

  test('renders Negative Scenarios checkbox', () => {
    renderView();
    expect(screen.getByLabelText(/negative scenarios/i)).toBeInTheDocument();
  });

  test('renders Edge Cases checkbox', () => {
    renderView();
    expect(screen.getByLabelText(/edge cases/i)).toBeInTheDocument();
  });

  test('all checkboxes start unchecked', () => {
    renderView();
    expect(screen.getByLabelText(/positive scenarios/i)).not.toBeChecked();
    expect(screen.getByLabelText(/negative scenarios/i)).not.toBeChecked();
    expect(screen.getByLabelText(/edge cases/i)).not.toBeChecked();
  });

  test('renders the Generate Test Cases submit button', () => {
    renderView();
    expect(screen.getByRole('button', { name: /generate test cases/i })).toBeInTheDocument();
  });

  test('renders Back to Test Cases button', () => {
    renderView();
    expect(screen.getByRole('button', { name: /back to test cases/i })).toBeInTheDocument();
  });
});

describe('UserStoryInputView – checkbox interaction', () => {
  test('checks and unchecks Positive Scenarios', async () => {
    renderView();
    const cb = screen.getByLabelText(/positive scenarios/i);
    await userEvent.click(cb);
    expect(cb).toBeChecked();
    await userEvent.click(cb);
    expect(cb).not.toBeChecked();
  });

  test('each checkbox toggles independently', async () => {
    renderView();
    await userEvent.click(screen.getByLabelText(/positive scenarios/i));
    await userEvent.click(screen.getByLabelText(/edge cases/i));
    expect(screen.getByLabelText(/positive scenarios/i)).toBeChecked();
    expect(screen.getByLabelText(/negative scenarios/i)).not.toBeChecked();
    expect(screen.getByLabelText(/edge cases/i)).toBeChecked();
  });
});

describe('UserStoryInputView – form validation', () => {
  test('shows error when textarea is empty on submit', async () => {
    renderView();
    await userEvent.click(screen.getByRole('button', { name: /generate test cases/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot be empty/i);
  });

  test('shows error when no test type is selected', async () => {
    renderView();
    await userEvent.type(
      screen.getByPlaceholderText(/as a user, i want to/i),
      'User can log in'
    );
    await userEvent.click(screen.getByRole('button', { name: /generate test cases/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/select at least one test type/i);
  });

  test('does not call fetch when validation fails', async () => {
    global.fetch = vi.fn();
    renderView();
    await userEvent.click(screen.getByRole('button', { name: /generate test cases/i }));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('UserStoryInputView – API call', () => {
  test('calls fetch with the correct endpoint and payload on valid submit', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success', data: { testCases: [] } }),
    });
    renderView();
    await userEvent.type(
      screen.getByPlaceholderText(/as a user, i want to/i),
      'User can log in'
    );
    await userEvent.click(screen.getByLabelText(/positive scenarios/i));
    await userEvent.click(screen.getByRole('button', { name: /generate test cases/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate-tests'),
      expect.objectContaining({ method: 'POST' })
    ));
  });

  test('calls onGenerationComplete with response data on success', async () => {
    const mockData = { message: 'Done', data: { testCases: [{ id: 'AI-001' }] } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    renderView();
    await userEvent.type(
      screen.getByPlaceholderText(/as a user, i want to/i),
      'User can log in'
    );
    await userEvent.click(screen.getByLabelText(/positive scenarios/i));
    await userEvent.click(screen.getByRole('button', { name: /generate test cases/i }));
    await waitFor(() => expect(mockOnGenerationComplete).toHaveBeenCalledWith(mockData));
  });

  test('shows warning alert when API response includes Warning', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Warning: No product context found.',
        data: { testCases: [] },
      }),
    });
    renderView();
    await userEvent.type(
      screen.getByPlaceholderText(/as a user, i want to/i),
      'Some story'
    );
    await userEvent.click(screen.getByLabelText(/positive scenarios/i));
    await userEvent.click(screen.getByRole('button', { name: /generate test cases/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/warning/i)
    );
  });

  test('shows error message when API returns a non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Generation failed.' }),
    });
    renderView();
    await userEvent.type(
      screen.getByPlaceholderText(/as a user, i want to/i),
      'User can log in'
    );
    await userEvent.click(screen.getByLabelText(/negative scenarios/i));
    await userEvent.click(screen.getByRole('button', { name: /generate test cases/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/generation failed/i);
  });
});
