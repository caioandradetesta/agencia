import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  project_id: string;
  description?: string;
  priority?: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tasks');
      setTasks(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/api/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? response.data : t));
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
    }
  };

  const addTask = async (task: Partial<Task>) => {
    try {
      const response = await api.post('/api/tasks', task);
      setTasks(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Erro ao adicionar tarefa:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return { tasks, loading, error, updateTaskStatus, addTask, refresh: fetchTasks };
};
