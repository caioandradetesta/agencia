import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, Mail, Shield, Users as UsersIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useTeams } from '../hooks/useTeams';
import './Modal.css';

interface EditUserModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { teams } = useTeams();
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    role: user.role || 'user',
    team_id: user.team_id || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.patch(`/api/profiles/${user.id}`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao atualizar usuário: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Membro</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label><User size={16} /> Nome Completo</label>
            <input 
              type="text" 
              required 
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ opacity: 0.6 }}>
            <label><Mail size={16} /> E-mail (Não pode ser alterado)</label>
            <input type="email" value={user.email} disabled />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Shield size={16} /> Função</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">Membro</option>
                <option value="admin">Administrador</option>
                <option value="manager">Gerente de Projeto</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div className="form-group">
              <label><UsersIcon size={16} /> Equipe</label>
              <select 
                value={formData.team_id}
                onChange={e => setFormData({ ...formData, team_id: e.target.value })}
              >
                <option value="">Sem Equipe</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
