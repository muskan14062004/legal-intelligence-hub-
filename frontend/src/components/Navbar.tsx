import React from 'react';
import { Scale, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNavigate?: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Brand Logo */}
      <div
        onClick={() => onNavigate && onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:bg-blue-600 transition-colors">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
            Legal Intelligence Hub
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
              AI RAG
            </span>
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Enterprise Contract Analysis</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Local Local-First Inference</span>
        </div>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-none">{user.full_name}</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate max-w-[130px]">{user.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate && onNavigate('login')}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate && onNavigate('register')}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-600 rounded-lg shadow-sm transition-colors"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
