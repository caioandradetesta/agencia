import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, Mail, Building2, Phone, Link } from 'lucide-react';
import { api } from '../lib/api';
import './Modal.css';

interface AddClientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    logo_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/clients', formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar cliente: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Cliente</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label><Building2 size={16} /> Nome da Empresa / Marca</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Coca-Cola Brasil"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><User size={16} /> Pessoa de Contato</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: João Silva"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><Phone size={16} /> Telefone</label>
              <input 
                type="text" 
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label><Mail size={16} /> E-mail</label>
            <input 
              type="email" 
              placeholder="contato@empresa.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label><Link size={16} /> URL do Logo</label>
            <input 
              type="url" 
              placeholder="https://exemplo.com/logo.png"
              value={formData.logo_url}
              onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
