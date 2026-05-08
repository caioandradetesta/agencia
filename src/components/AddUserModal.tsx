import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, Mail, Shield, Users as UsersIcon, Palette } from 'lucide-react';
import { api } from '../lib/api';
import { useTeams } from '../hooks/useTeams';
import './Modal.css';

interface AddUserModalProps {
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

export const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { teams } = useTeams();
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    team_id: '',
    color: '#6366F1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/auth/register', formData);
      if (response.data) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      alert('Erro ao salvar usuário: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Membro da Equipe</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label><User size={16} /> Nome Completo</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Ana Oliveira"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label><Mail size={16} /> E-mail</label>
            <input 
              type="email" 
              required 
              placeholder="ana@agencia.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
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
              </select>
            </div>
            <div className="form-group">
              <label><UsersIcon size={16} /> Equipe</label>
              <select 
                value={formData.team_id}
                onChange={e => setFormData({ ...formData, team_id: e.target.value })}
                required
              >
                <option value="">Selecionar Equipe...</option>
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
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Adicionar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
