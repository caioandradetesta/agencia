import React, { useState } from 'react';
import { 
  UserPlus, 
  MoreHorizontal, 
  Mail, 
  Shield, 
  Trash2, 
  Edit3,
  Search
} from 'lucide-react';
import './UsersPage.css';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  status: 'Ativo' | 'Inativo';
  avatar?: string;
}

const mockUsers: TeamMember[] = [
  { id: '1', name: 'João Silva', email: 'joao@agencia.com', role: 'Administrador', team: 'Design', status: 'Ativo' },
  { id: '2', name: 'Ana Souza', email: 'ana@agencia.com', role: 'Developer', team: 'Dev', status: 'Ativo' },
  { id: '3', name: 'Carlos Lima', email: 'carlos@agencia.com', role: 'Copywriter', team: 'Content', status: 'Inativo' },
  { id: '4', name: 'Marina Lopes', email: 'marina@agencia.com', role: 'Project Manager', team: 'Gestão', status: 'Ativo' },
];

export const UsersPage: React.FC = () => {
  const [users] = useState<TeamMember[]>(mockUsers);

  return (
    <div className="users-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>Gestão de Usuários</h1>
          <p>Gerencie sua equipe e permissões de acesso.</p>
        </div>
        <button className="add-user-btn">
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
          <span className="u-value">{users.filter(u => u.status === 'Ativo').length}</span>
        </div>
        <div className="u-stat">
          <span className="u-label">Equipes</span>
          <span className="u-value">4</span>
        </div>
      </div>

      <div className="users-container">
        <div className="table-controls">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Buscar por nome, email ou equipe..." />
          </div>
          <div className="filters">
            <select>
              <option>Todas as Equipes</option>
              <option>Design</option>
              <option>Dev</option>
            </select>
          </div>
        </div>

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
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="u-avatar">{user.name.charAt(0)}</div>
                      <div className="u-info">
                        <span className="u-name">{user.name}</span>
                        <span className="u-email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="team-tag">{user.team}</span>
                  </td>
                  <td>
                    <div className="role-cell">
                      <Shield size={14} />
                      {user.role}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
