import React from 'react';
import { Folder, FileText, CheckSquare, LogOut, Sparkles } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, selectedProjectId, user, onLogout }) {
  return (
    <aside className="sidebar-container">
      {/* Brand Identification */}
      <div className="sidebar-brand" onClick={() => setCurrentView('projects')}>
        <Sparkles size={22} className="brand-icon" />
        <span>SpecCheck</span>
      </div>

      {/* Primary Navigation Links */}
      <nav className="sidebar-menu">
        <button 
          className={`menu-item ${currentView === 'projects' ? 'active' : ''}`}
          onClick={() => setCurrentView('projects')}
        >
          <Folder size={18} />
          <span>Projects</span>
        </button>

        {/* Context-aware routes rendering when a project is selected */}
        {selectedProjectId && (
          <>
            <button 
              className={`menu-item ${currentView === 'documents' ? 'active' : ''}`}
              onClick={() => setCurrentView('documents')}
            >
              <FileText size={18} />
              <span>Documents</span>
            </button>
            <button 
              className={`menu-item ${currentView === 'testcases' ? 'active' : ''}`}
              onClick={() => setCurrentView('testcases')}
            >
              <CheckSquare size={18} />
              <span>Test Cases</span>
            </button>
          </>
        )}
      </nav>

      {/* Profile summary and user controls at footer */}
      <div className="sidebar-footer">
        <div className="user-profile-info">
          <div className="avatar-circle">{user?.username ? user.username[0].toUpperCase() : 'U'}</div>
          <div className="user-detail text-ellipsis">
            <p className="user-name">{user?.username || 'User'}</p>
            <p className="user-role">Developer</p>
          </div>
        </div>
        <button className="btn-sidebar-logout" onClick={onLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}