import React, { useState, useEffect } from 'react';
import { X, Loader2, FileText, Building2, Briefcase, DollarSign, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import './Modal.css';

interface AddContractModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddContractModal: React.FC<AddContractModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string, company: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    project_id: '',
    value: '',
    status: 'draft'
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: cData } = await supabase.from('clients').select('id, company');
      const { data: pData } = await supabase.from('projects').select('id, name');
      if (cData) setClients(cData);
      if (pData) setProjects(pData);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let file_url = '';
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        file_url = await uploadFile('contracts', fileName, file);
      }

      const { error } = await supabase
        .from('contracts')
        .insert([{
          ...formData,
          value: parseFloat(formData.value) || 0,
          file_url
        }]);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar contrato: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Contrato</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label><FileText size={16} /> Título do Contrato</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Contrato de Prestação de Serviços"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Building2 size={16} /> Cliente</label>
              <select 
                required
                value={formData.client_id}
                onChange={e => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">Selecionar Cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label><Briefcase size={16} /> Projeto</label>
              <select 
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
              >
                <option value="">Selecionar Projeto (Opcional)...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><DollarSign size={16} /> Valor do Contrato (R$)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0,00"
                value={formData.value}
                onChange={e => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><Upload size={16} /> Arquivo (PDF)</label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
