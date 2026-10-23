import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { searchService } from '../services/searchService';
import { documentService } from '../services/documentService';
import { PdfViewerModal } from '../components/PdfViewerModal';
import { SearchResultItem, Document } from '../types';

interface SemanticSearchPageProps {
  onNavigate: (page: string, params?: any) => void;
}

const EXAMPLE_SEARCHES = [
  "Find clauses about early termination",
  "Search for automatic renewal provisions",
  "Find references to liability limitations",
  "Locate payment deadlines and invoicing grace periods",
  "Indemnification for third-party intellectual property claims"
];

export const SemanticSearchPage: React.FC<SemanticSearchPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [modalViewerDoc, setModalViewerDoc] = useState<{ id: string; title: string; page: number } | null>(null);

  useEffect(() => {
    documentService.listDocuments().then(setDocuments).catch(console.error);
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await searchService.search(q, selectedDocId || undefined, 12);
      setResults(res.results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vector Similarity Embedding Search</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Semantic Clause Search</h1>
        <p className="text-xs text-slate-500 mt-2">
          Search across contractual provisions using natural concepts rather than exact keyword matches.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="e.g. Find clauses regarding liquidated damages or early exit rights..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Uploaded Documents</option>
              {documents
                .filter((d) => d.status === 'completed')
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
            </select>

            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="px-6 py-3 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 shrink-0"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search Clauses
            </button>
          </div>
        </form>

        {/* Example queries */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-400">Try searching:</span>
          {EXAMPLE_SEARCHES.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(ex);
                handleSearch(ex);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {isSearching ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p>Scanning FAISS vector embeddings across contract chunks...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No matching clauses found. Try adjusting query phrasing or upload relevant agreements.
          </div>
        ) : (
          results.map((item) => (
            <div
              key={item.chunk_id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{item.document_title}</h3>
                    <p className="text-[11px] text-slate-400">Page {item.page_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{Math.round(item.score * 100)}% Similarity Match</span>
                  </div>

                  <button
                    onClick={() =>
                      setModalViewerDoc({
                        id: item.document_id,
                        title: item.document_title,
                        page: item.page_number
                      })
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <span>Inspect Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Excerpt Text */}
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-800 leading-relaxed font-mono">
                "{item.excerpt}..."
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
