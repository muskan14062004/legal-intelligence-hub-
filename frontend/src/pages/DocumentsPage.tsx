import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Trash2,
  Eye,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { FileUpload } from '../components/FileUpload';
import { Document } from '../types';

interface DocumentsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await documentService.listDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadSuccess = (newDoc: Document) => {
    setDocuments((prev) => [newDoc, ...prev]);
    // Poll briefly to update status once background pipeline completes
    setTimeout(fetchDocuments, 2000);
    setTimeout(fetchDocuments, 5000);
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This will also remove all chunks and vector embeddings.`)) {
      return;
    }

    setDeletingId(docId);
    try {
      await documentService.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      alert('Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contract Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Intake, indexing status, page extraction, and vector storage for uploaded legal agreements
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          className="self-start p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Upload Zone */}
      <FileUpload onUploadSuccess={handleUploadSuccess} />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search contracts by title or file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          >
            <option value="all">All Documents</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing / Pending</option>
            <option value="error">Error / Scanned PDF</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3.5 px-6">Document Title</th>
                <th className="py-3.5 px-6">Pages & Size</th>
                <th className="py-3.5 px-6">Upload Date</th>
                <th className="py-3.5 px-6">Pipeline Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs">
                    Loading contracts repository...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs">
                    <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No documents found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p
                            onClick={() => onNavigate('viewer', { documentId: doc.id })}
                            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-xs"
                          >
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{doc.filename}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      <p className="font-semibold text-slate-800">{doc.page_count} pages</p>
                      <p className="text-[11px] text-slate-400">{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</p>
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    <td className="py-4 px-6">
                      {doc.is_scanned ? (
                        <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] font-semibold w-max"
                             title="Scanned PDF detected. No extractable text. OCR is not enabled.">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Scanned / OCR Needed</span>
                        </div>
                      ) : doc.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Indexed & Ready
                        </span>
                      ) : doc.status === 'processing' || doc.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          Processing Chunks
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200"
                              title={doc.error_message || 'Processing error'}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigate('viewer', { documentId: doc.id })}
                          title="Open Document Viewer"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onNavigate('analysis', { documentId: doc.id })}
                          title="View 8-Dimension Risk Analysis"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          disabled={deletingId === doc.id}
                          title="Delete Document"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
