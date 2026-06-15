import React, { useState, useMemo, useEffect } from 'react';
import './TestCasesView.css';
import { ArrowLeft, Download, Plus, Trash2, FileSpreadsheet, Code, PenTool, Copy, Filter, X } from 'lucide-react';
import { authFetch } from '../../utils/api';

/**
 * TestCasesView Component
 * Focuses purely on creating, viewing, and organizing AI-generated and manual test scenarios.
 */
export default function TestCasesView({ projectId, projectName, onBack, onNavigateToInput, generatedData }) {
  const [testCases, setTestCases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTC, setExpandedTC] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Creation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTC, setNewTC] = useState({
    title: '',
    type: 'Functional',
    priority: 'Medium',
    preconditions: '',
    steps: '',
    expectedResults: ''
  });

  // Fetch saved test cases on mount
  useEffect(() => {
    if (projectId) {
      setTestCases([]); 
      fetchSavedTestCases();
    }
  }, [projectId]);

  const fetchSavedTestCases = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`http://localhost:5001/api/generate-tests/${projectId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        let globalIndex = 0;
        const allTCs = data.reduce((acc, story) => {
          const tcs = (story.testCases || []).map(tc => {
            // Standardize ID format based on source (AI vs Manual)
            let formattedId = tc.id;
            if (story.options?.manual) {
                if (!formattedId.startsWith('HU-')) formattedId = `HU-${formattedId}`;
            } else {
                if (!formattedId.startsWith('AI-')) formattedId = `AI-${formattedId}`;
            }

            return {
                ...tc,
                id: formattedId,
                createdAt: story.generatedAt || story.createdAt,
                _uId: `${story._id}_${tc.id || 'tc'}_${globalIndex++}`
            };
          });
          return [...acc, ...tcs];
        }, []);
        setTestCases(allTCs);
      } else {
        setTestCases([]);
      }
    } catch (err) {
      console.error('Error fetching test cases:', err);
      setTestCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    
    // Generate HU-ID based on current project count
    const manualCount = testCases.filter(tc => tc.id.startsWith('HU-')).length;
    const nextId = `HU-${String(manualCount + 1).padStart(3, '0')}`;
    
    const tcToSave = {
        ...newTC,
        id: nextId,
        steps: newTC.steps.split('\n').filter(s => s.trim() !== '')
    };

    try {
        const res = await authFetch('http://localhost:5001/api/generate-tests/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, testCase: tcToSave })
        });
        
        if (res.ok) {
            setIsModalOpen(false);
            setNewTC({ title: '', type: 'Functional', priority: 'Medium', preconditions: '', steps: '', expectedResults: '' });
            fetchSavedTestCases();
        }
    } catch (err) {
        console.error('Error creating manual TC:', err);
    }
  };

  // Derive available filter options from data with normalization
  const availableTypes = useMemo(() => {
    const uniqueTypes = [...new Set(testCases.map(tc => String(tc.type || '').trim()).filter(Boolean))];
    return ['All', ...uniqueTypes];
  }, [testCases]);

  const availablePriorities = useMemo(() => {
    const uniquePriorities = [...new Set(testCases.map(tc => String(tc.priority || '').trim()).filter(Boolean))];
    return ['All', ...uniquePriorities];
  }, [testCases]);

  const toggleTypeFilter = () => {
    const currentIndex = availableTypes.indexOf(filterType);
    const nextIndex = (currentIndex + 1) % availableTypes.length;
    setFilterType(availableTypes[nextIndex]);
  };

  const togglePriorityFilter = () => {
    const currentIndex = availablePriorities.indexOf(filterPriority);
    const nextIndex = (currentIndex + 1) % availablePriorities.length;
    setFilterPriority(availablePriorities[nextIndex]);
  };

  // Memoized filtered test cases based on filter settings
  const filteredTestCases = useMemo(() => {
    return testCases.filter(tc => {
      const tcType = String(tc.type || '').trim();
      const tcPriority = String(tc.priority || '').trim();

      const typeMatch = filterType === 'All' || tcType === filterType;
      const priorityMatch = filterPriority === 'All' || tcPriority === filterPriority;

      if (!typeMatch || !priorityMatch) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        tc.title?.toLowerCase().includes(q) ||
        tc.preconditions?.toLowerCase().includes(q) ||
        tc.expectedResults?.toLowerCase().includes(q) ||
        (tc.steps || []).some(s => s.toLowerCase().includes(q))
      );
    });
  }, [testCases, filterType, filterPriority, searchQuery]);

  const getProfessionalFileName = (extension) => {
    const date = new Date().toISOString().split('T')[0];
    const cleanProjectName = String(projectName || 'Project').replace(/\s+/g, '_');
    return `SpecCheck_${cleanProjectName}_TestCases_${date}.${extension}`;
  };

  useEffect(() => {
    if (generatedData && generatedData.data && generatedData.data.testCases) {
      fetchSavedTestCases();
    }
  }, [generatedData]);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(testCases, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", getProfessionalFileName('json'));
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setIsExportOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Type", "Priority", "Preconditions", "Expected Results"];
    const rows = testCases.map(tc => [
      tc.id,
      `"${tc.title}"`,
      tc.type,
      tc.priority,
      `"${tc.preconditions || ''}"`,
      `"${tc.expectedResults || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", getProfessionalFileName('csv'));
    document.body.appendChild(link);
    link.click();
    link.remove();
    setIsExportOpen(false);
  };

  const handleCopy = (tc) => {
    const text = `ID: ${tc.id}\nTitle: ${tc.title}\nPreconditions: ${tc.preconditions}\nSteps:\n${(tc.steps || []).join('\n')}\nExpected Results: ${tc.expectedResults}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Test Case copied to clipboard!');
    });
  };

  const handleDeleteTestCase = (id) => {
    if (window.confirm('Are you sure you want to delete this test case?')) {
      setTestCases(testCases.filter(tc => tc.id !== id));
    }
  };

  const getTypeBadgeClass = (type) => {
    const cleanType = String(type || '').trim();
    switch (cleanType) {
      case 'Functional': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Negative': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Edge Case': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8">
        
        <button 
          onClick={onBack}
          className="cursor-pointer"
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
            transition: 'all 0.2s ease',
            marginBottom: '40px'
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
          <span>Back to Projects</span>
        </button>

        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1 truncate">
              Test Cases <span className="text-gray-400 mx-2">/</span> {projectName || 'Project'}
            </h1>
            <p className="text-sm text-gray-600">Review and organize test metrics for this project</p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button 
              onClick={onNavigateToInput}
              className="flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 cursor-pointer"
              style={{ transition: 'all 0.2s ease' }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3e8ff';
                e.currentTarget.style.borderColor = '#c084fc';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#faf5ff';
                e.currentTarget.style.borderColor = '#d8b4fe';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <PenTool size={16} />
              <span>Generate</span>
            </button>

            {/* Interactive Export Dropdown (Scenario 6) */}
            <div 
              className="relative"
              onMouseEnter={() => setIsExportOpen(true)}
              onMouseLeave={() => setIsExportOpen(false)}
            >
              <button 
                style={{ backgroundColor: '#2563eb', transition: 'all 0.2s ease' }}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white cursor-pointer shadow-sm"
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Download size={16} />
                <span>Export As</span>
              </button>
              
              {/* Dropdown Menu - appears on hover */}
              {isExportOpen && (
                <div className="absolute right-0 top-full pt-1 w-40 z-30">
                  <div className="rounded-lg border border-gray-200 bg-white shadow-xl py-1 overflow-hidden">
                    <button 
                      onClick={() => { handleExportCSV(); setIsExportOpen(false); }} 
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left cursor-pointer transition-colors"
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FileSpreadsheet size={14} className="text-blue-500" />
                      <span>Export CSV</span>
                    </button>
                    <button 
                      onClick={() => { handleExportJSON(); setIsExportOpen(false); }} 
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 text-left cursor-pointer transition-colors"
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Code size={14} className="text-blue-500" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white cursor-pointer"
              style={{ transition: 'all 0.2s ease' }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={16} />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Scenario 2: Warning Banner for Missing Grounded Context */}
        {generatedData?.message?.includes('Warning') && (
          <div 
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <div className="mt-0.5 rounded-full bg-amber-100 p-1">
              <Filter size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Limited Context Notice</h3>
              <p className="mt-1 text-sm text-amber-700 leading-relaxed">
                {generatedData.message} To improve accuracy, please upload product specification documents in the <strong>Documents</strong> section.
              </p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search test cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 w-24">ID</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Test Scenario Description</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Created</th>
                <th
                  className="px-6 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={toggleTypeFilter}
                >
                  <div className="flex items-center gap-2">
                    <span>Type {filterType !== 'All' ? `(${filterType})` : ''}</span>
                    <Filter size={14} className={filterType !== 'All' ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={togglePriorityFilter}
                >
                  <div className="flex items-center gap-2">
                    <span>Priority {filterPriority !== 'All' ? `(${filterPriority})` : ''}</span>
                    <Filter size={14} className={filterPriority !== 'All' ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading test cases...</td></tr>
              ) : filteredTestCases.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No test cases match filters.</td></tr>
              ) : (
                filteredTestCases.map((tc) => (
                  <React.Fragment key={tc._uId}>
                    <tr 
                      onClick={() => setExpandedTC(expandedTC === tc._uId ? null : tc._uId)}
                      className="transition-colors hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-semibold text-gray-500">{tc.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{tc.title}</span>
                          {tc.preconditions && (
                            <span className="text-xs text-gray-500 mt-1"><strong>Pre:</strong> {tc.preconditions}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {tc.createdAt ? new Date(tc.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getTypeBadgeClass(tc.type)}`}>
                          {tc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 font-medium">{tc.priority}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopy(tc); }} 
                            className="rounded-lg p-2 text-gray-400 cursor-pointer"
                            style={{ transition: 'all 0.2s ease' }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = '#2563eb';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = '#9ca3af';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTestCase(tc.id); }} 
                            className="rounded-lg p-2 text-gray-400 cursor-pointer"
                            style={{ transition: 'all 0.2s ease' }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = '#dc2626';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = '#9ca3af';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedTC === tc._uId && (
                      <tr className="bg-gray-50/50">
                        <td colSpan="6" className="px-6 py-3">
                          <div className="text-xs text-gray-600 bg-white border border-gray-100 rounded-lg p-4 mx-4 my-2">
                            <div className="font-semibold mb-2 text-gray-800">Steps:</div>
                            <ul className="list-decimal list-inside space-y-1 ml-2">
                              {(tc.steps || []).map((step, idx) => <li key={idx} className="mb-1">{step}</li>)}
                            </ul>
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <strong className="text-gray-800">Expected Result:</strong>
                              <p className="mt-1 text-gray-700">{tc.expectedResults}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Manual Creation Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Create Manual Test Case</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateManual}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Test Title</label>
                <input type="text" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} value={newTC.title} onChange={e => setNewTC({...newTC, title: e.target.value})} placeholder="e.g., Verify Login with valid credentials" />
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Type</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} value={newTC.type} onChange={e => setNewTC({...newTC, type: e.target.value})}>
                    <option value="Functional">Functional</option>
                    <option value="Negative">Negative</option>
                    <option value="Edge Case">Edge Case</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Priority</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} value={newTC.priority} onChange={e => setNewTC({...newTC, priority: e.target.value})}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Preconditions</label>
                <textarea rows="2" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} value={newTC.preconditions} onChange={e => setNewTC({...newTC, preconditions: e.target.value})} placeholder="What needs to be set up first?" />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Steps (One per line)</label>
                <textarea rows="4" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} value={newTC.steps} onChange={e => setNewTC({...newTC, steps: e.target.value})} placeholder="1. Go to homepage&#10;2. Click login..." />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Expected Results</label>
                <textarea rows="2" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} value={newTC.expectedResults} onChange={e => setNewTC({...newTC, expectedResults: e.target.value})} placeholder="What should happen?" />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button 
                    type="submit" 
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#000000', color: '#ffffff', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#374151'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
