import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { Citation } from '../types';

interface CitationBadgeProps {
  citation: Citation;
  onClick?: (citation: Citation) => void;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ citation, onClick }) => {
  return (
    <button
      onClick={() => onClick && onClick(citation)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm text-left group"
      title={`Click to view ${citation.document_title} on Page ${citation.page_number}`}
    >
      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
      <span className="font-semibold text-slate-800 truncate max-w-[160px]">
        {citation.document_title}
      </span>
      <span className="bg-blue-200/70 text-blue-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
        p. {citation.page_number}
      </span>
      <ExternalLink className="w-3 h-3 text-blue-400 group-hover:text-blue-600 transition-colors shrink-0" />
    </button>
  );
};
