import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  FileText, 
  CheckSquare, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  Loader2, 
  Activity, 
  DollarSign
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { useUsers } from '../hooks/useUsers';
import { useContracts } from '../hooks/useContracts';
import { getFullUrl } from '../lib/api';

import { AddTaskModal } from '../components/AddTaskModal';
import { AddProjectModal } from '../components/AddProjectModal';
import { AddClientModal } from '../components/AddClientModal';
import { AddContractModal } from '../components/AddContractModal';

import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Modals visibility state
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);

  // Data fetching hooks
  const { tasks, loading: tasksLoading, refresh: refreshTasks } = useTasks();
  const { clients, loading: clientsLoading, refresh: refreshClients } = useClients();
  const { projects, loading: projectsLoading, refresh: refreshProjects } = useProjects();
  const { users, loading: usersLoading, refresh: refreshUsers } = useUsers();
  const { contracts, loading: contractsLoading, refresh: refreshContracts } = useContracts();

  const refreshAll = () => {
    refreshTasks();
    refreshClients();
    refreshProjects();
    refreshUsers();
    refreshContracts();
  };

  const loading = tasksLoading || clientsLoading || projectsLoading || usersLoading || contractsLoading;

  // Task metrics calculation
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const workingTasks = tasks.filter(t => t.status === 'doing' || t.status === 'review').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  // Financial metrics calculation
  const totalValue = contracts.reduce((acc, c) => acc + Number(c.value || 0), 0);
  const signedValue = contracts.filter(c => c.status === 'signed').reduce((acc, c) => acc + Number(c.value || 0), 0);
  const signedCount = contracts.filter(c => c.status === 'signed').length;
  const pendingCount = contracts.filter(c => c.status === 'pending' || c.status === 'draft').length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="spinner animate-spin" size={48} />
        <p>Carregando métricas e dados do painel...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Header Info */}
      <div className="page-header">
        <div className="header-info">
          <h1>Painel de Controle 👋</h1>
          <p>Aqui está o resumo geral das atividades e métricas da agência.</p>
        </div>
      </div>

      {/* Tasks Overview Section */}
      <div className="metrics-section">
        <h3 className="dashboard-section-title"><CheckSquare size={18} /> Fluxo de Tarefas</h3>
        <div className="status-breakdown-grid">
          <div className="status-stat-item">
            <span className="status-indicator-dot" style={{ backgroundColor: '#64748B' }}></span>
            <div className="status-stat-info">
              <span className="label">Total de Tarefas</span>
              <span className="count">{totalTasks}</span>
            </div>
          </div>
          <div className="status-stat-item">
            <span className="status-indicator-dot" style={{ backgroundColor: '#94A3B8' }}></span>
            <div className="status-stat-info">
              <span className="label">A Fazer</span>
              <span className="count">{todoTasks}</span>
            </div>
          </div>
          <div className="status-stat-item">
            <span className="status-indicator-dot" style={{ backgroundColor: '#3B82F6' }}></span>
            <div className="status-stat-info">
              <span className="label">Trabalhando</span>
              <span className="count">{workingTasks}</span>
            </div>
          </div>
          <div className="status-stat-item">
            <span className="status-indicator-dot" style={{ backgroundColor: '#10B981' }}></span>
            <div className="status-stat-info">
              <span className="label">Concluídas</span>
              <span className="count">{completedTasks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Indicators */}
      <div className="metrics-section">
        <h3 className="dashboard-section-title"><Activity size={18} /> Indicadores Gerais</h3>
        <div className="metrics-row">
          <div className="metric-card-premium blue-card" onClick={() => navigate('/clients')} style={{ cursor: 'pointer' }}>
            <div className="metric-card-header">
              <h3>Clientes</h3>
              <div className="metric-card-icon-box">
                <Users size={20} />
              </div>
            </div>
            <div className="metric-card-body">
              <span className="value">{clients.length}</span>
              <span className="subtitle">Marcas e empresas parceiras</span>
            </div>
          </div>

          <div className="metric-card-premium purple-card" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
            <div className="metric-card-header">
              <h3>Projetos</h3>
              <div className="metric-card-icon-box">
                <Briefcase size={20} />
              </div>
            </div>
            <div className="metric-card-body">
              <span className="value">{projects.length}</span>
              <span className="subtitle">Projetos em andamento e entregues</span>
            </div>
          </div>

          <div className="metric-card-premium green-card" onClick={() => navigate('/contracts')} style={{ cursor: 'pointer' }}>
            <div className="metric-card-header">
              <h3>Contratos</h3>
              <div className="metric-card-icon-box">
                <FileText size={20} />
              </div>
            </div>
            <div className="metric-card-body">
              <span className="value">{contracts.length}</span>
              <span className="subtitle">Total de acordos cadastrados</span>
            </div>
          </div>

          <div className="metric-card-premium orange-card" onClick={() => navigate('/users')} style={{ cursor: 'pointer' }}>
            <div className="metric-card-header">
              <h3>Equipe</h3>
              <div className="metric-card-icon-box">
                <Users size={20} />
              </div>
            </div>
            <div className="metric-card-body">
              <span className="value">{users.length}</span>
              <span className="subtitle">Membros ativos da agência</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Section */}
      <div className="metrics-section">
        <h3 className="dashboard-section-title"><DollarSign size={18} /> Resumo Financeiro</h3>
        <div className="metrics-row">
          <div className="metric-card-premium green-card">
            <div className="metric-card-header">
              <h3>Receita Assinada</h3>
              <div className="metric-card-icon-box" style={{ color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <DollarSign size={20} />
              </div>
            </div>
            <div className="metric-card-body">
              <span className="value">{formatCurrency(signedValue)}</span>
              <span className="subtitle">Valor de {signedCount} {signedCount === 1 ? 'contrato assinado' : 'contratos assinados'}</span>
            </div>
          </div>

          <div className="metric-card-premium blue-card">
            <div className="metric-card-header">
              <h3>Faturamento Total</h3>
              <div className="metric-card-icon-box" style={{ color: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="metric-card-body">
              <span className="value">{formatCurrency(totalValue)}</span>
              <span className="subtitle">Inclui {contracts.length} contratos cadastrados (geral)</span>
            </div>
          </div>

          <div className="metric-card-premium orange-card">
            <div className="metric-card-header">
              <h3>Contratos Pendentes</h3>
              <div className="metric-card-icon-box" style={{ color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <AlertCircle size={20} />
              </div>
            </div>
            <div className="metric-card-body">
              <span className="value">{pendingCount}</span>
              <span className="subtitle">Aguardando assinatura ou rascunhos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recents Lists & Quick Actions Panel */}
      <div className="dashboard-panels-grid">
        {/* Recents Flex */}
        <div className="dashboard-panel-card">
          <div className="panel-header-row">
            <h3><Activity size={18} /> Atividades Recentes</h3>
          </div>
          
          <div className="recents-flex-grid">
            {/* Recent Projects */}
            <div className="recents-list-wrapper">
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Últimos Projetos</h4>
              <div className="recents-list">
                {projects.slice(0, 4).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nenhum projeto cadastrado.</p>
                ) : (
                  projects.slice(0, 4).map(project => (
                    <div 
                      key={project.id} 
                      className="recent-project-item"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="recent-item-main">
                        <div className="recent-item-icon-box">
                          <Briefcase size={16} />
                        </div>
                        <div className="recent-item-text">
                          <h4>{project.name}</h4>
                          <span>{project.client_name || 'Sem cliente'}</span>
                        </div>
                      </div>
                      <span className={`project-status-tag ${project.status}`}>
                        {project.status === 'active' ? 'Ativo' : 'Concluído'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Clients */}
            <div className="recents-list-wrapper">
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Últimos Clientes</h4>
              <div className="recents-list">
                {clients.slice(0, 4).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nenhum cliente cadastrado.</p>
                ) : (
                  clients.slice(0, 4).map(client => (
                    <div 
                      key={client.id} 
                      className="recent-client-item"
                      onClick={() => navigate(`/clients`)}
                    >
                      <div className="recent-item-main">
                        {client.logo_url ? (
                          <img src={getFullUrl(client.logo_url)} alt={client.name} className="recent-client-logo" />
                        ) : (
                          <div className="recent-item-icon-box">
                            <Users size={16} />
                          </div>
                        )}
                        <div className="recent-item-text">
                          <h4>{client.company || client.name}</h4>
                          <span>{client.name}</span>
                        </div>
                      </div>
                      <ArrowUpRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="dashboard-panel-card">
          <div className="panel-header-row">
            <h3><Plus size={18} /> Ações Rápidas</h3>
          </div>
          
          <div className="quick-actions-list">
            <button className="quick-action-btn-dashboard" onClick={() => setShowAddTask(true)}>
              <div className="btn-content">
                <div className="icon-circle"><CheckSquare size={16} /></div>
                <span>Nova Tarefa</span>
              </div>
              <Plus size={16} />
            </button>

            <button className="quick-action-btn-dashboard" onClick={() => setShowAddProject(true)}>
              <div className="btn-content">
                <div className="icon-circle"><Briefcase size={16} /></div>
                <span>Novo Projeto</span>
              </div>
              <Plus size={16} />
            </button>

            <button className="quick-action-btn-dashboard" onClick={() => setShowAddClient(true)}>
              <div className="btn-content">
                <div className="icon-circle"><Users size={16} /></div>
                <span>Novo Cliente</span>
              </div>
              <Plus size={16} />
            </button>

            <button className="quick-action-btn-dashboard" onClick={() => setShowAddContract(true)}>
              <div className="btn-content">
                <div className="icon-circle"><FileText size={16} /></div>
                <span>Novo Contrato</span>
              </div>
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Creation Modals */}
      {showAddTask && (
        <AddTaskModal 
          onClose={() => setShowAddTask(false)}
          onSuccess={refreshAll}
        />
      )}

      {showAddProject && (
        <AddProjectModal 
          onClose={() => setShowAddProject(false)}
          onSuccess={refreshAll}
        />
      )}

      {showAddClient && (
        <AddClientModal 
          onClose={() => setShowAddClient(false)}
          onSuccess={refreshAll}
        />
      )}

      {showAddContract && (
        <AddContractModal 
          onClose={() => setShowAddContract(false)}
          onSuccess={refreshAll}
        />
      )}
    </div>
  );
};
