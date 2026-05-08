import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Mail, Shield, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Modal.css';

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<{ id: string, name: string }[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    team_id: ''
  });

  useEffect(() => {
    // Fetch available teams
    const fetchTeams = async () => {
      const { data } = await supabase.from('teams').select('id, name');
      if (data) setTeams(data);
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For a real app, you would use Supabase Admin Auth to create users,
      // but since we are using Client SDK, we will just insert into the profiles table.
      // Note: In production, the user would need to sign up themselves or use an invite flow.
      
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: crypto.randomUUID(), // Mock ID if user doesn't exist in Auth yet
          ...formData
        }]);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Adicionar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
