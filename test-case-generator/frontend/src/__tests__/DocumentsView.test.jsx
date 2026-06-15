// AI-USAGE SUMMARY
// Tools: Claude (Claude Code)
// Overall AI Contribution: ~30%
// AI-Assisted Areas: Helped fix button label mismatch and fetch mock setup
// Human Contributions: Implemented document list tests, wrote upload zone and empty state test cases
// Notes: AI-generated code was significantly refactored and tested before integration

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentsView from '../views/Documents/DocumentsView';

const mockOnBack             = vi.fn();
const mockOnNavigateToInput  = vi.fn();

const MOCK_DOCS = [
  { id: 'd1', name: 'spec.pdf',  uploadedAt: '2025-01-01T00:00:00.000Z', status: 'Ready' },
  { id: 'd2', name: 'arch.png',  uploadedAt: '2025-01-02T00:00:00.000Z', status: 'Ready' },
];

function renderDocs(fetchImpl) {
  global.fetch = vi.fn().mockImplementation(fetchImpl ?? (() =>
    Promise.resolve({ ok: true, json: async () => MOCK_DOCS })
  ));
  return render(
    <DocumentsView
      projectId="proj-1"
      projectName="Test Project"
      onBack={mockOnBack}
      onNavigateToInput={mockOnNavigateToInput}
    />
  );
}

describe('DocumentsView – initial render', () => {
  test('renders the drag-and-drop upload zone', async () => {
    renderDocs();
    expect(document.querySelector('div.border-dashed')).toBeInTheDocument();
  });

  test('renders the Back to Projects button', async () => {
    renderDocs();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  test('renders the Generate Tests navigation button', async () => {
    renderDocs();
    expect(screen.getByRole('button', { name: /generate tests/i })).toBeInTheDocument();
  });

  test('calls onBack when Back button is clicked', async () => {
    renderDocs();
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockOnBack).toHaveBeenCalled();
  });

  test('calls onNavigateToInput when Generate Tests is clicked', async () => {
    renderDocs();
    await userEvent.click(screen.getByRole('button', { name: /generate tests/i }));
    expect(mockOnNavigateToInput).toHaveBeenCalled();
  });
});

describe('DocumentsView – document list', () => {
  test('fetches documents for the project on mount', async () => {
    renderDocs();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/upload/proj-1')
    ));
  });

  test('renders a row for each fetched document', async () => {
    renderDocs();
    await waitFor(() => expect(screen.getByText('spec.pdf')).toBeInTheDocument());
    expect(screen.getByText('arch.png')).toBeInTheDocument();
  });

  test('shows the document table', async () => {
    renderDocs();
    await waitFor(() => expect(document.querySelector('main table')).toBeInTheDocument());
  });
});

describe('DocumentsView – empty state', () => {
  test('shows empty state message when no documents are returned', async () => {
    renderDocs(() => Promise.resolve({ ok: true, json: async () => [] }));
    await waitFor(() =>
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument()
    );
  });
});

describe('DocumentsView – file input', () => {
  test('renders a hidden file input accepting PDF and images', () => {
    renderDocs();
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });
});
