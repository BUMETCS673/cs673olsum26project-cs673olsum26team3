import React, { useState } from 'react';
import Navbar from './components/Navbar'; // Move logout logic to a separate Navbar
import ProjectsView from './views/Projects/ProjectsView';
import DocumentsView from './views/Documents/DocumentsView';
import TestCasesView from './views/TestCases/TestCasesView';
import Login from './views/Login/Login';

/**
 * Main App Controller
 * Manages global state, routing between views, and project data.
 */
function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('projects');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Initial Mock Data
  const [projects, setProjects] = useState([
    { id: '1', name: 'E-Commerce Platform', description: 'Online shopping system', testCount: 48, createdAt: '2026-05-20' },
    { id: '2', name: 'Mobile Banking App', description: 'iOS and Android app', testCount: 32, createdAt: '2026-05-18' }
  ]);

  const [documents, setDocuments] = useState([
    { id: 'd1', projectId: '1', name: 'SRS.pdf' }
  ]);

  // Handler for navigation between different project views
  const handleNavigate = (projectId, view) => {
    setSelectedProjectId(projectId);
    setCurrentView(view);
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Navbar with logout functionality */}
      <Navbar onLogout={() => setUser(null)} />

      {/* Main Viewport Content */}
      <div className="pt-2"> 
        {currentView === 'projects' && (
          <ProjectsView 
            projects={projects} 
            documents={documents}
            onNavigate={handleNavigate}
            onDeleteProject={(id) => setProjects(projects.filter(p => p.id !== id))}
            onNewProject={() => {/* logic to open modal */}}
          />
        )}

        {currentView === 'documents' && (
          <DocumentsView 
            projectId={selectedProjectId} 
            onBack={() => setCurrentView('projects')} 
          />
        )}

        {currentView === 'testcases' && (
          <TestCasesView 
            projectId={selectedProjectId} 
            onBack={() => setCurrentView('projects')} 
          />
        )}
      </div>
    </div>
  );
}

export default App;