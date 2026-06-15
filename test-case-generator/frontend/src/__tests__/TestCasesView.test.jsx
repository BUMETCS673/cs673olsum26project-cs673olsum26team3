// AI-USAGE SUMMARY
// Tools: Claude (Claude Code)
// Overall AI Contribution: ~40%
// AI-Assisted Areas: Helped with row expansion click pattern and type filter header test
// Human Contributions: Implemented search filter tests, Create modal tests, AI-xxx ID assertions, empty state test
// Notes: AI-generated code was significantly refactored and tested before integration

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestCasesView from '../views/TestCases/TestCasesView';

const mockOnBack              = vi.fn();
const mockOnNavigateToInput   = vi.fn();

const MOCK_STORIES = [
  {
    _id: 'story-1',
    requirement: 'Login feature',
    generatedAt: '2025-01-01T00:00:00.000Z',
    options: { manual: false },
    testCases: [
      { id: 'AI-001', title: 'Verify successful login', type: 'Functional', priority: 'High',
        preconditions: 'User exists', steps: ['Open login', 'Enter creds'], expectedResults: 'Dashboard shown' },
      { id: 'AI-002', title: 'Verify login fails with wrong password', type: 'Negative', priority: 'High',
        preconditions: 'User exists', steps: ['Open login', 'Enter wrong pass'], expectedResults: 'Error shown' },
    ],
  },
  {
    _id: 'story-2',
    requirement: 'Upload feature',
    generatedAt: '2025-01-02T00:00:00.000Z',
    options: { manual: false },
    testCases: [
      { id: 'AI-003', title: 'Verify PDF upload succeeds', type: 'Functional', priority: 'Medium',
        preconditions: 'User is logged in', steps: ['Select PDF'], expectedResults: 'File appears in list' },
    ],
  },
];

function setupFetch(stories = MOCK_STORIES) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => stories,
  });
}

function renderView(props = {}) {
  return render(
    <TestCasesView
      projectId="proj-1"
      projectName="Test Project"
      onBack={mockOnBack}
      onNavigateToInput={mockOnNavigateToInput}
      generatedData={null}
      {...props}
    />
  );
}

describe('TestCasesView – data loading', () => {
  test('fetches test cases for the project on mount', async () => {
    setupFetch();
    renderView();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate-tests/proj-1')
    ));
  });

  test('renders all fetched test case titles', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByText(/verify successful login/i)).toBeInTheDocument();
    expect(await screen.findByText(/verify login fails/i)).toBeInTheDocument();
    expect(await screen.findByText(/verify pdf upload/i)).toBeInTheDocument();
  });

  test('renders test case IDs in AI-xxx format', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByText('AI-001')).toBeInTheDocument();
    expect(await screen.findByText('AI-002')).toBeInTheDocument();
    expect(await screen.findByText('AI-003')).toBeInTheDocument();
  });
});

describe('TestCasesView – header elements', () => {
  test('renders the page heading with project name', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByText(/test project/i)).toBeInTheDocument();
  });

  test('renders Export As button', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('button', { name: /export as/i })).toBeInTheDocument();
  });

  test('renders the Create button', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('button', { name: /create test case/i })).toBeInTheDocument();
  });

  test('renders the Generate button', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByRole('button', { name: /generate tests/i })).toBeInTheDocument();
  });
});

describe('TestCasesView – search filter', () => {
  test('search input is rendered', async () => {
    setupFetch();
    renderView();
    expect(await screen.findByPlaceholderText(/search test cases/i)).toBeInTheDocument();
  });

  test('filters test cases by search keyword', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    await userEvent.type(screen.getByPlaceholderText(/search test cases/i), 'pdf');
    await waitFor(() => {
      expect(screen.queryByText(/verify successful login/i)).not.toBeInTheDocument();
      expect(screen.getByText(/verify pdf upload/i)).toBeInTheDocument();
    });
  });

  test('restores all rows when search is cleared', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    const searchInput = screen.getByPlaceholderText(/search test cases/i);
    await userEvent.type(searchInput, 'pdf');
    await userEvent.clear(searchInput);
    await waitFor(() =>
      expect(screen.getByText(/verify successful login/i)).toBeInTheDocument()
    );
  });
});

describe('TestCasesView – type filter', () => {
  test('clicking Type header cycles to Functional filter', async () => {
    setupFetch();
    renderView();
    const typeHeader = await screen.findByText(/^type$/i);
    await userEvent.click(typeHeader.closest('th'));
    await waitFor(() => {
      expect(screen.queryByText(/verify login fails/i)).not.toBeInTheDocument();
      expect(screen.getByText(/verify successful login/i)).toBeInTheDocument();
    });
  });
});

describe('TestCasesView – row expansion', () => {
  test('clicking a row expands it to show test steps', async () => {
    setupFetch();
    renderView();
    const row = await screen.findByText(/verify successful login/i);
    await userEvent.click(row.closest('tr'));
    await waitFor(() =>
      expect(screen.getByText('Open login')).toBeInTheDocument()
    );
  });

  test('expanded row shows Expected Result', async () => {
    setupFetch();
    renderView();
    const row = await screen.findByText(/verify successful login/i);
    await userEvent.click(row.closest('tr'));
    await waitFor(() =>
      expect(screen.getByText(/dashboard shown/i)).toBeInTheDocument()
    );
  });
});

describe('TestCasesView – Create manual test case modal', () => {
  test('opens the Create modal when Create button is clicked', async () => {
    setupFetch();
    renderView();
    await screen.findByRole('button', { name: /create test case/i });
    await userEvent.click(screen.getByRole('button', { name: /^create test case$/i }));
    expect(await screen.findByText(/create manual test case/i)).toBeInTheDocument();
  });

  test('closes the modal when Cancel is clicked', async () => {
    setupFetch();
    renderView();
    await screen.findByRole('button', { name: /^create test case$/i });
    await userEvent.click(screen.getByRole('button', { name: /^create test case$/i }));
    await screen.findByText(/create manual test case/i);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.queryByText(/create manual test case/i)).not.toBeInTheDocument()
    );
  });
});

describe('TestCasesView – empty state', () => {
  test('shows empty message when no test cases match filters', async () => {
    setupFetch();
    renderView();
    await screen.findByText(/verify successful login/i);
    await userEvent.type(
      screen.getByPlaceholderText(/search test cases/i),
      'xyznonexistentword'
    );
    await waitFor(() =>
      expect(screen.getByText(/no test cases match filters/i)).toBeInTheDocument()
    );
  });
});
