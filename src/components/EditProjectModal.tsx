import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, AlignLeft, Briefcase } from 'lucide-react';
import { api } from '../lib/api';
import { useClients } from '../hooks/useClients';
import './Modal.css';

interface EditProjectModalProps {
  project: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { clients } = useClients();
  const [formData, setFormData] = useState({
    name: project.name || '',
    client_id: project.client_id || '',
    status: project.status || 'active',
    description: project.description || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.patch(`/api/projects/${project.id}`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao atualizar projeto: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Projeto</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label><Briefcase size={16} /> Nome do Projeto</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Redesign E-commerce 2024"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label><User size={16} /> Cliente</label>
            <select 
              required
              value={formData.client_id}
              onChange={e => setFormData({ ...formData, client_id: e.target.value })}
              className="premium-select"
            >
              <option value="">Selecionar Cliente...</option>
              {clients && clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.company || client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label><AlignLeft size={16} /> Descrição Breve</label>
            <textarea 
              rows={3}
              placeholder="Descreva o objetivo do projeto..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
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
