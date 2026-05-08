import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, Plus, Trash2, User as UserIcon, Palette, Loader2, GripVertical } from 'lucide-react';
import { api } from '../lib/api';
import { useUsers } from '../hooks/useUsers';
import './Modal.css';

interface WorkflowSettingsModalProps {
  onClose: () => void;
}

interface WorkflowStage {
  tag_name: string;
  label: string;
  user_id: string;
  color: string;
  full_name?: string;
}

const PRESET_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4'];

export const WorkflowSettingsModal: React.FC<WorkflowSettingsModalProps> = ({ onClose }) => {
  const { users } = useUsers();
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newStage, setNewStage] = useState({
    tag_name: '',
    label: '',
    user_id: '',
    color: '#6366F1'
  });

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      const res = await api.get('/api/workflow-configs');
      setStages(res.data);
    } catch (err) {
      console.error('Erro ao buscar estágios:', err);
    }
  };

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStage.tag_name || !newStage.user_id) return;
    
    setLoading(true);
    try {
      await api.post('/api/workflow-configs', {
        ...newStage,
        label: newStage.label || newStage.tag_name,
        sort_order: stages.length
      });
      setNewStage({ tag_name: '', label: '', user_id: '', color: '#6366F1' });
      fetchStages();
    } catch (err) {
      alert('Erro ao adicionar estágio');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStage = async (tagName: string) => {
    if (!confirm('Excluir este estágio? As tarefas existentes com esta tag não serão alteradas.')) return;
    try {
      await api.delete(`/api/workflow-configs/${tagName}`);
      fetchStages();
    } catch (err) {
      alert('Erro ao excluir estágio');
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content workflow-modal animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-info-modal">
            <h2>Gestão de Estágios & Fluxo</h2>
            <p>Configure a passagem de bastão automática entre a equipe.</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body workflow-body">
          {/* Formulário de Novo Estágio */}
          <form className="add-stage-form" onSubmit={handleAddStage}>
            <div className="form-row">
              <div className="form-group flex-2">
                <label><Tag size={14} /> ID do Estágio (Tag)</label>
                <input 
                  type="text" 
                  placeholder="Ex: revisao-interna" 
                  value={newStage.tag_name}
                  onChange={e => setNewStage({ ...newStage, tag_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group flex-3">
                <label><Tag size={14} /> Nome Exibido</label>
                <input 
                  type="text" 
                  placeholder="Ex: Revisão Interna" 
                  value={newStage.label}
                  onChange={e => setNewStage({ ...newStage, label: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-3">
                <label><UserIcon size={14} /> Responsável Automático</label>
                <select 
                  value={newStage.user_id}
                  onChange={e => setNewStage({ ...newStage, user_id: e.target.value })}
                  required
                >
                  <option value="">Selecione quem assume...</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group flex-1">
                <label><Palette size={14} /> Cor</label>
                <div className="color-picker-mini">
                  {PRESET_COLORS.map(c => (
                    <div 
                      key={c}
                      className={`c-dot ${newStage.color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewStage({ ...newStage, color: c })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className="add-btn-workflow" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /> Adicionar Estágio</>}
            </button>
          </form>

          <div className="stages-divider">Estágios Configurados</div>

          {/* Lista de Estágios */}
          <div className="stages-list-scroll">
            {stages.length === 0 ? (
              <div className="empty-stages">Nenhum estágio configurado. Crie o primeiro acima!</div>
            ) : (
              stages.map(stage => (
                <div key={stage.tag_name} className="stage-card-manage" style={{ borderLeft: `4px solid ${stage.color}` }}>
                  <div className="stage-main-info">
                    <span className="stage-tag-badge" style={{ backgroundColor: stage.color }}>{stage.label}</span>
                    <div className="stage-owner">
                      <UserIcon size={14} />
                      <span>{stage.full_name}</span>
                    </div>
                  </div>
                  <button className="delete-stage-btn" onClick={() => handleDeleteStage(stage.tag_name)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="submit-btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>,
    document.body
  );
};
