import React from 'react';
import { LogOut } from 'lucide-react';

export default function Navbar({ onLogout }) {
  return (
    <nav className="border-b border-gray-200 bg-black text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="cursor-pointer font-semibold">SpecCheck</h1>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}