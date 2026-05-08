import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface Contract {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  file_url?: string;
  status: 'draft' | 'pending' | 'signed' | 'expired';
  value: number;
  created_at: string;
  project_name?: string;
  client_name?: string;
}

export const useContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/contracts');
      setContracts(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addContract = async (contract: Partial<Contract>) => {
    try {
      const response = await api.post('/api/contracts', contract);
      setContracts(prev => [response.data, ...prev]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao salvar contrato');
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return { contracts, loading, error, addContract, refresh: fetchContracts };
};
