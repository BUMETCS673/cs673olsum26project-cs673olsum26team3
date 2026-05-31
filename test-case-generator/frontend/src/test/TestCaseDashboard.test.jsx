import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TestCaseDashboard from '../TestCaseDashboard';

describe('TestCaseDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── Test 1 ────────────────────────────────────────────────────────────────
  it('renders all 10 mock test cases on initial load', () => {
    render(<TestCaseDashboard />);

    // Every card title is an <h3> — there should be exactly 10
    const cardTitles = screen.getAllByRole('heading', { level: 3 });
    expect(cardTitles).toHaveLength(10);

    // Result count label should reflect 10
    expect(screen.getByText('10 results')).toBeInTheDocument();

    // Stats bar shows correct totals for each status
    // Active: TC-001,002,003,005,006,009 = 6
    // Draft:  TC-004,008,010            = 3
    // Archived: TC-007                  = 1
    const statNumbers = screen.getAllByText(/^\d+$/);
    const values = statNumbers.map((el) => el.textContent);
    expect(values).toContain('10'); // Total
    expect(values).toContain('6');  // Active
    expect(values).toContain('3');  // Draft
    expect(values).toContain('1');  // Archived
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────
  it('filters test cases by title keyword in the search bar', async () => {
    const user = userEvent.setup();
    render(<TestCaseDashboard />);

    const searchInput = screen.getByRole('textbox', { name: /search test cases/i });
    await user.type(searchInput, 'TC-003');

    // Only TC-003 should survive the filter
    const cardTitles = screen.getAllByRole('heading', { level: 3 });
    expect(cardTitles).toHaveLength(1);
    expect(cardTitles[0]).toHaveTextContent('TC-003: Upload a valid PDF document');
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────
  it('filters test cases by status using the status dropdown', async () => {
    const user = userEvent.setup();
    render(<TestCaseDashboard />);

    const filterSelect = screen.getByRole('combobox', { name: /filter by status/i });
    await user.selectOptions(filterSelect, 'Draft');

    // Draft test cases: TC-004, TC-008, TC-010 — exactly 3
    const cardTitles = screen.getAllByRole('heading', { level: 3 });
    expect(cardTitles).toHaveLength(3);
    expect(screen.getByText('3 results')).toBeInTheDocument();

    // Every visible badge must say "Draft"
    screen.getAllByText('Draft').forEach((badge) => {
      expect(badge).toBeInTheDocument();
    });
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────
  it('archives an active test case and switches the button to Restore', async () => {
    const user = userEvent.setup();
    render(<TestCaseDashboard />);

    // Locate TC-001 card
    const titleEl = screen.getByText('TC-001: Verify user login with valid credentials');
    const card = titleEl.closest('.tc-card');

    // Initially Active — Archive button should be present
    const archiveBtn = within(card).getByTitle('Archive test case');
    expect(archiveBtn).toBeInTheDocument();

    await user.click(archiveBtn);

    // After archiving: Restore button appears, badge changes to Archived
    expect(within(card).getByTitle('Restore test case')).toBeInTheDocument();
    expect(within(card).getByText('Archived')).toBeInTheDocument();
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────
  it('removes a test case from the list when the user confirms deletion', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<TestCaseDashboard />);

    // Locate TC-002 card and click Delete
    const titleEl = screen.getByText('TC-002: Verify user login with invalid credentials');
    const card = titleEl.closest('.tc-card');
    const deleteBtn = within(card).getByTitle('Delete test case');

    await user.click(deleteBtn);

    // Card is gone
    expect(
      screen.queryByText('TC-002: Verify user login with invalid credentials')
    ).not.toBeInTheDocument();

    // Total drops from 10 to 9
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(9);
  });
});
