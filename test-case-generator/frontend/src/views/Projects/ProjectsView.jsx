import React from 'react';
import './ProjectsView.css';
import { FolderOpen, FileText, TestTube, Plus, Trash2 } from 'lucide-react';

/**
 * ProjectsView Component
 * Renders the dashboard showing all available projects.
 * Code structure matches the provided ProjectsView.html template.
 */
export default function ProjectsView({ projects, documents, onNavigate, onDeleteProject, onNewProject }) {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div>
          {/* Header section with Title and New Project action */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
              <p className="text-sm text-gray-600">Manage your test generation projects</p>
            </div>
            <button 
              onClick={onNewProject}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 cursor-pointer"
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
          </div>

          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              // Count documents related to this specific project
              const docCount = documents.filter(doc => doc.projectId === project.id).length;

              return (
                <div 
                  key={project.id} 
                  className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Absolute positioned delete button, visible on hover */}
                  <button 
                    onClick={() => onDeleteProject(project.id)}
                    className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-red-600 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-2">
                      <FolderOpen size={20} className="text-gray-700" />
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{project.description || 'No description provided.'}</p>
                  </div>

                  {/* Statistics Section */}
                  <div className="mb-4 flex items-center gap-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <FileText size={16} />
                      <span>{docCount} docs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TestTube size={16} />
                      <span>{project.testCount || 0} tests</span>
                    </div>
                  </div>

                  {/* Navigation Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onNavigate(project.id, 'documents')}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                    >
                      Documents
                    </button>
                    <button 
                      onClick={() => onNavigate(project.id, 'testcases')}
                      className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 cursor-pointer"
                    >
                      View Tests
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-gray-400">
                    Created {project.createdAt}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}