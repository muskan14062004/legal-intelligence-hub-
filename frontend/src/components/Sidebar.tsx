import React from 'react';
import {
  LayoutDashboard,
  Files,
  MessageSquare,
  Search,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents & Upload', icon: Files },
    { id: 'chat', label: 'AI Document Chat', icon: MessageSquare },
    { id: 'search', label: 'Semantic Search', icon: Search },
    { id: 'analysis', label: 'Risk Analysis', icon: ShieldAlert },
    { id: 'viewer', label: 'Document Viewer', icon: BookOpen },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Legal Assistant Disclaimer Note in Sidebar Footer */}
      <div className="mt-auto p-4 m-4 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-normal">
        <p className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          RAG Grounded Citations
        </p>
        Answers reference exact contract pages. AI output is for review assistance and not formal legal advice.
      </div>
    </aside>
  );
};
