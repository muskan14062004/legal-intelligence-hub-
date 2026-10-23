import React from 'react';
import {
  Scale,
  ShieldCheck,
  Search,
  MessageSquare,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle,
  FileSearch,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Legal Intelligence Hub</span>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">AI Contract Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('login')}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-blue-600 rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-8 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Local-First RAG with Page-Level Grounded Citations</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl">
          Understand Every Clause. <br />
          <span className="text-blue-600">Make Better Decisions.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
          The enterprise legal document analysis platform. Upload complex contracts, interrogate provisions with AI, detect risks, and verify every answer with clickable page citations.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => onNavigate('register')}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-base rounded-xl shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition-all"
          >
            Start Analyzing Contracts
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-base rounded-xl transition-all"
          >
            Existing User Login
          </button>
        </div>

        {/* Feature Pills */}
        <div className="mt-14 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> PyMuPDF Page-Level Citations</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> FAISS Vector Semantic Search</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> 8-Dimension Legal Risk Audit</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> Scanned PDF Detection</span>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Workflow</h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">How It Works</h3>
            <p className="mt-3 text-slate-500 text-sm">Four seamless stages from document intake to actionable legal intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Contract',
                desc: 'Upload standard or multi-page PDF agreements. The system extracts text preserving exact page numbers.',
                icon: FileText
              },
              {
                step: '02',
                title: 'Vector Indexing',
                desc: 'Text is chunked into contextual units and embedded using Sentence Transformers into a local FAISS index.',
                icon: Layers
              },
              {
                step: '03',
                title: 'RAG Interrogation',
                desc: 'Ask questions or execute natural-language semantic searches. Context is retrieved and verified strictly against document text.',
                icon: MessageSquare
              },
              {
                step: '04',
                title: 'Verify Citations',
                desc: 'Every response includes page badges [Document, Page X]. Click any citation to inspect the source page in the viewer.',
                icon: FileSearch
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col">
                  <div className="text-3xl font-extrabold text-blue-600/30 font-mono mb-4">{item.step}</div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mb-4">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Capabilities</h2>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Built for Legal Precision</h3>
          <p className="mt-3 text-slate-500 text-sm">Designed specifically for attorneys, procurement managers, and contract reviewers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Semantic Clause Search</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Locate indemnification caps, early termination clauses, and confidentiality exclusions across hundreds of pages in milliseconds using vector similarity.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600">
              Explore clauses <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">8-Dimension Risk Analysis</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated risk assessment across Termination, Indemnification, Liability caps, Renewal terms, Governing Law, and missing boilerplate provisions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600">
              Audit risks <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Grounding & Anti-Hallucination</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every AI response is strictly anchored in the uploaded PDF. If a contract lacks an answer, the model explicitly flags absence rather than inventing terms.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600">
              Zero fabrication <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* Security and Privacy Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-blue-400 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Security & Confidentiality First</h3>
          <p className="mt-4 text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
            Legal documents are confidential business assets. Legal Intelligence Hub operates with strict user-level database isolation, JWT access control, and local inference architecture.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <h5 className="font-semibold text-sm text-slate-200">Local LLM & Embedding</h5>
              <p className="mt-1 text-xs text-slate-400">Contracts are embedded and analyzed locally via Ollama without third-party API exposure.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <h5 className="font-semibold text-sm text-slate-200">User Access Isolation</h5>
              <p className="mt-1 text-xs text-slate-400">Strict backend authorization ensures users only query and view their own documents.</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <h5 className="font-semibold text-sm text-slate-200">Encrypted Credentials</h5>
              <p className="mt-1 text-xs text-slate-400">Cryptographic password hashing (Bcrypt) and stateless JWT verification on every endpoint.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Scale className="w-4 h-4 text-slate-900" />
            <span>Legal Intelligence Hub</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            AI legal assessment for human review. Does not constitute formal legal counsel.
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>React & Tailwind</span>
            <span>•</span>
            <span>PyMuPDF & FAISS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
