// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration

import React, { useState } from 'react';
import './ProjectsView.css';
import { FolderOpen, FileText, Eye, Plus, Trash2, X, Search, Zap } from 'lucide-react'; // Added Search icon

/**
 * ProjectsView Component
 * Renders the dashboard showing all available projects with client-side keyword filtering
 */
export default function ProjectsView({ projects, documents, onNavigate, onDeleteProject, onNewProject }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    
    const success = await onNewProject(newProject);
    if (success) {
      setIsModalOpen(false);
      setNewProject({ name: '', description: '' });
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true;
    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return keywords.every(kw => 
      project.name.toLowerCase().includes(kw) ||
      (project.description || '').toLowerCase().includes(kw)
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div>
          {/* Header section with Title and New Project action */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
                <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-gray-200">
                  {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
                </span>
              </div>
              <p className="text-sm text-gray-600">Manage your test generation projects</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white cursor-pointer"
              style={{ transition: 'all 0.2s ease' }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
          </div>
          {projects.length > 0 && (
            <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '448px', width: '100%' }}>
              <div style={{ position: 'absolute', top: '0', bottom: '0', left: '0', paddingLeft: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search projects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  color: '#111827',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Project Cards Grid / Empty State */}
          {projects.length === 0 ? (
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 20px',
                border: '2px dashed #e5e7eb',
                borderRadius: '16px',
                backgroundColor: '#f9fafb',
                textAlign: 'center'
              }}
            >
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '50%', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <FolderOpen size={48} className="text-gray-400" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                Welcome to SpecCheck!
              </h2>
              <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '400px', marginBottom: '32px', lineHeight: '1.5' }}>
                It looks like you don't have any projects yet. Create your first project to start generating AI-powered test cases.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#000000';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Plus size={20} />
                <span>Create Your First Project</span>
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl bg-gray-50">
              <p className="text-gray-500 text-sm">No projects found matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline cursor-pointer"
              >
                Clear search query
              </button>
            </div>
          ) : (
            <div 
              className="grid gap-6" 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' 
              }}
            >
              {filteredProjects.map((project) => (
                <div 
                  key={project._id || project.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    cursor: 'default'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '10px' }}>
                        <FolderOpen size={24} className="text-black" />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this project?')) {
                            onDeleteProject(project._id || project.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:bg-red-50 rounded-lg cursor-pointer"
                        style={{ border: 'none', background: 'transparent', transition: 'all 0.2s ease' }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = '#dc2626'; // text-red-600
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = '#9ca3af'; // text-gray-400
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{project.name}</h3>
                    <div style={{ display: 'flex', itemsCenter: 'center', gap: '4px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created:</span>
                      <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => onNavigate(project._id || project.id, 'documents')}
                      className="flex-1 flex items-center justify-center gap-2 text-white py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                      style={{ 
                        border: 'none', 
                        backgroundColor: '#000000',
                        transition: 'all 0.2s ease' 
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#374151';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#000000';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <FileText size={16} />
                      <span>Documents</span>
                    </button>
                    <button 
                      onClick={() => onNavigate(project._id || project.id, 'testcases')}
                      className="flex-1 flex items-center justify-center gap-2 text-white py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                      style={{ 
                        border: 'none', 
                        backgroundColor: '#2563eb',
                        transition: 'all 0.2s ease' 
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Eye size={16} />
                      <span>View Tests</span>
                    </button>
                    <button 
                      onClick={() => onNavigate(project._id || project.id, 'impact-analysis')}
                      className="flex-1 flex items-center justify-center gap-2 text-white py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                      style={{ 
                        border: 'none', 
                        backgroundColor: '#7c3aed',
                        transition: 'all 0.2s ease' 
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#6d28d9';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#7c3aed';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Zap size={16} />
                      <span>Impact</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '450px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Create New Project</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', transition: 'all 0.2s ease' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#000000';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Project Name</label>
                <input 
                  type="text"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                  placeholder="e.g., Mobile App"
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Description</label>
                <textarea 
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  placeholder="What is this project about?"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#ffffff', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#000000', color: '#ffffff', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}