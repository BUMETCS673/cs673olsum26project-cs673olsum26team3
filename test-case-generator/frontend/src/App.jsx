import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProjectsView from './views/Projects/ProjectsView';
import DocumentsView from './views/Documents/DocumentsView';
import TestCasesView from './views/TestCases/TestCasesView';
import TestCaseManagementView from './views/TestCaseManagement/TestCaseManagementView';
import Login from './views/Login/Login';
import UserStoryInputView from './views/UserStoryInput/UserStoryInputView';

/**
 * Main App Controller
 * Manages global state, routing between views, and project data flows.
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('projects');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  // Start with empty lists for real data persistence
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State to hold dynamically generated test cases from the input form
  const [generatedPayload, setGeneratedPayload] = useState(null);

  // Fetch projects from the real backend API
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/projects?userId=${user.id}`);
      const data = await res.json();
      if (res.ok) setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // Handler for creating a new project via API
  const handleCreateProject = async (projectData) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...projectData, userId: user.id })
      });
      const newProject = await res.json();
      if (res.ok) {
        setProjects(prev => [newProject, ...prev]);
        return true;
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
    return false;
  };

  // Handler for deleting a project via API
  const handleDeleteProject = async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProjects(projects.filter(p => p._id !== id));
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  // Handler for navigation between different project views
  const handleNavigate = (projectId, view) => {
    setSelectedProjectId(projectId);
    setCurrentView(view);
    // CT-66: Reset generation payload to ensure project isolation
    setGeneratedPayload(null);
  };
  
  // Callback triggered upon successful User Story validation and backend execution
  const handleGenerationComplete = (data) => {
    console.log("Generated payload packet received:", data);
    setGeneratedPayload(data);
    
    // Automatically transit state viewport to display the freshly built test cases
    setCurrentView('testcases');
  };

  // Enforce secure user gateway validation check
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Navbar with unified logout functionality */}
      <Navbar
        user={user}
        onLogout={() => setUser(null)}
        onLogoClick={() => setCurrentView('projects')}
        onNavigateToManage={() => setCurrentView('manage-tests')}
      />

      {/* Main Viewport Content Gateway mapping */}
      <div className="pt-2"> 
        {currentView === 'projects' && (
          <ProjectsView 
            projects={projects} 
            documents={documents}
            onNavigate={handleNavigate}
            onDeleteProject={handleDeleteProject}
            onNewProject={handleCreateProject}
          />
        )}

        {currentView === 'documents' && (
          <DocumentsView 
            projectId={selectedProjectId} 
            projectName={projects.find(p => (p._id || p.id) === selectedProjectId)?.name || 'Project'}
            onBack={() => setCurrentView('projects')} 
            onNavigateToInput={() => setCurrentView('userstory-input')}
          />
        )}

        {/* User Story Input View triggered from your internal components/sidebar routing */}
        {currentView === 'userstory-input' && (
          <UserStoryInputView 
            onGenerationComplete={handleGenerationComplete} 
            onBack={() => setCurrentView('testcases')}
            projectId={selectedProjectId}
          />
        )}

        {currentView === 'testcases' && (
          <TestCasesView
            projectId={selectedProjectId}
            projectName={projects.find(p => p._id === selectedProjectId || p.id === selectedProjectId)?.name || 'Project'}
            generatedData={generatedPayload}
            onBack={() => setCurrentView('projects')}
            onNavigateToInput={() => setCurrentView('userstory-input')}
          />
        )}

        {currentView === 'manage-tests' && (
          <TestCaseManagementView
            userId={user.id}
            onBack={() => setCurrentView('projects')}
          />
        )}
      </div>
    </div>
  );
}
