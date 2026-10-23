import React, { useState, useEffect } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Search,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { analysisService } from '../services/analysisService';
import { RiskBadge } from '../components/RiskBadge';
import { DocumentDetail, PageResponse, RiskAnalysis } from '../types';

interface DocumentViewerPageProps {
  documentId: string;
  initialPage?: number;
  onNavigate: (page: string, params?: any) => void;
}

export const DocumentViewerPage: React.FC<DocumentViewerPageProps> = ({
  documentId,
  initialPage = 1,
  onNavigate,
}) => {
  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(initialPage || 1);
  const [pageData, setPageData] = useState<PageResponse | null>(null);
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<'svg' | 'text'>('svg');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'clauses' | 'metadata'>('clauses');

  useEffect(() => {
    if (!documentId) return;

    documentService.getDocument(documentId).then(setDocDetail).catch(console.error);
    analysisService.getAnalysis(documentId).then(setAnalysis).catch(console.error);
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return;

    setIsLoading(true);
    documentService
      .getPage(documentId, pageNumber)
      .then((data) => {
        setPageData(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [documentId, pageNumber]);

  const totalPages = docDetail?.page_count || pageData?.total_pages || 1;

  // Filter clauses that appear on current page
  const pageClauses = analysis?.findings.filter((f) => f.page_number === pageNumber) || [];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('documents')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xs font-bold text-slate-900 truncate max-w-sm">
              {docDetail?.title || 'Contract Viewer'}
            </h2>
            <p className="text-[10px] text-slate-400">
              {docDetail?.filename} • {(docDetail?.file_size ? docDetail.file_size / (1024 * 1024) : 0).toFixed(2)} MB
            </p>
          </div>
        </div>

        {/* Center Page Stepper */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1 || isLoading}
            className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageNumber}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setPageNumber(val);
                }
              }}
              className="w-12 py-1 text-center border border-slate-300 rounded text-xs focus:outline-none"
            />
            <span>of {totalPages}</span>
          </div>

          <button
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            disabled={pageNumber >= totalPages || isLoading}
            className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('svg')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'svg' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Page Render
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Extracted Text
            </button>
          </div>

          <a
            href={documentService.getPdfUrl(documentId)}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Document Page Viewer */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span>Rendering page {pageNumber}...</span>
            </div>
          ) : viewMode === 'svg' && pageData?.svg_data ? (
            <div
              className="bg-white shadow-xl rounded-xl p-8 max-w-3xl w-full max-h-full overflow-auto border border-slate-200"
              dangerouslySetInnerHTML={{ __html: pageData.svg_data }}
            />
          ) : (
            <div className="bg-white shadow-xl rounded-xl p-10 max-w-3xl w-full max-h-full overflow-auto border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b">
                Page {pageNumber} of {totalPages}
              </h3>
              {pageData?.text?.trim() ? (
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                  {pageData.text}
                </pre>
              ) : (
                <p className="text-slate-400 italic text-xs py-12 text-center">
                  No extractable text on this page.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Contract Metadata & Extracted Clauses Sidepanel */}
        <div className="w-96 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="border-b border-slate-100 flex text-xs font-semibold">
            <button
              onClick={() => setActiveTab('clauses')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                activeTab === 'clauses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Audited Clauses ({analysis?.findings?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                activeTab === 'metadata'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Metadata & Chunks
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'clauses' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Clauses on Page {pageNumber}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {pageClauses.length} located
                  </span>
                </div>

                {pageClauses.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                    No audited risk findings directly flagged on Page {pageNumber}.
                  </div>
                ) : (
                  pageClauses.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{c.clause_title}</span>
                        <RiskBadge level={c.risk_level} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-600">{c.explanation}</p>
                      <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-700">
                        "{c.extracted_text.slice(0, 150)}..."
                      </div>
                    </div>
                  ))
                )}

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">All Contract Dimensions</h4>
                  <div className="space-y-2">
                    {analysis?.findings.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setPageNumber(f.page_number)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                          f.page_number === pageNumber
                            ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate max-w-[190px]">{f.category}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400">p. {f.page_number}</span>
                          <RiskBadge level={f.risk_level} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800">Document Information</h4>
                  <div className="space-y-1 text-slate-600">
                    <p><span className="font-semibold">Title:</span> {docDetail?.title}</p>
                    <p><span className="font-semibold">Original Filename:</span> {docDetail?.filename}</p>
                    <p><span className="font-semibold">Total Pages:</span> {docDetail?.page_count}</p>
                    <p><span className="font-semibold">Total Chunks:</span> {docDetail?.total_chunks}</p>
                    <p><span className="font-semibold">Uploaded:</span> {docDetail?.created_at ? new Date(docDetail.created_at).toLocaleString() : 'N/A'}</p>
                    <p><span className="font-semibold">Vector Index:</span> FAISS FlatIP (384-d)</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Interrogate in Chat
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Launch a scoped AI conversation to ask detailed questions specifically about this agreement.
                  </p>
                  <button
                    onClick={() => onNavigate('chat', { documentId: docDetail?.id })}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs hover:bg-blue-600 transition-colors"
                  >
                    Open in AI Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
