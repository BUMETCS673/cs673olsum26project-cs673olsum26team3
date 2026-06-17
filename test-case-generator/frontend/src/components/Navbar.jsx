// AI-USAGE SUMMARY 
// Tools: ChatGPT, Gemini
// Overall AI Contribution: ~35% 
// AI-Assisted Areas: Code structure, initial implementation, unit tests
// Human Contributions: Business logic, validation, security checks, refinement
// Notes: AI-generated code was reviewed, refactored, and validated before integration

import React from 'react';
import { LogOut, LayoutList } from 'lucide-react';

export default function Navbar({ user, onLogout, onLogoClick, onNavigateToManage }) {
  return (
    <nav className="border-b border-gray-200 bg-black text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <h1
              className="cursor-pointer font-semibold text-xl"
              onClick={onLogoClick}
            >
              SpecCheck
            </h1>
            <button
              onClick={onNavigateToManage}
              className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer transition-colors"
              style={{ background: 'none', border: 'none' }}
              onMouseOver={e  => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseOut={e   => { e.currentTarget.style.color = '#9ca3af'; }}
            >
              <LayoutList size={15} />
              Test Cases
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            {/* User Profile Info */}
            <div className="flex items-center gap-3 border-r border-gray-700 pr-6">
              <div 
                style={{
                  display: 'flex',
                  height: '32px',
                  width: '32px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb', // blue-600
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#ffffff'
                }}
              >
                {user?.username ? user.username[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{user?.username || 'User'}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Active Account</span>
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-200 cursor-pointer"
              style={{ transition: 'all 0.2s ease' }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937'; // gray-800
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}