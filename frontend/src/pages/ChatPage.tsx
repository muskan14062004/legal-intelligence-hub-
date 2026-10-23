import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User as UserIcon,
  FileText,
  Trash2,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { documentService } from '../services/documentService';
import { CitationBadge } from '../components/CitationBadge';
import { PdfViewerModal } from '../components/PdfViewerModal';
import { ChatMessage, Conversation, Document, Citation } from '../types';

interface ChatPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialDocumentId?: string;
}

const SAMPLE_QUESTIONS = [
  "What are the termination conditions?",
  "What are the payment obligations and invoicing schedules?",
  "Identify clauses that could create risks for the buyer.",
  "What happens if either party breaches the agreement?",
  "Summarize the confidentiality clause and sunset periods.",
  "Which party is responsible for indemnification obligations?"
];

export const ChatPage: React.FC<ChatPageProps> = ({ onNavigate, initialDocumentId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || '');
  const [expandedExcerptId, setExpandedExcerptId] = useState<string | null>(null);

  // PDF Viewer Modal State for clicking citations
  const [modalViewerDoc, setModalViewerDoc] = useState<{ id: string; title: string; page: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load documents and conversation history
    documentService.listDocuments().then(setDocuments).catch(console.error);
    loadHistory();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      chatService.getMessages(activeConversationId).then(setMessages).catch(console.error);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const loadHistory = async () => {
    try {
      const history = await chatService.getHistory();
      setConversations(history);
      if (history.length > 0 && !activeConversationId) {
        setActiveConversationId(history[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isSending) return;

    setInputQuery('');
    setIsSending(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || '',
      role: 'user',
      content: textToSend,
      citations: [],
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatService.sendMessage(
        textToSend,
        activeConversationId,
        selectedDocId || undefined
      );

      if (!activeConversationId) {
        setActiveConversationId(res.conversation_id);
        loadHistory();
      }

      setMessages((prev) => [...prev, res.message]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        conversation_id: activeConversationId || '',
        role: 'assistant',
        content: `Error: ${err.response?.data?.detail || 'Failed to process legal query through RAG pipeline.'}`,
        citations: [],
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;

    try {
      await chatService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCitationClick = (citation: Citation) => {
    setModalViewerDoc({
      id: citation.document_id,
      title: citation.document_title,
      page: citation.page_number
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50">
      {/* Conversations Sidebar */}
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Research Threads</h2>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-blue-600 transition-colors text-xs font-semibold flex items-center gap-1 px-2.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs px-4">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No prior conversations. Ask a question to begin RAG legal analysis.
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activeConversationId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConversationId(c.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-900 font-semibold border border-blue-200/60 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="truncate flex-1 pr-2">
                    <p className="truncate">{c.title}</p>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Scope Selector Header */}
        <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Document Scope:</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs max-w-xs truncate"
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
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Strict Page-Grounded RAG</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">AI Contract Interrogator</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Ask specific questions regarding termination conditions, payment liability, indemnification, or confidentiality clauses.
              </p>

              {/* Sample Questions */}
              <div className="mt-8 text-left">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                  Suggested Legal Queries
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SAMPLE_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="p-3 text-left bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 rounded-xl text-xs text-slate-700 hover:text-blue-900 font-medium transition-colors"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isAssistant ? '' : 'ml-auto justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs">
                      <Bot className="w-4 h-4 text-blue-400" />
                    </div>
                  )}

                  <div className={`space-y-3 ${isAssistant ? 'flex-1' : 'max-w-xl'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-50 border border-slate-200 text-slate-800'
                          : 'bg-slate-900 text-white font-medium'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    </div>

                    {/* Citations & Source Excerpts for Assistant */}
                    {isAssistant && msg.citations && msg.citations.length > 0 && (
                      <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Grounded Page Citations ({msg.citations.length})
                          </p>
                          <span className="text-[10px] text-slate-400">Click citation to inspect PDF</span>
                        </div>

                        {/* Citation Badges */}
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((c, i) => (
                            <CitationBadge
                              key={i}
                              citation={c}
                              onClick={handleCitationClick}
                            />
                          ))}
                        </div>

                        {/* Excerpts Accordion */}
                        <div className="pt-1 border-t border-blue-100/60">
                          <button
                            onClick={() =>
                              setExpandedExcerptId(expandedExcerptId === msg.id ? null : msg.id)
                            }
                            className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900"
                          >
                            {expandedExcerptId === msg.id ? (
                              <>
                                Hide Source Passages <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                View Verified Source Excerpts <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>

                          {expandedExcerptId === msg.id && (
                            <div className="mt-2 space-y-2 animate-in fade-in">
                              {msg.citations.map((c, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 font-mono leading-relaxed"
                                >
                                  <div className="font-sans font-bold text-slate-800 mb-1 flex items-center justify-between">
                                    <span>{c.document_title} — Page {c.page_number}</span>
                                    <button
                                      onClick={() => handleCitationClick(c)}
                                      className="text-[10px] text-blue-600 hover:underline"
                                    >
                                      Jump to Page
                                    </button>
                                  </div>
                                  "{c.excerpt}"
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Retrieving context & grounding citations...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Ask questions about clauses, liabilities, breach terms, or warranties..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isSending}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isSending}
              className="p-3 bg-slate-900 hover:bg-blue-600 text-white rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
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
