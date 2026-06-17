import React, { useState } from 'react';
import { CheckCircle, XCircle, Trash2, Edit3, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config';

export default function TestReviewView({ draftData, onConfirm, onCancel }) {
  const [testCases, setTestCases] = useState(draftData.testCases || []);
  const [impactedFeatures, setImpactedFeatures] = useState(draftData.impactedFeatures || []);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = (id) => {
    const updatedTCs = testCases.filter(tc => tc.id !== id);
    setTestCases(updatedTCs);

    // Sync impacted features: remove the deleted ID from all features
    const updatedFeatures = impactedFeatures.map(feat => ({
      ...feat,
      relatedTestIds: (feat.relatedTestIds || []).filter(tcId => tcId !== id)
    })).filter(feat => feat.relatedTestIds.length > 0);
    
    setImpactedFeatures(updatedFeatures);
  };

  const startEditing = (tc) => {
    setEditingId(tc.id);
    setEditForm({ ...tc, steps: Array.isArray(tc.steps) ? tc.steps.join('\n') : tc.steps });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = () => {
    setTestCases(testCases.map(tc => 
      tc.id === editingId ? { ...editForm, steps: editForm.steps.split('\n').filter(s => s.trim()) } : tc
    ));
    setEditingId(null);
    setEditForm(null);
  };

  const handleFinalConfirm = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...draftData,
        testCases: testCases,
        impactedFeatures: impactedFeatures
      };

      const res = await fetch(`${API_URL}/api/generate-tests/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        onConfirm(result);
      } else {
        alert('Failed to save test cases');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving test cases');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="text-purple-600" size={20} />
              Review Draft
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {testCases.length} test cases generated
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                color: '#374151',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              Discard
            </button>
            <button 
              onClick={handleFinalConfirm}
              disabled={isSaving || testCases.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 24px',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                border: 'none',
                cursor: (isSaving || testCases.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (isSaving || testCases.length === 0) ? 0.5 : 1,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!isSaving && testCases.length > 0) {
                  e.currentTarget.style.backgroundColor = '#6d28d9';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSaving && testCases.length > 0) {
                  e.currentTarget.style.backgroundColor = '#7c3aed';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving...
                </span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Test Cases</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <button 
          onClick={onCancel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500',
            width: 'fit-content',
            transition: 'all 0.2s',
            marginBottom: '32px',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
            e.currentTarget.style.borderColor = '#9ca3af';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Input</span>
        </button>

        {/* AI Evaluation Section */}
        {draftData.evaluation && (
          <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <div 
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold shadow-inner"
                style={{
                  backgroundColor: 
                    draftData.evaluation.score >= 8 ? '#ecfdf5' : 
                    draftData.evaluation.score >= 5 ? '#fffbeb' : '#fef2f2',
                  color: 
                    draftData.evaluation.score >= 8 ? '#059669' : 
                    draftData.evaluation.score >= 5 ? '#d97706' : '#dc2626',
                  border: `2px solid ${
                    draftData.evaluation.score >= 8 ? '#10b981' : 
                    draftData.evaluation.score >= 5 ? '#f59e0b' : '#ef4444'
                  }`
                }}
              >
                {draftData.evaluation.score}
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">AI Peer Review Evaluation</h2>
                <p className="text-xs text-gray-500">Quality score based on requirement coverage and QA best practices</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Feedback & Flags</h3>
              <ul className="space-y-2">
                {(draftData.evaluation.feedback || []).map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500"></span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {testCases.map((tc) => (
            <div key={tc.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {editingId === tc.id ? (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                    <input 
                      name="title"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      value={editForm.title}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preconditions</label>
                    <textarea 
                      name="preconditions"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      rows="2"
                      value={editForm.preconditions}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Steps (one per line)</label>
                    <textarea 
                      name="steps"
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none"
                      rows="5"
                      value={editForm.steps}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expected Result</label>
                    <input 
                      name="expectedResults"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      value={editForm.expectedResults}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={() => setEditingId(null)} 
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        color: '#4b5563',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveEdit} 
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        color: '#ffffff',
                        backgroundColor: '#7c3aed',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold font-mono">
                        {tc.id}
                      </span>
                      <h3 className="font-bold text-gray-900">{tc.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEditing(tc)}
                        style={{
                          padding: '8px',
                          color: '#9ca3af',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = '#2563eb';
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = '#9ca3af';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(tc.id)}
                        style={{
                          padding: '8px',
                          color: '#9ca3af',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = '#dc2626';
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = '#9ca3af';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Reject"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Setup & Steps</h4>
                      <p className="text-xs text-gray-600 mb-3"><strong>Pre:</strong> {tc.preconditions}</p>
                      <ul className="space-y-1">
                        {(tc.steps || []).map((step, i) => (
                          <li key={i} className="text-xs text-gray-700 flex gap-2">
                            <span className="text-purple-400 font-bold">{i+1}.</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Expected Validation</h4>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{tc.expectedResults}</p>
                      <div className="mt-4 flex gap-2">
                        <span className="px-2 py-0.5 bg-white border rounded text-[10px] font-bold text-gray-500 uppercase">{tc.priority}</span>
                        <span className="px-2 py-0.5 bg-white border rounded text-[10px] font-bold text-gray-500 uppercase">{tc.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {testCases.length === 0 && (
            <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-xl">
              <XCircle className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900">No test cases remaining</h3>
              <p className="text-sm text-gray-500 mt-1">You have rejected all generated test cases. Discard or try again.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
