// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
// AI-USAGE SUMMARY
// Tools: Claude (Claude Code)
// Overall AI Contribution: ~60%
// AI-Assisted Areas: Fixed duplicate element issue with getAllByText, helped with selectOptions dropdown tests and implemented tet case filtering scenarios 
// Human Contributions: Implemented status pill filter tests, clear filter tests, edit modal tests
// Notes: AI-generated code was significantly refactored and tested before integration

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestCaseManagementView from '../views/TestCaseManagement/TestCaseManagementView';

const mockOnBack = vi.fn();

const MOCK_TEST_CASES = [
  {
    id: 'AI-001', storyId: 'story-1', projectId: 'proj-1', projectName: 'Alpha',
    title: 'Verify successful login', type: 'Functional', priority: 'High',
    preconditions: 'User exists', steps: ['Open login'], expectedResults: 'Dashboard shown',
    createdAt: '2025-01-01T00:00:00.000Z', archived: false, isManual: false,
  },
  {
    id: 'AI-002', storyId: 'story-1', projectId: 'proj-1', projectName: 'Alpha',
    title: 'Verify login fails with wrong password', type: 'Negative', priority: 'High',
    preconditions: 'User exists', steps: ['Enter wrong pass'], expectedResults: 'Error shown',
    createdAt: '2025-01-01T00:00:00.000Z', archived: false, isManual: false,
  },
  {
    id: 'AI-003', storyId: 'story-2', projectId: 'proj-1', projectName: 'Alpha',
    title: 'Verify PDF upload succeeds', type: 'Functional', priority: 'Medium',
    preconditions: 'Logged in', steps: ['Select PDF'], expectedResults: 'File listed',
    createdAt: '2025-01-02T00:00:00.000Z', archived: true, isManual: false,
  },
];

function setupFetch(tcs = MOCK_TEST_CASES) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => tcs,
  });
}

function renderView() {
  return render(<TestCaseManagementView userId="u1" onBack={mockOnBack} />);
}

describe('TestCaseManagementView – data loading', () => {
  test('fetches all test cases for the user on mount', async () => {
    setupFetch();
    renderView();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/test-cases/all?userId=u1')
    ));
  });

  test('renders test case titles after loading', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByText(/verify successful login/i)).toBeInTheDocument();
    expect(await screen.findByText(/verify login fails/i)).toBeInTheDocument();
    expect(await screen.findByText(/verify pdf upload/i)).toBeInTheDocument();
  });

  test('renders project name badges', async () => {
    setupFetch();
    renderView();
    const badges = await screen.findAllByText('Alpha');
    expect(badges.length).toBeGreaterThan(0);
  });

  test('renders test case IDs', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByText('AI-001')).toBeInTheDocument();
  });
});

describe('TestCaseManagementView – page header', () => {
  test('shows the Test Case Management heading', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('heading', { name: /test case management/i })).toBeInTheDocument();
  });

  test('renders the Export button', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  test('renders the Back to Projects button', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('button', { name: /back to projects/i })).toBeInTheDocument();
  });

  test('calls onBack when Back to Projects is clicked', async () => {
    setupFetch();
    renderView();
    await screen.findByRole('button', { name: /back to projects/i });
    await userEvent.click(screen.getByRole('button', { name: /back to projects/i }));
    expect(mockOnBack).toHaveBeenCalled();
  });
});

describe('TestCaseManagementView – search filter', () => {
  test('renders the search input', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByPlaceholderText(/search by title/i)).toBeInTheDocument();
  });

  test('filters test cases by search keyword', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    await userEvent.type(screen.getByPlaceholderText(/search by title/i), 'pdf');
    await waitFor(() => {
      expect(screen.queryByText(/verify successful login/i)).not.toBeInTheDocument();
      expect(screen.getByText(/verify pdf upload/i)).toBeInTheDocument();
    });
  });

  test('shows "X shown" count when search is active', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    await userEvent.type(screen.getByPlaceholderText(/search by title/i), 'login');
    await waitFor(() => expect(screen.getByText(/shown/i)).toBeInTheDocument());
  });
});

describe('TestCaseManagementView – dropdown filters', () => {
  test('renders All Types dropdown', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('combobox', { name: /filter by type/i })).toBeInTheDocument();
  });

  test('renders All Priorities dropdown', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('combobox', { name: /filter by priority/i })).toBeInTheDocument();
  });

  test('renders All Projects dropdown', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('combobox', { name: /filter by project/i })).toBeInTheDocument();
  });

  test('filtering by Negative type hides Functional test cases', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /filter by type/i }),
      'Negative'
    );
    await waitFor(() => {
      expect(screen.queryByText(/verify successful login/i)).not.toBeInTheDocument();
      expect(screen.getByText(/verify login fails/i)).toBeInTheDocument();
    });
  });

  test('filtering by Medium priority hides High priority cases', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /filter by priority/i }),
      'Medium'
    );
    await waitFor(() => {
      expect(screen.queryByText(/verify successful login/i)).not.toBeInTheDocument();
      expect(screen.getByText(/verify pdf upload/i)).toBeInTheDocument();
    });
  });
});

describe('TestCaseManagementView – status filter', () => {
  test('renders All / Active / Archived status pills', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^active$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^archived$/i })).toBeInTheDocument();
  });

  test('Active pill hides archived test cases', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify pdf upload/i);
    await userEvent.click(screen.getByRole('button', { name: /^active$/i }));
    await waitFor(() =>
      expect(screen.queryByText(/verify pdf upload/i)).not.toBeInTheDocument()
    );
  });

  test('Archived pill shows only archived test cases', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    await userEvent.click(screen.getByRole('button', { name: /^archived$/i }));
    await waitFor(() => {
      expect(screen.queryByText(/verify successful login/i)).not.toBeInTheDocument();
      expect(screen.getByText(/verify pdf upload/i)).toBeInTheDocument();
    });
  });
});

describe('TestCaseManagementView – clear filters', () => {
  test('shows Clear button when a filter is active', async () => {
    setupFetch();
    renderView();
    await screen.findByPlaceholderText(/search by title/i);
    await userEvent.type(screen.getByPlaceholderText(/search by title/i), 'login');
    await waitFor(() => expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument());
  });

  test('Clear button removes the active filter', async () => {
    setupFetch();
    renderView();
    await screen.findByPlaceholderText(/search by title/i);
    await userEvent.type(screen.getByPlaceholderText(/search by title/i), 'login');
    await screen.findByRole('button', { name: /clear/i });
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    await waitFor(() =>
      expect(screen.getByText(/verify pdf upload/i)).toBeInTheDocument()
    );
  });
});

describe('TestCaseManagementView – edit modal', () => {
  test('opens Edit modal when edit button is clicked', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    const editButtons = screen.getAllByTitle(/edit/i);
    await userEvent.click(editButtons[0]);
    expect(await screen.findByText(/edit test case/i)).toBeInTheDocument();
  });

  test('edit modal shows the test case ID', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    await userEvent.click(screen.getAllByTitle(/edit/i)[0]);
    await screen.findByText(/edit test case/i);
    const matches = screen.getAllByText('AI-001');
    expect(matches.length).toBeGreaterThan(0);
  });

  test('closes edit modal when X button is clicked', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    await userEvent.click(screen.getAllByTitle(/edit/i)[0]);
    await screen.findByText(/edit test case/i);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.queryByText(/edit test case/i)).not.toBeInTheDocument()
    );
  });
});
