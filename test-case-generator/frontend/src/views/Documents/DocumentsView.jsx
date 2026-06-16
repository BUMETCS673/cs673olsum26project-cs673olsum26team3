import React, { useState } from 'react';
import './DocumentsView.css';
import { Sparkles, Upload, FileText, CircleCheck, Clock, Trash2, ArrowLeft, PenTool } from 'lucide-react';
import { API_URL } from '../../config';

/**
 * DocumentsView Component
 * Renders the documents control dashboard isolated per project.
 */
export default function DocumentsView({ projectId, projectName, onBack, onNavigateToInput }) {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch documents on mount
  React.useEffect(() => {
    if (projectId) {
      setDocuments([]); // CT-66: Clear previous list to prevent project leakage
      fetchDocuments();
    }
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/upload/${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const processFiles = async (files) => {
    if (files.length === 0) return;

    // CT-75: Pre-validation for size and type
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        alert(`File "${file.name}" is too large. Maximum size is 20MB.`);
        return;
      }
      // Note: type might be empty for some files, checking extension as fallback
      const ext = file.name.split('.').pop().toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg'].includes(ext);
      const isPdf = ext === 'pdf';
      
      if (!isPdf && !isImage) {
        alert(`File "${file.name}" has an unsupported format. Please upload PDF or Images.`);
        return;
      }
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('projectId', projectId);
    files.forEach(file => formData.append('documents', file));

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        fetchDocuments(); // Refresh list
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = null; // Reset input
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleDeleteDoc = async (docId) => {
    try {
      const res = await fetch(`${API_URL}/api/upload/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDocuments(documents.filter(doc => doc.id !== docId));
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8">
        
        {/* Navigation fallback action line to return to main dashboard */}
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
            transition: 'all 0.2s',
            marginBottom: '40px' // Increased spacing
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

        {/* View Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                Documents <span className="text-gray-400 mx-2">/</span> {projectName}
              </h1>
              <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-gray-200">
                {documents.length} {documents.length === 1 ? 'File' : 'Files'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Upload documents for this specific project</p>
          </div>
          <button 
            onClick={onNavigateToInput}
            className="flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-6 py-2 text-sm font-medium text-purple-700 cursor-pointer whitespace-nowrap"
            style={{
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3e8ff'; // purple-100
              e.currentTarget.style.borderColor = '#c084fc'; // purple-400
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#faf5ff'; // purple-50
              e.currentTarget.style.borderColor = '#d8b4fe'; // purple-300
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <PenTool size={16} />
            <span>Generate Tests</span>
          </button>
        </div>

        {/* Drag & Drop Area Section Container */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-8 rounded-xl border-2 border-dashed p-12 text-center transition-all ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
              : 'border-gray-300 bg-white'
          }`}
          style={{
            cursor: isUploading ? 'not-allowed' : 'default'
          }}
        >
          <Upload className={`mx-auto mb-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} size={48} />
          <h3 className={`mb-2 font-medium transition-colors ${isDragging ? 'text-blue-700' : 'text-gray-900'}`}>
            {isUploading ? 'Uploading and processing...' : isDragging ? 'Drop files here' : 'Drop PDF files here or click to browse'}
          </h3>
          <p className="mb-4 text-sm text-gray-600">Supports PDF documents up to 20MB</p>
          <label 
            className={`inline-block cursor-pointer rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm text-gray-700 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ transition: 'all 0.2s ease' }}
            onMouseOver={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <span>{isUploading ? 'Processing...' : 'Choose Files'}</span>
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg" 
              multiple 
              className="hidden" 
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Data Table Grid System Wrapper */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Document</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Uploaded</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No documents found for this project.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="transition-colors hover:bg-gray-50">
                    {/* File Name Info Block */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="text-gray-400" size={20} />
                        <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </span>
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
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove this document?')) {
                          handleDeleteDoc(doc.id);
                        }
                      }}
                      className="rounded-lg p-2 text-gray-400 cursor-pointer"
                      style={{ transition: 'all 0.2s ease', border: 'none', background: 'transparent' }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#dc2626'; // text-red-600
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#9ca3af'; // text-gray-400
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      title="Remove asset"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
