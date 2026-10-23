import api from './api';
import { SearchResponse } from '../types';

export const searchService = {
  async search(query: string, documentId?: string | null, limit: number = 10): Promise<SearchResponse> {
    const res = await api.post<SearchResponse>('/search', {
      query,
      document_id: documentId || undefined,
      limit,
    });
    return res.data;
  }
};
