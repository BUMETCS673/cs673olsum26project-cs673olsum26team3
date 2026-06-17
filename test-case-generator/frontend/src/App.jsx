// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration
import React, { useState, useEffect } from 'react';
import { API_URL } from './config';
import Navbar from './components/Navbar';
import ProjectsView from './views/Projects/ProjectsView';
import DocumentsView from './views/Documents/DocumentsView';
import TestCasesView from './views/TestCases/TestCasesView';
import ImpactAnalysisView from './views/ImpactAnalysis/ImpactAnalysisView';
import TestReviewView from './views/TestCases/TestReviewView';
import TestCaseManagementView from './views/TestCaseManagement/TestCaseManagementView';
import Login from './views/Login/Login';
import UserStoryInputView from './views/UserStoryInput/UserStoryInputView';
import { authFetch } from './utils/api';

import { useSession } from "./context/SessionManager";

/**
 * Main App Controller
 * Manages global state, routing between views, and project data flows.
 */
export default function App() {
  const {
    user,
    loading,
    logout
  } = useSession();

  const [currentView, setCurrentView] = useState('projects');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  // Start with empty lists for real data persistence
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);

  // State to hold dynamically generated test cases from the input form
  const [generatedPayload, setGeneratedPayload] = useState(null);

  const handleLogout = async () => {
    try {
      // Optional: Notify backend of logout
      await fetch(`${API_URL}/api/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Error during backend logout:', err);
    }
    logout();
  };

  // Helper for authorized fetch requests wrapping the shared utility
  const authorizedRequest = async (url, options = {}) => {
    return authFetch(url, options, handleLogout);
  };

  // Fetch projects from the real backend API when user exists
  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const res = await authorizedRequest(`${API_URL}/api/projects?userId=${user.id}`);
      const data = await res.json();

      if (res.ok) setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // Handler for creating a new project via API
  const handleCreateProject = async (projectData) => {
    try {
      const res = await authorizedRequest(`${API_URL}/api/projects`, {
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

  // Handler for deleting a project via API
  const handleDeleteProject = async (id) => {
    try {
      const res = await authorizedRequest(`${API_URL}/api/projects/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p._id !== id));
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
    console.log("Generated draft packet received:", data);
    setGeneratedPayload(data);

    // Transition to the Human-in-the-Loop review viewport
    setCurrentView('test-review');
  };

  const handleReviewConfirm = (finalData) => {
    console.log("Review confirmed and saved:", finalData);
    // Clear the draft payload so TestCasesView fetches fresh from server
    setGeneratedPayload(null);
    setCurrentView('testcases');
  };

  // Enforce secure user gateway validation check
  if (loading) return <div>Loading...</div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Navbar with unified logout functionality */}
      <Navbar
        user={user}
        onLogout={handleLogout}
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

        {currentView === 'test-review' && generatedPayload && (
          <TestReviewView
            draftData={generatedPayload.data}
            onConfirm={handleReviewConfirm}
            onCancel={() => setCurrentView('userstory-input')}
          />
        )}

        {/* User Story Input View triggered from your internal components/sidebar routing */}
        {currentView === 'userstory-input' && (
          <UserStoryInputView
            projectId={selectedProjectId}
            onGenerationComplete={handleGenerationComplete}
            onBack={() =>
              setCurrentView('documents')
            }
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

        {currentView === 'impact-analysis' && (
          <ImpactAnalysisView
            projectId={selectedProjectId}
            projectName={
              projects.find(
                (p) => (p._id || p.id) === selectedProjectId
              )?.name || 'Project'
            }
            onBack={() => setCurrentView('projects')}
          />
        )}
      </div>
    </div>
  );
}

