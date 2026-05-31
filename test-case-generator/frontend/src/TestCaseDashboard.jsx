import React, { useState } from 'react';
import { Trash2, Archive, Edit2, Search, ClipboardList, RotateCcw } from 'lucide-react';

const MOCK_TEST_CASES = [
  {
    id: '1',
    title: 'TC-001: Verify user login with valid credentials',
    createdAt: '2026-05-20',
    status: 'Active',
    content: 'Given a registered user, when they enter a valid username and password, then they should be redirected to the dashboard without error.',
  },
  {
    id: '2',
    title: 'TC-002: Verify user login with invalid credentials',
    createdAt: '2026-05-20',
    status: 'Active',
    content: 'Given a registered user, when they enter an incorrect password, then an error message "Invalid username or password" should be displayed.',
  },
  {
    id: '3',
    title: 'TC-003: Upload a valid PDF document',
    createdAt: '2026-05-21',
    status: 'Active',
    content: 'Given a logged-in user, when they select and upload a PDF file under 20 MB, then the file should appear in the document table with its name, date, and size.',
  },
  {
    id: '4',
    title: 'TC-004: Reject file upload exceeding size limit',
    createdAt: '2026-05-21',
    status: 'Draft',
    content: 'Given a logged-in user, when they attempt to upload a file larger than 20 MB, then an alert should inform them the file was removed due to the size limit.',
  },
  {
    id: '5',
    title: 'TC-005: Reject unsupported file formats',
    createdAt: '2026-05-22',
    status: 'Active',
    content: 'Given a logged-in user, when they attempt to upload a .exe or .mp3 file, then an alert should state that only .pdf, .png, .jpg, and .jpeg formats are allowed.',
  },
  {
    id: '6',
    title: 'TC-006: Delete a document with confirmation',
    createdAt: '2026-05-22',
    status: 'Active',
    content: 'Given a user with at least one uploaded document, when they click "Delete" and confirm the prompt, then the document is permanently removed from the list.',
  },
  {
    id: '7',
    title: 'TC-007: Cancel document deletion',
    createdAt: '2026-05-22',
    status: 'Archived',
    content: 'Given a user with at least one uploaded document, when they click "Delete" but cancel the confirmation prompt, then the document list remains unchanged.',
  },
  {
    id: '8',
    title: 'TC-008: Drag and drop a valid file into the upload zone',
    createdAt: '2026-05-23',
    status: 'Draft',
    content: 'Given a logged-in user, when they drag and drop a valid file onto the upload zone, then the file is added to the selected files preview list.',
  },
  {
    id: '9',
    title: 'TC-009: Search test cases by keyword',
    createdAt: '2026-05-23',
    status: 'Active',
    content: 'Given a user on the test case dashboard with multiple test cases, when they type a keyword into the search bar, then only test cases whose titles or content match are displayed.',
  },
  {
    id: '10',
    title: 'TC-010: Display empty state when no documents exist',
    createdAt: '2026-05-24',
    status: 'Draft',
    content: 'Given a logged-in user who has not uploaded any documents, when they view the document section, then a message "No documents available. Please upload files." is shown.',
  },
];

export default function TestCaseDashboard() {
  const [testCases, setTestCases] = useState(MOCK_TEST_CASES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingCase, setEditingCase] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', status: 'Active', content: '' });

  const count = (status) => testCases.filter((tc) => tc.status === status).length;

  const filtered = testCases.filter((tc) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || tc.title.toLowerCase().includes(q) || tc.content.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || tc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setTestCases((prev) => prev.filter((tc) => tc.id !== id));
    }
  };

  const handleArchiveToggle = (id) => {
    setTestCases((prev) =>
      prev.map((tc) =>
        tc.id === id ? { ...tc, status: tc.status === 'Archived' ? 'Active' : 'Archived' } : tc
      )
    );
  };

  const handleEditOpen = (tc) => {
    setEditingCase(tc);
    setEditForm({ title: tc.title, status: tc.status, content: tc.content });
  };

  const handleEditSave = () => {
    if (!editForm.title.trim()) return;
    setTestCases((prev) =>
      prev.map((tc) =>
        tc.id === editingCase.id ? { ...tc, ...editForm, title: editForm.title.trim() } : tc
      )
    );
    setEditingCase(null);
  };

  const statusKey = (s) => s.toLowerCase();

  return (
    <>
      {/* Page Header */}
      <div className="tc-page-header">
        <h2 className="tc-page-title">Test Cases</h2>
        <p className="tc-page-subtitle">Monitor and manage your generated test cases</p>
      </div>

      {/* Stats Bar */}
      <div className="tc-stats">
        <div className="tc-stat">
          <span className="tc-stat-num">{testCases.length}</span>
          <span className="tc-stat-lbl">Total</span>
        </div>
        <div className="tc-stat tc-stat--active">
          <span className="tc-stat-num">{count('Active')}</span>
          <span className="tc-stat-lbl">Active</span>
        </div>
        <div className="tc-stat tc-stat--draft">
          <span className="tc-stat-num">{count('Draft')}</span>
          <span className="tc-stat-lbl">Draft</span>
        </div>
        <div className="tc-stat tc-stat--archived">
          <span className="tc-stat-num">{count('Archived')}</span>
          <span className="tc-stat-lbl">Archived</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tc-toolbar">
        <div className="tc-search-wrapper">
          <Search size={15} className="tc-search-icon" />
          <input
            type="text"
            placeholder="Search by title or content…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tc-search-input"
            aria-label="Search test cases"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="tc-filter-select"
          aria-label="Filter by status"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
        <span className="tc-result-count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Card Grid */}
      {filtered.length === 0 ? (
        <div className="tc-empty">
          <ClipboardList size={40} className="tc-empty-icon" />
          <p>No test cases found matching your search.</p>
        </div>
      ) : (
        <div className="tc-card-grid">
          {filtered.map((tc) => (
            <div key={tc.id} className={`tc-card tc-card--${statusKey(tc.status)}`}>
              <div className="tc-card-top">
                <span className={`tc-badge tc-badge--${statusKey(tc.status)}`}>{tc.status}</span>
                <span className="tc-card-date">{tc.createdAt}</span>
              </div>

              <h3 className="tc-card-title">{tc.title}</h3>
              <p className="tc-card-excerpt">{tc.content}</p>

              <div className="tc-card-footer">
                <div className="tc-card-actions">
                  <button
                    className="btn-card btn-card--edit"
                    onClick={() => handleEditOpen(tc)}
                    title="Edit test case"
                  >
                    <Edit2 size={12} /> Edit
                  </button>

                  <button
                    className={`btn-card ${tc.status === 'Archived' ? 'btn-card--restore' : 'btn-card--archive'}`}
                    onClick={() => handleArchiveToggle(tc.id)}
                    title={tc.status === 'Archived' ? 'Restore test case' : 'Archive test case'}
                  >
                    {tc.status === 'Archived' ? (
                      <><RotateCcw size={12} /> Restore</>
                    ) : (
                      <><Archive size={12} /> Archive</>
                    )}
                  </button>

                  <button
                    className="btn-card btn-card--delete"
                    onClick={() => handleDelete(tc.id, tc.title)}
                    title="Delete test case"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingCase && (
        <div className="modal-overlay" onClick={() => setEditingCase(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Test Case</h3>

            <label className="modal-label" htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
              className="modal-input"
            />

            <label className="modal-label" htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              value={editForm.status}
              onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
              className="modal-select"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>

            <label className="modal-label" htmlFor="edit-content">Content / Description</label>
            <textarea
              id="edit-content"
              value={editForm.content}
              onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value }))}
              className="modal-textarea"
              rows={5}
            />

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingCase(null)}>Cancel</button>
              <button className="btn-save" onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
