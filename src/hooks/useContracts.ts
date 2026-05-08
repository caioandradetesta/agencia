import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Contract {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  file_url?: string;
  status: 'draft' | 'pending' | 'signed' | 'expired';
  value: number;
  created_at: string;
  projects?: {
    name: string;
  };
  clients?: {
    company: string;
  };
}

export const useContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          projects ( name ),
          clients ( company )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return { contracts, loading, error, refresh: fetchContracts };
};
