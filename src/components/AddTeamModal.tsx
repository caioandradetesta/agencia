import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, AlignLeft, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import './Modal.css';

interface AddTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTeamModal: React.FC<AddTeamModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/teams', formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao criar equipe: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Criar Nova Equipe</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label><Users size={16} /> Nome da Equipe</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Time de Design, Social Media..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label><AlignLeft size={16} /> Descrição (Opcional)</label>
            <textarea 
              rows={3}
              placeholder="O que esta equipe faz?"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Criar Equipe'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
