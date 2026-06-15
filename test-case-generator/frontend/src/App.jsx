import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProjectsView from './views/Projects/ProjectsView';
import DocumentsView from './views/Documents/DocumentsView';
import TestCasesView from './views/TestCases/TestCasesView';
import TestCaseManagementView from './views/TestCaseManagement/TestCaseManagementView';
import Login from './views/Login/Login';
import UserStoryInputView from './views/UserStoryInput/UserStoryInputView';
import { authFetch } from './utils/api';

import { useSession } from "./context/SessionManager";

export default function App() {
  const {
    user,
    loading,
    logout
  } = useSession();

  const [currentView, setCurrentView] = useState('projects');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [generatedPayload, setGeneratedPayload] = useState(null);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5001/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error during backend logout:', err);
    }
    logout();
  };

  const authorizedRequest = async (url, options = {}) => {
    return authFetch(url, options, handleLogout);
  };

  // Fetch projects when user exists
  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const res = await authorizedRequest(`http://localhost:5001/api/projects?userId=${user.id}`);
      const data = await res.json();

      if (res.ok) setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const res = await authorizedRequest('http://localhost:5001/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectData,
          userId: user.id,
        }),
      });

      const newProject = await res.json();

      if (res.ok) {
        setProjects((prev) => [newProject, ...prev]);
        return true;
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }

    return false;
  };

  const handleDeleteProject = async (id) => {
    try {
      const res = await authorizedRequest(`http://localhost:5001/api/projects/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleNavigate = (projectId, view) => {
    setSelectedProjectId(projectId);
    setCurrentView(view);
    setGeneratedPayload(null);
  };

  const handleGenerationComplete = (data) => {
    setGeneratedPayload(data);
    setCurrentView('testcases');
  };

  // LOGIN GATE
  if (loading) return <div>Loading...</div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onLogoClick={() => setCurrentView('projects')}
        onNavigateToManage={() => setCurrentView('manage-tests')}
      />

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
            projectName={
              projects.find(
                (p) => (p._id || p.id) === selectedProjectId
              )?.name || 'Project'
            }
            onBack={() => setCurrentView('projects')}
            onNavigateToInput={() =>
              setCurrentView('userstory-input')
            }
          />
        )}

        {currentView === 'userstory-input' && (
          <UserStoryInputView
            projectId={selectedProjectId}
            onGenerationComplete={handleGenerationComplete}
            onBack={() => setCurrentView('documents')}
          />
        )}

        {currentView === 'testcases' && (
          <TestCasesView
            projectId={selectedProjectId}
            projectName={
              projects.find(
                (p) => (p._id || p.id) === selectedProjectId
              )?.name || 'Project'
            }
            generatedData={generatedPayload}
            onBack={() => setCurrentView('projects')}
            onNavigateToInput={() =>
              setCurrentView('userstory-input')
            }
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
