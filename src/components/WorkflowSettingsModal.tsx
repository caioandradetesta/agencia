import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { useUsers } from '../hooks/useUsers';
import './Modal.css';

interface WorkflowSettingsModalProps {
  onClose: () => void;
}

const STAGES = ['Revisão', 'Alteração', 'Aprovação', 'Finalização'];

export const WorkflowSettingsModal: React.FC<WorkflowSettingsModalProps> = ({ onClose }) => {
  const { users } = useUsers();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/api/workflow-configs');
      const map: Record<string, string> = {};
      res.data.forEach((c: any) => {
        map[c.tag_name] = c.user_id;
      });
      setConfigs(map);
    } catch (err) {
      console.error('Erro ao buscar configs:', err);
    }
  };

  const handleSave = async (tagName: string, userId: string) => {
    setLoading(true);
    try {
      await api.post('/api/workflow-configs', { tag_name: tagName, user_id: userId });
      setConfigs({ ...configs, [tagName]: userId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-info-modal">
            <h2>Automação de Workflow</h2>
            <p>Defina quem é adicionado automaticamente em cada estágio.</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-form">
          <div className="workflow-setup-list">
            {STAGES.map(stage => (
              <div key={stage} className="workflow-config-item">
                <div className="stage-label">
                  <Tag size={16} />
                  <span>{stage}</span>
                </div>
                <div className="assign-action">
                  <select 
                    value={configs[stage] || ''}
                    onChange={(e) => handleSave(stage, e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Ninguém</option>
                    {users.map(u => (
                      <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
                    ))}
                  </select>
                  {configs[stage] && <CheckCircle2 size={16} className="success-icon" />}
                </div>
              </div>
            ))}
          </div>

          {saved && (
            <div className="save-toast animate-fade-in">
              Configurações salvas com sucesso!
            </div>
          )}

          <div className="modal-actions">
            <button className="submit-btn" onClick={onClose}>Concluir</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
