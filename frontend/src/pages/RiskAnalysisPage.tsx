import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { analysisService } from '../services/analysisService';
import { documentService } from '../services/documentService';
import { RiskBadge } from '../components/RiskBadge';
import { PdfViewerModal } from '../components/PdfViewerModal';
import { Document, RiskAnalysis, Finding } from '../types';

interface RiskAnalysisPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialDocumentId?: string;
}

export const RiskAnalysisPage: React.FC<RiskAnalysisPageProps> = ({
  onNavigate,
  initialDocumentId,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || '');
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const [modalViewerDoc, setModalViewerDoc] = useState<{ id: string; title: string; page: number } | null>(null);

  useEffect(() => {
    documentService
      .listDocuments()
      .then((docs) => {
        const completed = docs.filter((d) => d.status === 'completed');
        setDocuments(completed);
        if (!selectedDocId && completed.length > 0) {
          setSelectedDocId(completed[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      loadAnalysis(selectedDocId);
    } else {
      setAnalysis(null);
    }
  }, [selectedDocId]);

  const loadAnalysis = async (docId: string) => {
    setIsLoading(true);
    try {
      const data = await analysisService.getAnalysis(docId);
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!selectedDocId) return;
    setIsLoading(true);
    try {
      const data = await analysisService.runAnalysis(selectedDocId);
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFindings = analysis?.findings.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.risk_level.toLowerCase() === severityFilter.toLowerCase();
  }) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            Contract Risk & Clause Analysis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated compliance evaluation across 8 standard commercial and legal dimensions
          </p>
        </div>

        {/* Contract Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm max-w-xs truncate"
          >
            {documents.length === 0 ? (
              <option value="">No completed contracts found</option>
            ) : (
              documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))
            )}
          </select>

          <button
            onClick={handleReanalyze}
            disabled={!selectedDocId || isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex items-center gap-2 text-xs font-semibold disabled:opacity-40"
            title="Re-run 8-dimension risk audit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Re-Audit
          </button>
        </div>
      </div>

      {/* Mandatory Legal Disclaimer Alert */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 text-amber-800 rounded-2xl flex items-start gap-3 text-xs leading-relaxed shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider text-[11px] text-amber-900 block mb-0.5">
            Preliminary AI Risk Assessment — Review Notice
          </span>
          {analysis?.disclaimer ||
            "Risk evaluations are preliminary automated assessments grounded in the uploaded document text. They do not constitute formal legal counsel. Missing clause indications represent absence of express language in extracted pages."}
        </div>
      </div>

      {/* Risk Metrics Cards */}
      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Findings</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{analysis.total_findings}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              8/8
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">High Risk Concerns</p>
              <h3 className="text-2xl font-bold text-rose-700 mt-1">{analysis.high_risk_count}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Medium Risk Items</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">{analysis.medium_risk_count}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Low Risk / Standard</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-1">{analysis.low_risk_count}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <span className="text-slate-400 mr-2">Filter by Severity:</span>
        {['all', 'high', 'medium', 'low'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSeverityFilter(lvl)}
            className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
              severityFilter === lvl
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {lvl} ({lvl === 'all' ? analysis?.total_findings ?? 0 : lvl === 'high' ? analysis?.high_risk_count ?? 0 : lvl === 'medium' ? analysis?.medium_risk_count ?? 0 : analysis?.low_risk_count ?? 0})
          </button>
        ))}
      </div>

      {/* Findings List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p>Analyzing contract across 8 legal dimensions...</p>
          </div>
        ) : !analysis || filteredFindings.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No findings matching the selected filter.
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {finding.category}
                      </span>
                      <RiskBadge level={finding.risk_level} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{finding.clause_title}</h3>
                  </div>

                  <button
                    onClick={() =>
                      setModalViewerDoc({
                        id: analysis.document_id,
                        title: analysis.document_title,
                        page: finding.page_number
                      })
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors self-start"
                  >
                    <span>View on Page {finding.page_number}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Explanation */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Potential Concern & Risk Rationale</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{finding.explanation}</p>
                </div>

                {/* Extracted Clause Snippet */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Extracted Clause Text</h4>
                  <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-800 font-mono leading-relaxed">
                    "{finding.extracted_text}"
                  </div>
                </div>

                {/* Suggested Questions for Human Review */}
                {finding.suggested_questions && finding.suggested_questions.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                      Recommended Questions for Legal Review
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {finding.suggested_questions.map((q, qIdx) => (
                        <li key={qIdx} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold shrink-0">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PDF Inspection Modal */}
      {modalViewerDoc && (
        <PdfViewerModal
          isOpen={true}
          documentId={modalViewerDoc.id}
          documentTitle={modalViewerDoc.title}
          initialPage={modalViewerDoc.page}
          onClose={() => setModalViewerDoc(null)}
        />
      )}
    </div>
  );
};
