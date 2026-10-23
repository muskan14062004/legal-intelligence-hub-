import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, FileText, Download, AlertCircle, Loader2, Maximize2 } from 'lucide-react';
import { documentService } from '../services/documentService';
import { PageResponse } from '../types';

interface PdfViewerModalProps {
  documentId: string;
  documentTitle: string;
  initialPage?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  documentId,
  documentTitle,
  initialPage = 1,
  isOpen,
  onClose,
}) => {
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [pageData, setPageData] = useState<PageResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'svg' | 'text'>('svg');

  useEffect(() => {
    if (isOpen && documentId) {
      setPageNumber(initialPage || 1);
    }
  }, [isOpen, documentId, initialPage]);

  useEffect(() => {
    if (!isOpen || !documentId) return;

    let active = true;
    setIsLoading(true);
    setError(null);

    documentService
      .getPage(documentId, pageNumber)
      .then((data) => {
        if (active) {
          setPageData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.detail || 'Failed to load page content.');
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [documentId, pageNumber, isOpen]);

  if (!isOpen) return null;

  const totalPages = pageData?.total_pages || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100/70 text-blue-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 truncate max-w-md">{documentTitle}</h3>
              <p className="text-xs text-slate-500">Document Inspection & Citation Verifier</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/70 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setViewMode('svg')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'svg' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Page Render
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
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
              title="Open raw PDF file"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100/50 flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm">Loading page {pageNumber}...</p>
            </div>
          ) : error ? (
            <div className="max-w-md p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Failed to Load Page</h4>
                <p className="text-xs mt-1 text-rose-600">{error}</p>
              </div>
            </div>
          ) : viewMode === 'svg' && pageData?.svg_data ? (
            <div
              className="bg-white shadow-md rounded-lg p-6 max-w-2xl w-full max-h-full overflow-auto border border-slate-200"
              dangerouslySetInnerHTML={{ __html: pageData.svg_data }}
            />
          ) : (
            <div className="bg-white shadow-md rounded-lg p-8 max-w-2xl w-full max-h-full overflow-auto border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b pb-2">
                Page {pageNumber} — Extracted Plain Text
              </h4>
              {pageData?.text?.trim() ? (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
                  {pageData.text}
                </pre>
              ) : (
                <div className="text-center py-12 text-slate-400 italic text-sm">
                  No extractable text on this page.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1 || isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Page
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-600">
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
              className="w-14 px-2 py-1 text-center border border-slate-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span>of {totalPages}</span>
          </div>

          <button
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            disabled={pageNumber >= totalPages || isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next Page
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
