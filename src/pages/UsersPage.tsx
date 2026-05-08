import React, { useState } from 'react';
import { 
  UserPlus, 
  MoreHorizontal, 
  Mail, 
  Shield, 
  Trash2, 
  Edit3,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { AddUserModal } from '../components/AddUserModal';
import './UsersPage.css';

export const UsersPage: React.FC = () => {
  const { users, loading, error, refresh } = useUsers();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="users-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>Gestão de Usuários</h1>
          <p>Gerencie sua equipe e permissões de acesso.</p>
        </div>
        <button className="add-user-btn" onClick={() => setShowModal(true)}>
          <UserPlus size={18} />
          Convidar Membro
        </button>
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
          <span className="u-value">--</span>
        </div>
      </div>

      <div className="users-container">
        <div className="table-controls">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Buscar por nome, email ou equipe..." />
          </div>
          <button className="secondary-btn" onClick={refresh}>Atualizar</button>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Carregando membros da equipe...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={32} />
            <p>Erro ao carregar dados: {error}</p>
            <button onClick={refresh}>Tentar novamente</button>
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
                        <span className="team-tag">{user.teams?.name || 'Sem Equipe'}</span>
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
                          <button className="icon-btn"><Edit3 size={16} /></button>
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
        )}
      </div>

      {showModal && (
        <AddUserModal 
          onClose={() => setShowModal(false)} 
          onSuccess={refresh}
        />
      )}
    </div>
  );
};
