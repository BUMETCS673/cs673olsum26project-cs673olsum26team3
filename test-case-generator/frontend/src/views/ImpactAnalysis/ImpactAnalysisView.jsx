import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, ChevronRight, TestTube } from 'lucide-react';
import { API_URL } from '../../config';

export default function ImpactAnalysisView({ projectId, projectName, onBack }) {
  const [impactedFeatures, setImpactedFeatures] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/generate-tests/${projectId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const featuresMap = new Map();
        const allTCs = [];

        data.forEach(story => {
          // Collect Test Cases
          const storyTCs = (story.testCases || []).map(tc => ({
            ...tc,
            storyId: story._id,
            generatedAt: story.generatedAt
          }));
          allTCs.push(...storyTCs);

          // Collect Features
          if (story.impactedFeatures && Array.isArray(story.impactedFeatures)) {
            story.impactedFeatures.forEach(feat => {
              const name = typeof feat === 'object' ? feat.name : feat;
              const relatedIds = typeof feat === 'object' ? (feat.relatedTestIds || []) : [];
              
              if (featuresMap.has(name)) {
                const existing = featuresMap.get(name);
                existing.relatedTestIds = [...new Set([...existing.relatedTestIds, ...relatedIds])];
              } else {
                featuresMap.set(name, { name, relatedTestIds: [...relatedIds] });
              }
            });
          }
        });

        setTestCases(allTCs);
        setImpactedFeatures(Array.from(featuresMap.values()));
      }
    } catch (err) {
      console.error('Error fetching impact data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFeatures = impactedFeatures.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRelatedTestCases = (feature) => {
    if (!feature) return [];
    return testCases.filter(tc => feature.relatedTestIds.includes(tc.id));
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
            backgroundColor: '#f3f4f6', // gray-100
            border: '1px solid #d1d5db', // gray-300
            borderRadius: '8px',
            color: '#374151', // gray-700
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

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-gray-900">
              Impact Analysis <span className="text-gray-400 mx-2">/</span> {projectName}
            </h1>
            <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-gray-200">
              {impactedFeatures.length} {impactedFeatures.length === 1 ? 'Feature' : 'Features'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Explore features impacted by recent requirements and their associated test coverage.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Features List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Impacted Features</h3>
                <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {impactedFeatures.length}
                </span>
              </div>
              <div className="relative mb-4 flex items-center">
                <div className="absolute left-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Filter features..." 
                  className="w-full pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ paddingLeft: '42px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                   <p className="text-center py-4 text-gray-500 text-sm">Loading features...</p>
                ) : filteredFeatures.length === 0 ? (
                  <p className="text-center py-4 text-gray-500 text-sm">No features found.</p>
                ) : (
                  filteredFeatures.map((feat, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        if (selectedFeature?.name === feat.name) {
                          setSelectedFeature(null);
                        } else {
                          setSelectedFeature(feat);
                        }
                      }}
                      className="group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200"
                      style={selectedFeature?.name === feat.name ? {
                        backgroundColor: '#7c3aed', // purple-600
                        borderColor: '#7c3aed',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                      } : {
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb'
                      }}
                      onMouseOver={(e) => {
                        if (selectedFeature?.name !== feat.name) {
                          e.currentTarget.style.borderColor = '#7c3aed';
                          e.currentTarget.style.backgroundColor = '#f5f3ff';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedFeature?.name !== feat.name) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                      }}
                    >
                      <div className="flex flex-col min-w-0 pr-4">
                        <span 
                          className="text-sm font-bold truncate"
                          style={{ color: selectedFeature?.name === feat.name ? '#ffffff' : '#111827' }}
                          title={feat.name}
                        >
                          {feat.name}
                        </span>
                        <span 
                          className="text-[10px] mt-1 font-medium"
                          style={{ color: selectedFeature?.name === feat.name ? '#ddd6fe' : '#6b7280' }}
                        >
                          {feat.relatedTestIds.length} test scenarios
                        </span>
                      </div>
                      <ChevronRight 
                        size={18} 
                        style={{ 
                          color: selectedFeature?.name === feat.name ? '#ffffff' : '#d1d5db',
                          transform: selectedFeature?.name === feat.name ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                          flexShrink: 0
                        }} 
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Test Cases List */}
          <div className="lg:col-span-2">
            {!selectedFeature ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center p-8">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <Filter size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Select a Feature</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                  Choose an impacted feature from the list to view its related test scenarios and validation steps.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TestTube size={20} className="text-purple-600" />
                    Test Cases for "{selectedFeature.name}"
                  </h2>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    {getRelatedTestCases(selectedFeature).length} Total
                  </span>
                </div>

                <div className="grid gap-4">
                  {getRelatedTestCases(selectedFeature).map((tc, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            {tc.id}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900">{tc.title}</h4>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          tc.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
                          tc.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {tc.priority}
                        </span>
                      </div>
                      
                      {tc.preconditions && (
                        <div className="mb-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Preconditions</span>
                          <p className="text-xs text-gray-600 mt-1">{tc.preconditions}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Steps</span>
                        <ul className="mt-2 space-y-1">
                          {(tc.steps || []).map((step, sIdx) => (
                            <li key={sIdx} className="text-xs text-gray-700 flex gap-2">
                              <span className="text-purple-400 font-bold">{sIdx + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-gray-50">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Expected Result</span>
                        <p className="text-xs text-gray-800 mt-1 font-medium">{tc.expectedResults}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
