import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface ProjectPage {
  id: string;
  project_id: string;
  title: string;
  content: any;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export const useProjectWiki = (projectId: string) => {
  const [pages, setPages] = useState<ProjectPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response = await api.get(`/api/projects/${projectId}/pages`);
      setPages(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addPage = async (page: Partial<ProjectPage>) => {
    try {
      const response = await api.post(`/api/projects/${projectId}/pages`, page);
      setPages(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Erro ao salvar página');
    }
  };

  useEffect(() => {
    fetchPages();
  }, [projectId]);

  return { pages, loading, error, addPage, refresh: fetchPages };
};
