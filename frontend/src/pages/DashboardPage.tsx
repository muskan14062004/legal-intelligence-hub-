import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  MessageSquare,
  Search,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats } from '../types';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry on document indexing, RAG grounding, and contract risk audits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            title="Refresh statistics"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('documents')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Contract
          </button>
          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-xs rounded-xl transition-all"
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Ask Question
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Uploaded Documents</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (stats?.total_documents ?? 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Contracts in repository</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Awaiting Processing</p>
            <h3 className="text-3xl font-extrabold text-amber-600 mt-2">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (stats?.awaiting_processing ?? 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">In extraction & chunking queue</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Completed Analyses</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (stats?.completed_analyses ?? 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Indexed & vector-searchable</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Legal Research Chats</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (stats?.total_conversations ?? 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">RAG interrogations recorded</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Documents & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Uploads Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Recently Uploaded Documents</h3>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                Loading documents...
              </div>
            ) : !stats?.recent_documents || stats.recent_documents.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <FolderOpen className="w-8 h-8 text-slate-300" />
                <p>No documents uploaded yet. Upload your first PDF contract to start analysis.</p>
                <button
                  onClick={() => onNavigate('documents')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors"
                >
                  Upload First Contract
                </button>
              </div>
            ) : (
              stats.recent_documents.map((doc) => (
                <div
                  key={doc.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 hover:text-blue-600 cursor-pointer"
                          onClick={() => onNavigate('viewer', { documentId: doc.id })}>
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(doc.file_size / (1024 * 1024)).toFixed(2)} MB • {doc.page_count} pages • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-full capitalize ${
                        doc.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.status === 'processing' || doc.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {doc.status}
                    </span>

                    <button
                      onClick={() => onNavigate('analysis', { documentId: doc.id })}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white transition-colors"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Recent Activity Timeline</h3>
          </div>

          <div className="p-6 divide-y divide-slate-100 flex-1 overflow-auto max-h-[420px]">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading activity...</div>
            ) : !stats?.recent_activities || stats.recent_activities.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No recent actions recorded.</div>
            ) : (
              stats.recent_activities.map((act) => (
                <div key={act.id} className="py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === 'upload' ? (
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{act.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
