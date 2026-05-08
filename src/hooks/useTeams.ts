import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/teams');
      setTeams(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return { teams, loading, error, refresh: fetchTeams };
};
