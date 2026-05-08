import React, { useState } from 'react';
import { X, User, Mail, Building2, Phone, Image, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { uploadFile } from '../lib/storage';
import './Modal.css';

interface AddClientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logo_url = '';
      if (logoFile) {
        const fileName = `${Date.now()}-${logoFile.name}`;
        logo_url = await uploadFile('logos', fileName, logoFile);
      }

      const response = await api.post('/api/clients', {
        ...formData,
        logo_url
      });

      if (response.data) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      alert('Erro ao salvar cliente: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adicionar Novo Cliente</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label><Building2 size={16} /> Empresa</label>
            <input 
              type="text" 
              required 
              placeholder="Nome da empresa"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><User size={16} /> Contato Principal</label>
              <input 
                type="text" 
                required 
                placeholder="Nome do contato"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><Phone size={16} /> Telefone</label>
              <input 
                type="text" 
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label><Mail size={16} /> E-mail</label>
            <input 
              type="email" 
              required 
              placeholder="email@cliente.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label><Image size={16} /> Logotipo (Opcional)</label>
            <div className="file-input-wrapper">
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => setLogoFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
