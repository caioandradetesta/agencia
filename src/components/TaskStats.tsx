import React from 'react';
import { BarChart3, TrendingUp, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { useUsers } from '../hooks/useUsers';

export const TaskStats: React.FC = () => {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { users } = useUsers();

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTeam = users.length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon blue"><BarChart3 size={20} /></div>
        <div className="stat-info">
          <span className="label">Projetos Ativos</span>
          <span className="value">{activeProjects}</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon green"><TrendingUp size={20} /></div>
        <div className="stat-info">
          <span className="label">Tarefas Concluídas</span>
          <span className="value">{completedTasks}</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon purple"><UsersIcon size={20} /></div>
        <div className="stat-info">
          <span className="label">Equipe</span>
          <span className="value">{totalTeam}</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon orange"><AlertCircle size={20} /></div>
        <div className="stat-info">
          <span className="label">Urgências Ativas</span>
          <span className="value">{highPriorityTasks}</span>
        </div>
      </div>
    </div>
  );
};
