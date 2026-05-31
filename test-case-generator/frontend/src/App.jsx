import React, { useState } from 'react';
import { Trash2, Upload, FileText } from 'lucide-react';
import TestCaseDashboard from './TestCaseDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('documents');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [documents, setDocuments] = useState([
    { id: '1', fileName: 'User_Requirement_V1.pdf', uploadDate: '2026-05-21', fileSize: '2.45 MB' },
    { id: '2', fileName: 'System_Specification.pdf', uploadDate: '2026-05-22', fileSize: '1.20 MB' },
    { id: '3', fileName: 'A.pdf', uploadDate: '2026-05-22', fileSize: '19 MB' },
    { id: '4', fileName: 'A.pdf', uploadDate: '2026-05-22', fileSize: '20 MB' },
    { id: '5', fileName: 'A.pdf', uploadDate: '2026-05-22', fileSize: '21 MB' },
  ]);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername || !loginPassword) {
      setLoginError('Username and password are required.');
      return;
    }
    setLoginLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.message || 'Invalid username or password.');
      } else {
        setUser(data.user);
      }
    } catch {
      setLoginError('Cannot connect to auth server.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('documents');
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  const validateAndFilterFiles = (filesArray) => {
    const validFiles = [];
    const oversizedFileNames = [];
    const invalidFormatFileNames = [];

    filesArray.forEach((file) => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        invalidFormatFileNames.push(file.name);
      } else if (file.size > MAX_FILE_SIZE) {
        oversizedFileNames.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFormatFileNames.length > 0) {
      alert(`Unsupported file format:\n\n${invalidFormatFileNames.join('\n')}\n\nOnly .pdf, .png, .jpg, and .jpeg files are allowed.`);
    }
    if (oversizedFileNames.length > 0) {
      alert(`The following file(s) exceed the 20MB limit and were removed:\n\n${oversizedFileNames.join('\n')}`);
    }
    return validFiles;
  };

  const handleFileChange = (e) => setSelectedFiles(validateAndFilterFiles(Array.from(e.target.files)));
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      setSelectedFiles(validateAndFilterFiles(Array.from(e.dataTransfer.files)));
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Please select or drop at least one valid file to upload.');
      return;
    }
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('documents', file));
    try {
      const response = await fetch('http://localhost:5001/api/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        const newDocs = result.data.map((item, index) => ({
          id: Date.now().toString() + index,
          fileName: item.fileName,
          uploadDate: item.uploadDate,
          fileSize: item.fileSize,
        }));
        setDocuments((prev) => [...prev, ...newDocs]);
        setSelectedFiles([]);
        e.target.reset();
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch {
      alert('Cannot connect to the backend server. Please check if server.js is running.');
    }
  };

  /* ── Login screen ────────────────────────────────── */
  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">SpecCheck</h1>
          <p className="login-subtitle">Sign in to manage your documents and test cases.</p>

          {loginError && <div className="login-error">{loginError}</div>}

          <form onSubmit={handleLoginSubmit}>
            <label htmlFor="username" className="login-label">Username</label>
            <input
              id="username"
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Enter username"
              required
              className="login-input"
            />

            <label htmlFor="password" className="login-label">Password</label>
            <input
              id="password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="login-input"
            />

            <button type="submit" disabled={loginLoading} className="btn-login">
              {loginLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Authenticated shell ─────────────────────────── */
  return (
    <div className="app-shell">

      {/* ── Top Navbar ── */}
      <nav className="app-navbar">
        <div className="navbar-brand">
          <span className="navbar-logo-mark">S</span>
          <span className="navbar-logo-text">SpecCheck</span>
        </div>

        <div className="navbar-links">
          <button
            className={`navbar-link ${currentView === 'documents' ? 'active' : ''}`}
            onClick={() => setCurrentView('documents')}
          >
            Documents
          </button>
          <button
            className={`navbar-link ${currentView === 'testcases' ? 'active' : ''}`}
            onClick={() => setCurrentView('testcases')}
          >
            Test Cases
          </button>
        </div>

        <div className="navbar-user">
          <span className="navbar-avatar">{user.username[0].toUpperCase()}</span>
          <span className="navbar-username">{user.username}</span>
          <button className="btn-logout-nav" onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="app-main">

        {currentView === 'testcases' ? (

          <TestCaseDashboard />

        ) : (
          <>
            <div className="page-header">
              <h2 className="page-title">Documents</h2>
              <p className="page-subtitle">Upload and manage your system specification files</p>
            </div>

            {/* Upload Box */}
            <section
              className={`upload-section ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <form onSubmit={handleUpload} className="upload-form">
                <div className="upload-zone">
                  <Upload size={32} className="upload-icon" />
                  <p>Select or drop multiple system documents to upload</p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="file-input-field"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="selected-files-preview">
                      <p className="preview-title">Selected files ready to upload:</p>
                      <ul className="preview-list">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="preview-item preview-item-row">
                            <div className="preview-item-content">
                              <FileText size={14} className="preview-file-icon" />
                              <span>{file.name}</span>
                            </div>
                            <span className="preview-item-size">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <span className="upload-hint">Maximum 10 files, up to 20 MB each (.pdf, .png, .jpg, .jpeg)</span>
                </div>
                <button type="submit" className="btn-upload">Upload Files</button>
              </form>
            </section>

            {/* Document Table */}
            <section className="table-section">
              <h2>Uploaded Documents</h2>
              {documents.length === 0 ? (
                <p className="no-data">No documents available. Please upload files.</p>
              ) : (
                <table className="document-table">
                  <colgroup>
                    <col style={{ width: '45%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Upload Date</th>
                      <th>File Size</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="file-name-wrapper">
                            <FileText size={17} className="file-icon" />
                            <span>{doc.fileName}</span>
                          </div>
                        </td>
                        <td>{doc.uploadDate}</td>
                        <td>{doc.fileSize}</td>
                        <td>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(doc.id, doc.fileName)}
                            title="Delete document"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
