import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, Mail, Building2, Phone, Upload } from 'lucide-react';
import { api, getFullUrl } from '../lib/api';
import type { Client } from '../hooks/useClients';
import './Modal.css';

interface AddClientModalProps {
  onClose: () => void;
  onSuccess: () => void;
  client?: Client;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSuccess, client }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    company: client?.company || '',
    phone: client?.phone || '',
    logo_url: client?.logo_url || ''
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      try {
        setUploadingLogo(true);
        const res = await api.post('/api/upload?type=logos', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setFormData(prev => ({ ...prev, logo_url: res.data.url }));
      } catch (err: any) {
        console.error(err);
        alert('Erro ao enviar logo: ' + (err.response?.data?.error || err.message));
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (client) {
        await api.patch(`/api/clients/${client.id}`, formData);
      } else {
        await api.post('/api/clients', formData);
      }
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
          <h2>{client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Logo Upload Section */}
          <div className="logo-upload-section">
            <div className="logo-preview">
              {formData.logo_url ? (
                <img src={getFullUrl(formData.logo_url)} alt="Logo Preview" />
              ) : (
                <Building2 size={32} />
              )}
            </div>
            <label className="upload-label">
              {uploadingLogo ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>{formData.logo_url ? 'Alterar Logo' : 'Enviar Logo'}</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </label>
          </div>

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

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading || uploadingLogo}>
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                client ? 'Salvar Alterações' : 'Cadastrar Cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
