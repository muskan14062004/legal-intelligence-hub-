import api from './api';
import { Document, DocumentDetail, PageResponse } from '../types';

export const documentService = {
  async uploadDocument(
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post<Document>('/documents/upload', formData, {
      onUploadProgress,
    });
    return res.data;
  },

  async listDocuments(search?: string): Promise<Document[]> {
    const params = search ? { search } : {};
    const res = await api.get<Document[]>('/documents', { params });
    return res.data;
  },

  async getDocument(documentId: string): Promise<DocumentDetail> {
    const res = await api.get<DocumentDetail>(`/documents/${documentId}`);
    return res.data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`);
  },

  async getPage(documentId: string, pageNumber: number): Promise<PageResponse> {
    const res = await api.get<PageResponse>(`/documents/${documentId}/pages/${pageNumber}`);
    return res.data;
  },

  getPdfUrl(documentId: string): string {
    const token = localStorage.getItem('legal_hub_token');
    const base = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8000/api'
        : '/api';
    return `${base}/documents/${documentId}/file${token ? `?token=${token}` : ''}`;
  }
};
