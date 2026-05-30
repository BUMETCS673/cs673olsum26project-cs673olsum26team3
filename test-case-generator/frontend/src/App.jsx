import React, { useState } from 'react';
import { Trash2, Upload, FileText } from 'lucide-react';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5001';

function App() {
  const [user, setUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Mock data and state for uploaded documents
  const [documents, setDocuments] = useState([
    { id: '1', fileName: 'User_Requirement_V1.pdf', uploadDate: '2026-05-21', fileSize: '2.45 MB' },
    { id: '2', fileName: 'System_Specification.pdf', uploadDate: '2026-05-22', fileSize: '1.20 MB' },
    { id: '3', fileName: 'A.pdf', uploadDate: '2026-05-22', fileSize: '19 MB' },
    { id: '4', fileName: 'A.pdf', uploadDate: '2026-05-22', fileSize: '20 MB' },
    { id: '5', fileName: 'A.pdf', uploadDate: '2026-05-22', fileSize: '21 MB' }
  ]);

  const [selectedFiles, setSelectedFiles] = useState([]);
  // State to track if user is dragging files over the upload zone
  const [isDragging, setIsDragging] = useState(false);

  // Configuration Constants
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // Scenario 4: 20MB in bytes
  const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg']; // Scenario 3: Valid types

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername || !loginPassword) {
      setLoginError('Username and password are required.');
      return;
    }

    setLoginLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
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
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Cannot connect to auth server.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  // Validate file sizes and formats, then return only the valid files
  const validateAndFilterFiles = (filesArray) => {
    const validFiles = [];
    const oversizedFileNames = [];
    const invalidFormatFileNames = [];

    filesArray.forEach(file => {
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      // Scenario 3: Check unsupported format
      if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        invalidFormatFileNames.push(file.name);
      } 
      // Scenario 4: Check file size limit
      else if (file.size > MAX_FILE_SIZE) {
        oversizedFileNames.push(file.name);
      } 
      // Fully valid file
      else {
        validFiles.push(file);
      }
    });

    // Alert for format rejections (Scenario 3)
    if (invalidFormatFileNames.length > 0) {
      alert(`Unsupported file format:\n\n${invalidFormatFileNames.join('\n')}\n\nOnly .pdf, .png, .jpg, and .jpeg files are allowed.`);
    }

    // Alert for size rejections (Scenario 4)
    if (oversizedFileNames.length > 0) {
      alert(`The following file(s) exceed the 20MB limit and were removed:\n\n${oversizedFileNames.join('\n')}`);
    }

    return validFiles;
  };

  // Handle file selection from the standard file input
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(validateAndFilterFiles(files));
  };

  // Trigger when files are dragged over the upload box
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Trigger when files leave the upload box area
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle files dropped into the upload box
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(validateAndFilterFiles(files));
    }
  };

  // Delete a document from the local table display
  const handleDelete = (id, name) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (isConfirmed) {
      const updatedDocs = documents.filter(doc => doc.id !== id);
      setDocuments(updatedDocs);
    }
  };

  // Upload files to the running backend server
  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Please select or drop at least one valid file to upload.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        
        const newDocs = result.data.map((item, index) => ({
          id: Date.now().toString() + index,
          fileName: item.fileName,
          uploadDate: item.uploadDate,
          fileSize: item.fileSize
        }));

        setDocuments([...documents, ...newDocs]);
        setSelectedFiles([]);
        e.target.reset();
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      alert('Cannot connect to the backend server. Please check if server.js is running.');
    }
  };

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">SpecCheck Login</h1>
          <p className="login-subtitle">Enter your username and password to access the document dashboard.</p>

          {loginError && (
            <div className="login-error">
              {loginError}
            </div>
          )}

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

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-login"
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 style={{ color: 'black' }}>Document Dashboard</h1>
          <p>Manage your uploaded documents and system files</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Upload Box with dynamic dragging class */}
      <section className={`upload-section ${isDragging ? 'dragging' : ''}`}>
        <form 
          onSubmit={handleUpload} 
          className="upload-form"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-zone">
            <Upload size={32} className="upload-icon" />
            <p>Select or drop multiple system documents to upload</p>
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              className="file-input-field"
            />
            {/* Show specific names and sizes of selected files before uploading */}
            {selectedFiles.length > 0 && (
              <div className="selected-files-preview">
                <p className="preview-title">Selected files ready to upload:</p>
                <ul className="preview-list">
                  {selectedFiles.map((file, index) => {
                    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
                    return (
                      <li key={index} className="preview-item preview-item-row">
                        <div className="preview-item-content">
                          <FileText size={14} className="preview-file-icon" />
                          <span>{file.name}</span>
                        </div>
                        <span className="preview-item-size">
                          {sizeInMB}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <span className="upload-hint">Maximum 10 files, up to 20MB each (.pdf, .png, .jpg, .jpeg)</span>
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
                  <td className="file-name-cell">
                    <div className="file-name-wrapper">
                      <FileText size={18} className="file-icon" style={{ color: '#17a2b8' }} />
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
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;




