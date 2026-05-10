import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, Mail, Shield, Users as UsersIcon, Palette, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useTeams } from '../hooks/useTeams';
import './Modal.css';

interface EditUserModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EF4444', // Red
  '#06B6D4', // Cyan
];

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { teams } = useTeams();
  const [formData, setFormData] = useState({
    email: user.email || '',
    password: '',
    full_name: user.full_name || '',
    role: user.role || 'user',
    team_id: user.team_id || '',
    color: user.color || '#6366F1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { password, ...otherData } = formData;
      const payload = password ? formData : otherData;

      await api.patch(`/api/profiles/${user.id}`, payload);
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

          <div className="form-group">
            <label><Mail size={16} /> E-mail</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label><Lock size={16} /> Nova Senha (deixe em branco para manter)</label>
            <input 
              type="password" 
              placeholder="Digite a nova senha"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              minLength={6}
            />
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

          <div className="form-group">
            <label><Palette size={16} /> Cor de Identificação</label>
            <div className="color-selector">
              {PRESET_COLORS.map(color => (
                <div 
                  key={color}
                  className={`color-option ${formData.color === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
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
