import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface Project {
  id: string;
  name: string;
  client_id: string;
  client_name?: string;
  description: string;
  status: string;
  created_at: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/projects');
      setProjects(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { projects, loading, error, refresh: fetchProjects };
};
