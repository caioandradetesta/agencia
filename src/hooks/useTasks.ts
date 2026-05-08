import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Task {
  id: string;
  project_id: string;
  assigned_to: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const useTasks = (projectId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase.from('tasks').select('*, profiles(full_name)');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const createTask = async (task: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      alert('Erro ao criar tarefa: ' + err.message);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  return { tasks, loading, error, updateTaskStatus, createTask, refresh: fetchTasks };
};
