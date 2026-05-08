import React, { useState } from 'react';
import { X, Loader2, Building2, User, Mail, Phone, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import './Modal.css';

interface AddClientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logo_url = '';
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        logo_url = await uploadFile('client-logos', fileName, logoFile);
      }

      const { error } = await supabase
        .from('clients')
        .insert([{ ...formData, logo_url }]);

      if (error) throw error;
      onSuccess();
      onClose();
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
          <h2>Novo Cliente</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="logo-upload-section">
            <div className="logo-preview">
              {logoPreview ? <img src={logoPreview} alt="Preview" /> : <ImageIcon size={32} />}
            </div>
            <label className="upload-label">
              <Upload size={16} />
              Carregar Logo
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div className="form-group">
            <label><Building2 size={16} /> Nome da Empresa</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Tech Nova LTDA"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label><User size={16} /> Contato Principal</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Ricardo Santos"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Mail size={16} /> E-mail</label>
              <input 
                type="email" 
                required 
                placeholder="email@empresa.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
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
