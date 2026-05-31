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
    title: 'TC-009: Search documents by keyword',
    createdAt: '2026-05-23',
    status: 'Active',
    content: 'Given a user on the test case dashboard with multiple test cases, when they type a keyword into the search bar, then only test cases whose titles or content match that keyword are displayed.',
  },
  {
    id: '10',
    title: 'TC-010: Display empty state when no documents exist',
    createdAt: '2026-05-24',
    status: 'Draft',
    content: 'Given a logged-in user who has not uploaded any documents, when they view the document section, then a message "No documents available. Please upload files." is shown.',
  },
];

const STATUS_STYLE = {
  Active: { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' },
  Draft: { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' },
  Archived: { background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' },
};

export default function TestCaseDashboard() {
  const [testCases, setTestCases] = useState(MOCK_TEST_CASES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingCase, setEditingCase] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', status: 'Active', content: '' });

  const filtered = testCases.filter((tc) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      tc.title.toLowerCase().includes(q) ||
      tc.content.toLowerCase().includes(q);
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
        tc.id === id
          ? { ...tc, status: tc.status === 'Archived' ? 'Active' : 'Archived' }
          : tc
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

  return (
    <div className="tc-dashboard">
      <div className="tc-toolbar">
        <div className="tc-search-wrapper">
          <Search size={16} className="tc-search-icon" />
          <input
            type="text"
            placeholder="Search by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tc-search-input"
            aria-label="Search test cases"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="tc-status-filter"
          aria-label="Filter by status"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>

        <span className="tc-count">
          {filtered.length} test case{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="no-data">No test cases found matching your search.</p>
      ) : (
        <div className="tc-table-wrapper">
          <table className="tc-table">
            <colgroup>
              <col style={{ width: '42%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '32%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Title</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tc) => (
                <tr key={tc.id}>
                  <td className="tc-title-cell">
                    <div className="tc-title-wrapper">
                      <ClipboardList size={15} className="tc-icon" />
                      <span>{tc.title}</span>
                    </div>
                  </td>
                  <td>{tc.createdAt}</td>
                  <td>
                    <span className="tc-status-badge" style={STATUS_STYLE[tc.status]}>
                      {tc.status}
                    </span>
                  </td>
                  <td>
                    <div className="tc-actions">
                      <button
                        className="btn-tc btn-edit"
                        onClick={() => handleEditOpen(tc)}
                        title="Edit test case"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        className={`btn-tc ${tc.status === 'Archived' ? 'btn-restore' : 'btn-archive'}`}
                        onClick={() => handleArchiveToggle(tc.id)}
                        title={tc.status === 'Archived' ? 'Restore test case' : 'Archive test case'}
                      >
                        {tc.status === 'Archived' ? (
                          <>
                            <RotateCcw size={13} />
                            <span>Restore</span>
                          </>
                        ) : (
                          <>
                            <Archive size={13} />
                            <span>Archive</span>
                          </>
                        )}
                      </button>

                      <button
                        className="btn-tc btn-delete"
                        onClick={() => handleDelete(tc.id, tc.title)}
                        title="Delete test case"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingCase && (
        <div className="modal-overlay" onClick={() => setEditingCase(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Test Case</h3>

            <label className="modal-label" htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              className="modal-input"
            />

            <label className="modal-label" htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              value={editForm.status}
              onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
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
              onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
              className="modal-textarea"
              rows={5}
            />

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingCase(null)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleEditSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
