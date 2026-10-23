export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Document {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  page_count: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  is_scanned: boolean;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends Document {
  total_chunks: number;
  total_findings: number;
}

export interface PageResponse {
  document_id: string;
  page_number: number;
  total_pages: number;
  text: string;
  has_text: boolean;
  svg_data?: string | null;
}

export interface Citation {
  document_id: string;
  document_title: string;
  page_number: number;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  document_id?: string | null;
  document_title?: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchResultItem {
  chunk_id: string;
  document_id: string;
  document_title: string;
  page_number: number;
  excerpt: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}

export interface Finding {
  id: string;
  category: string;
  clause_title: string;
  extracted_text: string;
  page_number: number;
  explanation: string;
  risk_level: 'Low' | 'Medium' | 'High';
  suggested_questions: string[];
  created_at: string;
}

export interface RiskAnalysis {
  document_id: string;
  document_title: string;
  total_findings: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  findings: Finding[];
  disclaimer: string;
}

export interface DashboardStats {
  total_documents: number;
  awaiting_processing: number;
  completed_analyses: number;
  error_documents: number;
  total_conversations: number;
  recent_documents: {
    id: string;
    title: string;
    filename: string;
    file_size: number;
    page_count: number;
    status: string;
    created_at: string;
  }[];
  recent_activities: {
    id: string;
    type: 'upload' | 'chat';
    title: string;
    status: string;
    timestamp: string;
  }[];
}
