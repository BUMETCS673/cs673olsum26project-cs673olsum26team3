import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Search, Download, Pencil, Archive, ArchiveRestore,
  Trash2, X, FileSpreadsheet, Code,
} from 'lucide-react';
import { authFetch } from '../../utils/api';

const BASE = '';

const LABEL_STYLE = {
  display: 'block', fontSize: '13px', fontWeight: '500',
  color: '#374151', marginBottom: '6px',
};
const INPUT_STYLE = {
  width: '100%', padding: '9px 12px', borderRadius: '6px',
  border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none',
};
const SELECT_CLS =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer';

function typeBadgeCls(type) {
  switch (String(type || '').trim()) {
    case 'Functional': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Negative':   return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Edge Case':  return 'bg-amber-50 text-amber-700 border-amber-200';
    default:           return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function priorityColor(priority) {
  switch (String(priority || '').trim()) {
    case 'High': return '#dc2626';
    case 'Low':  return '#9ca3af';
    default:     return '#2563eb';
  }
}

export default function TestCaseManagementView({ userId, onBack }) {
  // ── data ──────────────────────────────────────────────────────────────────
  const [testCases, setTestCases]     = useState([]);
  const [isLoading, setIsLoading]     = useState(true);

  // ── filters ───────────────────────────────────────────────────────────────
  const [search,    setSearch]    = useState('');
  const [fProject,  setFProject]  = useState('All');
  const [fType,     setFType]     = useState('All');
  const [fPriority, setFPriority] = useState('All');
  const [fStatus,   setFStatus]   = useState('All'); // All | Active | Archived

  // ── edit modal ────────────────────────────────────────────────────────────
  const [editing,  setEditing]  = useState(null);
  const [editForm, setEditForm] = useState({});

  // ── export dropdown ───────────────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res  = await authFetch(`${BASE}/api/test-cases/all?userId=${userId}`);
      const data = await res.json();
      setTestCases(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setTestCases([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // ── derived filter options ────────────────────────────────────────────────
  const projectOptions  = useMemo(() => ['All', ...[...new Set(testCases.map(t => t.projectName).filter(Boolean))]], [testCases]);
  const typeOptions     = useMemo(() => ['All', ...[...new Set(testCases.map(t => t.type).filter(Boolean))]], [testCases]);
  const priorityOptions = useMemo(() => ['All', ...[...new Set(testCases.map(t => t.priority).filter(Boolean))]], [testCases]);

  // ── filtered result ───────────────────────────────────────────────────────
  const filtered = useMemo(() => testCases.filter(tc => {
    if (fProject  !== 'All' && tc.projectName !== fProject)  return false;
    if (fType     !== 'All' && tc.type        !== fType)     return false;
    if (fPriority !== 'All' && tc.priority    !== fPriority) return false;
    if (fStatus === 'Active'   &&  tc.archived) return false;
    if (fStatus === 'Archived' && !tc.archived) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      tc.title?.toLowerCase().includes(q)           ||
      tc.preconditions?.toLowerCase().includes(q)   ||
      tc.expectedResults?.toLowerCase().includes(q) ||
      tc.projectName?.toLowerCase().includes(q)     ||
      (tc.steps || []).some(s => s.toLowerCase().includes(q))
    );
  }), [testCases, fProject, fType, fPriority, fStatus, search]);

  const hasFilters = fProject !== 'All' || fType !== 'All' || fPriority !== 'All' || fStatus !== 'All' || search.trim();
  const clearFilters = () => { setSearch(''); setFProject('All'); setFType('All'); setFPriority('All'); setFStatus('All'); };

  // ── handlers ──────────────────────────────────────────────────────────────
  const openEdit = tc => {
    setEditing(tc);
    setEditForm({
      title:           tc.title           || '',
      type:            tc.type            || 'Functional',
      priority:        tc.priority        || 'Medium',
      preconditions:   tc.preconditions   || '',
      steps:           (tc.steps || []).join('\n'),
      expectedResults: tc.expectedResults || '',
    });
  };

  const saveEdit = async e => {
    e.preventDefault();
    const body = { ...editForm, steps: editForm.steps.split('\n').filter(s => s.trim()) };
    try {
      const res = await authFetch(
        `${BASE}/api/test-cases/${editing.storyId}/cases/${editing.id}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      );
      if (res.ok) {
        setTestCases(prev => prev.map(t =>
          t.id === editing.id && t.storyId === editing.storyId ? { ...t, ...body } : t,
        ));
        setEditing(null);
      }
    } catch (err) {
      console.error('Error saving edit:', err);
    }
  };

  const toggleArchive = async tc => {
    try {
      const res = await authFetch(
        `${BASE}/api/test-cases/${tc.storyId}/cases/${tc.id}/archive`,
        { method: 'PATCH' },
      );
      if (res.ok) {
        const { archived } = await res.json();
        setTestCases(prev => prev.map(t =>
          t.id === tc.id && t.storyId === tc.storyId ? { ...t, archived } : t,
        ));
      }
    } catch (err) {
      console.error('Error toggling archive:', err);
    }
  };

  const deleteTC = async tc => {
    if (!window.confirm(`Delete "${tc.title}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(
        `${BASE}/api/test-cases/${tc.storyId}/cases/${tc.id}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setTestCases(prev => prev.filter(t => !(t.id === tc.id && t.storyId === tc.storyId)));
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  // ── export ────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Project', 'Type', 'Priority', 'Status', 'Created', 'Preconditions', 'Expected Results'];
    const rows = filtered.map(tc => [
      tc.id,
      `"${(tc.title           || '').replace(/"/g, '""')}"`,
      `"${(tc.projectName     || '').replace(/"/g, '""')}"`,
      tc.type, tc.priority,
      tc.archived ? 'Archived' : 'Active',
      tc.createdAt ? new Date(tc.createdAt).toLocaleDateString() : '',
      `"${(tc.preconditions   || '').replace(/"/g, '""')}"`,
      `"${(tc.expectedResults || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `SpecCheck_TestCases_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); a.remove();
    setExportOpen(false);
  };

  const exportJSON = () => {
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    a.download = `SpecCheck_TestCases_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); a.remove();
    setExportOpen(false);
  };

  // ── render ────────────────────────────────────────────────────────────────
  const projectCount = projectOptions.length - 1;

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer"
          style={{ width: 'fit-content', transition: 'all 0.2s ease' }}
          onMouseOver={e  => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
          onMouseOut={e   => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Test Case Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              {testCases.length} test case{testCases.length !== 1 ? 's' : ''} across {projectCount} project{projectCount !== 1 ? 's' : ''}
              {hasFilters && <span className="ml-2 font-medium text-blue-600">· {filtered.length} shown</span>}
            </p>
          </div>

          {/* Export dropdown */}
          <div
            className="relative flex-shrink-0"
            onMouseEnter={() => setExportOpen(true)}
            onMouseLeave={() => setExportOpen(false)}
          >
            <button
              style={{ backgroundColor: '#2563eb', transition: 'all 0.2s ease' }}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white cursor-pointer shadow-sm"
              onMouseOver={e  => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
              onMouseOut={e   => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
            >
              <Download size={16} />
              Export
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full pt-1 z-30 w-44">
                <div className="rounded-lg border border-gray-200 bg-white shadow-xl py-1">
                  <button
                    onClick={exportCSV}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left cursor-pointer"
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                    onMouseOut={e  => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <FileSpreadsheet size={14} className="text-blue-500" />
                    Export CSV
                  </button>
                  <button
                    onClick={exportJSON}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left cursor-pointer"
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                    onMouseOut={e  => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Code size={14} className="text-blue-500" />
                    Export JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search + filter toolbar */}
        <div className="mb-5 space-y-3">
          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <Search size={16} className="flex-shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, content, or project…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Project filter */}
            <select value={fProject} onChange={e => setFProject(e.target.value)} className={SELECT_CLS} aria-label="Filter by project">
              {projectOptions.map(p => (
                <option key={p} value={p}>{p === 'All' ? 'All Projects' : p}</option>
              ))}
            </select>

            {/* Type filter */}
            <select value={fType} onChange={e => setFType(e.target.value)} className={SELECT_CLS} aria-label="Filter by type">
              {typeOptions.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>

            {/* Priority filter */}
            <select value={fPriority} onChange={e => setFPriority(e.target.value)} className={SELECT_CLS} aria-label="Filter by priority">
              {priorityOptions.map(p => (
                <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>
              ))}
            </select>

            {/* Status pill tabs */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
              {['All', 'Active', 'Archived'].map(s => (
                <button
                  key={s}
                  onClick={() => setFStatus(s)}
                  className={`px-3 py-1.5 cursor-pointer transition-colors ${
                    fStatus === s
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Clear button */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full min-w-[1000px] text-left border-collapse bg-white">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap w-24">ID</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[220px]">Title</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">Project</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">Created</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap w-28">Type</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap w-24">Priority</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap w-24">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right whitespace-nowrap w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-sm text-gray-400">
                    Loading test cases…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-sm text-gray-400">
                    {testCases.length === 0
                      ? 'No test cases found. Generate some from a project first.'
                      : 'No test cases match the current filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map(tc => (
                  <tr
                    key={`${tc.storyId}_${tc.id}`}
                    className={`transition-colors hover:bg-gray-50 ${tc.archived ? 'opacity-50' : ''}`}
                  >
                    {/* ID */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-mono font-semibold text-gray-500 whitespace-nowrap">{tc.id}</span>
                    </td>

                    {/* Title + preconditions */}
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{tc.title}</p>
                      {tc.preconditions && (
                        <p className="mt-0.5 text-xs text-gray-400 truncate">
                          <strong>Pre:</strong> {tc.preconditions}
                        </p>
                      )}
                    </td>

                    {/* Project */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 whitespace-nowrap max-w-[160px] truncate">
                        {tc.projectName}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-gray-500">
                        {tc.createdAt ? new Date(tc.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>

                    {/* Type badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${typeBadgeCls(tc.type)}`}>
                        {tc.type}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium whitespace-nowrap" style={{ color: priorityColor(tc.priority) }}>
                        {tc.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {tc.archived ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 whitespace-nowrap">
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(tc)}
                          title="Edit"
                          className="rounded-lg p-1.5 text-gray-400 cursor-pointer transition-colors"
                          onMouseOver={e  => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                          onMouseOut={e   => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleArchive(tc)}
                          title={tc.archived ? 'Unarchive' : 'Archive'}
                          className="rounded-lg p-1.5 text-gray-400 cursor-pointer transition-colors"
                          onMouseOver={e  => { e.currentTarget.style.color = '#d97706'; e.currentTarget.style.backgroundColor = '#fffbeb'; }}
                          onMouseOut={e   => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {tc.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                        </button>
                        <button
                          onClick={() => deleteTC(tc)}
                          title="Delete"
                          className="rounded-lg p-1.5 text-gray-400 cursor-pointer transition-colors"
                          onMouseOver={e  => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                          onMouseOut={e   => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editing && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff', borderRadius: '12px',
              padding: '32px', width: '100%', maxWidth: '560px',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Edit Test Case</h2>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{editing.id}</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEdit}>
              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={LABEL_STYLE}>Title</label>
                <input
                  type="text"
                  required
                  style={INPUT_STYLE}
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Describe what this test case verifies"
                />
              </div>

              {/* Type + Priority row */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={LABEL_STYLE}>Type</label>
                  <select
                    style={INPUT_STYLE}
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                  >
                    <option>Functional</option>
                    <option>Negative</option>
                    <option>Edge Case</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={LABEL_STYLE}>Priority</label>
                  <select
                    style={INPUT_STYLE}
                    value={editForm.priority}
                    onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              {/* Preconditions */}
              <div style={{ marginBottom: '16px' }}>
                <label style={LABEL_STYLE}>Preconditions</label>
                <textarea
                  rows="2"
                  style={INPUT_STYLE}
                  value={editForm.preconditions}
                  onChange={e => setEditForm({ ...editForm, preconditions: e.target.value })}
                  placeholder="What must be true before this test runs?"
                />
              </div>

              {/* Steps */}
              <div style={{ marginBottom: '16px' }}>
                <label style={LABEL_STYLE}>Steps <span style={{ fontWeight: 400, color: '#9ca3af' }}>(one per line)</span></label>
                <textarea
                  rows="5"
                  required
                  style={INPUT_STYLE}
                  value={editForm.steps}
                  onChange={e => setEditForm({ ...editForm, steps: e.target.value })}
                  placeholder="1. Navigate to…&#10;2. Click…&#10;3. Verify…"
                />
              </div>

              {/* Expected results */}
              <div style={{ marginBottom: '24px' }}>
                <label style={LABEL_STYLE}>Expected Results</label>
                <textarea
                  rows="3"
                  required
                  style={INPUT_STYLE}
                  value={editForm.expectedResults}
                  onChange={e => setEditForm({ ...editForm, expectedResults: e.target.value })}
                  placeholder="What should happen when all steps are executed correctly?"
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    border: '1px solid #d1d5db', background: '#ffffff',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={e  => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                  onMouseOut={e   => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    border: 'none', background: '#000000',
                    color: '#ffffff', fontWeight: '500',
                    cursor: 'pointer', fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={e  => { e.currentTarget.style.backgroundColor = '#374151'; }}
                  onMouseOut={e   => { e.currentTarget.style.backgroundColor = '#000000'; }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
