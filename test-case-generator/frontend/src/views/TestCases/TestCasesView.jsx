import React, { useState } from 'react';
import './TestCasesView.css';
import { ArrowLeft, Download, Plus, Trash2, FileSpreadsheet, FileText, Code } from 'lucide-react';

/**
 * TestCasesView Component
 * Focuses purely on creating, viewing, and organizing AI-generated test scenarios.
 * Features a hoverable dropdown menu for asset export and explicit test category tags.
 */
export default function TestCasesView({ projectId, onBack }) {
  // Enhanced mock data pool introducing specific testing methodologies (Functional, Negative, Edge Case)
  const [testCases, setTestCases] = useState([
    { id: 'TC-001', title: 'Verify user authentication with valid credentials', component: 'AuthModule', type: 'Functional', priority: 'High', status: 'Passed' },
    { id: 'TC-002', title: 'Check system error handling on invalid JWT token login', component: 'AuthModule', type: 'Negative', priority: 'Medium', status: 'Passed' },
    { id: 'TC-003', title: 'Validate shopping cart summary item count updating real-time', component: 'CartPipeline', type: 'Functional', priority: 'High', status: 'Pending' },
    { id: 'TC-004', title: 'Test payment gateway timeout fallback routine integration', component: 'BillingCore', type: 'Edge Case', priority: 'Critical', status: 'Pending' }
  ]);

  // Handle local test case removal
  const handleDeleteTestCase = (id) => {
    setTestCases(testCases.filter(tc => tc.id !== id));
  };

  // Maps custom color schemes for structural test category badges
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'Functional': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Negative': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Edge Case': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8">
        
        {/* Navigation escape hatch back to the project overview */}
        <button 
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Return to Projects</span>
        </button>

        {/* Dynamic Section Header Layout */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Test Cases</h1>
            <p className="text-sm text-gray-600">Review, organize, and construct precise test metrics from project structures</p>
          </div>
          
          {/* Action configurations */}
          <div className="flex gap-3">
            
            {/* Hover Dropdown Element for Export Controls */}
            <div className="relative export-dropdown-group">
              <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer">
                <Download size={16} />
                <span>Export As</span>
              </button>
              
              {/* Dropdown Options List Container overlay */}
              <div className="absolute right-0 mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-10 dropdown-menu-content">
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left cursor-pointer transition-colors">
                  <FileSpreadsheet size={14} className="text-gray-400" />
                  <span>Export CSV</span>
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left cursor-pointer transition-colors">
                  <FileText size={14} className="text-gray-400" />
                  <span>Export PDF</span>
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left cursor-pointer transition-colors">
                  <Code size={14} className="text-gray-400" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Main structural tool invocation: Create Test Case */}
            <button className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 cursor-pointer">
              <Plus size={16} />
              <span>Create Test Case</span>
            </button>
          </div>
        </div>

        {/* Data Architecture Core Grid Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 w-24">ID</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Test Scenario Description</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Module</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Priority</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {testCases.map((tc) => (
                <tr key={tc.id} className="transition-colors hover:bg-gray-50">
                  
                  {/* System UID Marker Cell */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-semibold text-gray-500">{tc.id}</span>
                  </td>
                  
                  {/* Target Scope Condition Narrative */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{tc.title}</span>
                  </td>
                  
                  {/* Component Bound Module Namespace Tag */}
                  <td className="px-6 py-4">
                    <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-mono text-xs">{tc.component}</span>
                  </td>
                  
                  {/* Categorized Test Classification Badge (Functional/Negative/Edge Case) */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getTypeBadgeClass(tc.type)}`}>
                      {tc.type}
                    </span>
                  </td>
                  
                  {/* Risk Hierarchy Importance Label */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 font-medium">{tc.priority}</span>
                  </td>
                  
                  {/* Mutative Action Pipeline Hooks */}
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteTestCase(tc.id)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 cursor-pointer"
                      title="Delete asset record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}