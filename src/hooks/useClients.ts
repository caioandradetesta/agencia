import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  logo_url?: string;
  project_count?: number;
  created_at: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/clients');
      setClients(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, loading, error, refresh: fetchClients };
};
