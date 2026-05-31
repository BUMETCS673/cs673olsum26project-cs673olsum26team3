import React, { useState } from 'react';
import './DocumentsView.css';
import { Sparkles, Upload, FileText, CircleCheck, Clock, Trash2, ArrowLeft } from 'lucide-react';

/**
 * DocumentsView Component
 * Renders the documents control dashboard fully matching the provided Figma HTML template.
 * Includes dynamic file list state, upload drag-and-drop structural placeholder, and test generation triggers.
 */
export default function DocumentsView({ projectId, onBack }) {
  // Initial state populated directly from the template mockup data
  const [documents, setDocuments] = useState([
    { id: 'd1', name: 'requirements_spec.pdf', size: '2.4 MB', uploadedAt: '2026-05-24 10:30 AM', status: 'Ready' },
    { id: 'd2', name: 'user_stories.pdf', size: '1.8 MB', uploadedAt: '2026-05-24 11:15 AM', status: 'Ready' },
    { id: 'd3', name: 'api_documentation.pdf', size: '3.2 MB', uploadedAt: '2026-05-24 12:00 PM', status: 'Processing' }
  ]);

  // Handler to remove document items from the state pool
  const handleDeleteDoc = (docId) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8">
        
        {/* Navigation fallback action line to return to main dashboard */}
        <button 
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Return to Projects</span>
        </button>

        {/* View Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Documents</h1>
            <p className="text-sm text-gray-600">Upload project documents to generate test cases</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 cursor-pointer">
            <Sparkles size={16} />
            <span>Generate Tests</span>
          </button>
        </div>

        {/* Drag & Drop Area Section Container */}
        <div className="mb-8 rounded-xl border-2 border-dashed p-12 text-center transition-colors border-gray-300 bg-white">
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="mb-2 font-medium text-gray-900">Drop PDF files here or click to browse</h3>
          <p className="mb-4 text-sm text-gray-600">Supports PDF documents up to 10MB</p>
          <label className="inline-block cursor-pointer rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
            <span>Choose Files</span>
            <input type="file" accept=".pdf" multiple className="hidden" />
          </label>
        </div>

        {/* Data Table Grid System Wrapper */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Document</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Size</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Uploaded</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="transition-colors hover:bg-gray-50">
                  {/* File Name Info Block */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="text-gray-400" size={20} />
                      <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  
                  {/* File Structural Properties */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{doc.size}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{doc.uploadedAt}</span>
                  </td>
                  
                  {/* Pipeline Processing Status Indicator Badges */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {doc.status === 'Ready' ? (
                        <>
                          <CircleCheck className="text-green-600" size={20} />
                          <span className="text-sm text-gray-900">Ready</span>
                        </>
                      ) : (
                        <>
                          <Clock className="text-yellow-600" size={20} />
                          <span className="text-sm text-gray-900">Processing</span>
                        </>
                      )}
                    </div>
                  </td>
                  
                  {/* Destructive Control Management */}
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 cursor-pointer"
                      title="Remove asset"
                    >
                      <Trash2 size={16} />
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