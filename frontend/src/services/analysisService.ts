import api from './api';
import { RiskAnalysis } from '../types';

export const analysisService = {
  async getAnalysis(documentId: string): Promise<RiskAnalysis> {
    const res = await api.get<RiskAnalysis>(`/documents/${documentId}/analysis`);
    return res.data;
  },

  async runAnalysis(documentId: string): Promise<RiskAnalysis> {
    const res = await api.post<RiskAnalysis>(`/documents/${documentId}/analyze`);
    return res.data;
  }
};
