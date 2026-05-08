import React, { useState } from 'react';
import { Users, Settings, Plus, Shield, Trash2, Mail, MoreHorizontal, Edit3, Search, Loader2, AlertCircle } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { useTeams } from '../hooks/useTeams';
import { AddUserModal } from '../components/AddUserModal';
import { AddTeamModal } from '../components/AddTeamModal';
import { EditUserModal } from '../components/EditUserModal';
import { WorkflowSettingsModal } from '../components/WorkflowSettingsModal';
import { api } from '../lib/api';
import './UsersPage.css';

export const UsersPage: React.FC = () => {
  const { users, loading: usersLoading, error: usersError, refresh: refreshUsers } = useUsers();
  const { teams, refresh: refreshTeams } = useTeams();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'teams'>('members');

  const refreshAll = () => {
    refreshUsers();
    refreshTeams();
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta equipe? Os usuários não serão excluídos, mas ficarão sem equipe.')) return;
    try {
      await api.delete(`/api/teams/${id}`);
      refreshAll();
    } catch (err: any) {
      alert('Erro ao excluir equipe: ' + err.message);
    }
  };

  return (
    <div className="users-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>Gestão de Usuários</h1>
          <p>Gerencie sua equipe e permissões de acesso.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={() => setShowTeamModal(true)}>
            <Users size={18} />
            Nova Equipe
          </button>
          <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="add-user-btn" 
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            onClick={() => setShowWorkflowModal(true)}
          >
            <Settings size={18} />
            Configurar Automação
          </button>
          <button className="add-user-btn" onClick={() => setShowUserModal(true)}>
            <Plus size={18} />
            Convidar Membro
          </button>
        </div>
        </div>
      </div>

      <div className="users-stats">
        <div className="u-stat">
          <span className="u-label">Total de Membros</span>
          <span className="u-value">{users.length}</span>
        </div>
        <div className="u-stat">
          <span className="u-label">Membros Ativos</span>
          <span className="u-value">{users.filter(u => u.role !== 'inactive').length}</span>
        </div>
        <div className="u-stat">
          <span className="u-label">Equipes</span>
          <span className="u-value">{teams.length}</span>
        </div>
      </div>

      <div className="users-container">
        <div className="table-controls">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              Membros
            </button>
            <button 
              className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              Equipes
            </button>
          </div>
          <div className="filter-right">
            <div className="search-bar">
              <Search size={18} />
              <input type="text" placeholder={`Buscar ${activeTab === 'members' ? 'membros' : 'equipes'}...`} />
            </div>
            <button className="secondary-btn" onClick={refreshAll}>Atualizar</button>
          </div>
        </div>

        {activeTab === 'members' ? (
          usersLoading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin" size={32} />
              <p>Carregando membros da equipe...</p>
            </div>
          ) : usersError ? (
            <div className="error-state">
              <AlertCircle size={32} />
              <p>Erro ao carregar dados: {usersError}</p>
              <button onClick={refreshAll}>Tentar novamente</button>
            </div>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Membro</th>
                    <th>Equipe</th>
                    <th>Função</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                        Nenhum usuário encontrado no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className="u-avatar">
                              {user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.full_name?.charAt(0)}
                            </div>
                            <div className="u-info">
                              <span className="u-name">{user.full_name}</span>
                              <span className="u-email">{user.email || 'Sem e-mail'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="team-tag">{user.team_name || 'Sem Equipe'}</span>
                        </td>
                        <td>
                          <div className="role-cell">
                            <Shield size={14} />
                            {user.role}
                          </div>
                        </td>
                        <td>
                          <span className="status-badge ativo">Ativo</span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button 
                              className="icon-btn" 
                              onClick={() => setEditingUser(user)}
                              title="Editar"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button className="icon-btn"><Mail size={16} /></button>
                            <button className="icon-btn delete"><Trash2 size={16} /></button>
                            <button className="icon-btn"><MoreHorizontal size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nome da Equipe</th>
                  <th>Descrição</th>
                  <th>Criada em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                      Nenhuma equipe cadastrada.
                    </td>
                  </tr>
                ) : (
                  teams.map(team => (
                    <tr key={team.id}>
                      <td>
                        <div className="team-info-cell">
                          <div className="team-icon">
                            <Users size={18} />
                          </div>
                          <span className="team-name-bold">{team.name}</span>
                        </div>
                      </td>
                      <td>{team.description || '-'}</td>
                      <td>{new Date(team.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" title="Editar"><Edit3 size={16} /></button>
                          <button 
                            className="icon-btn delete" 
                            title="Excluir"
                            onClick={() => handleDeleteTeam(team.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUserModal && (
        <AddUserModal 
          onClose={() => setShowUserModal(false)} 
          onSuccess={refreshAll}
        />
      )}

      {showTeamModal && (
        <AddTeamModal 
          onClose={() => setShowTeamModal(false)} 
          onSuccess={refreshAll}
        />
      )}

      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={refreshAll}
        />
      )}

      {showWorkflowModal && (
        <WorkflowSettingsModal 
          onClose={() => setShowWorkflowModal(false)}
        />
      )}
    </div>
  );
};
