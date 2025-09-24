import axios from 'axios';
import { TransactionAnalysisResponse, AddressAnalysisResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const analyzeTransaction = async (txHash: string): Promise<TransactionAnalysisResponse> => {
  const response = await api.get(`/analyze/transaction/${txHash}`);
  return response.data;
};

export const analyzeAddress = async (address: string): Promise<AddressAnalysisResponse> => {
  const response = await api.get(`/analyze/address/${address}`);
  return response.data;
};

export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};