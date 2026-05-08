import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Layout, Plus, Trash2, Palette, Loader2, User as UserIcon, Check } from 'lucide-react';
import { api } from '../lib/api';
import { useUsers } from '../hooks/useUsers';
import './Modal.css';

interface BoardSettingsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Column {
  id: string;
  title: string;
  slug: string;
  color: string;
  responsible_user_id: string | null;
  responsible_user_ids: string[];
  responsible_name?: string;
  responsible_color?: string;
}

const PRESET_COLORS = ['#94a3b8', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444'];

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({ onClose, onSuccess }) => {
  const { users } = useUsers();
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCol, setNewCol] = useState({
    title: '',
    slug: '',
    color: '#6366F1',
    responsible_user_ids: [] as string[]
  });

  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    try {
      const res = await api.get('/api/kanban-columns');
      setColumns(res.data);
    } catch (err) {
      console.error('Erro ao buscar colunas:', err);
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCol.title || !newCol.slug) return;

    setLoading(true);
    try {
      await api.post('/api/kanban-columns', {
        ...newCol,
        sort_order: columns.length,
        responsible_user_ids: newCol.responsible_user_ids
      });
      setNewCol({ title: '', slug: '', color: '#6366F1', responsible_user_ids: [] });
      fetchColumns();
      onSuccess();
    } catch (err) {
      alert('Erro ao adicionar coluna');
    } finally {
      setLoading(false);
    }
  };

  const toggleResponsibleForNew = (userId: string) => {
    setNewCol(prev => ({
      ...prev,
      responsible_user_ids: prev.responsible_user_ids.includes(userId)
        ? prev.responsible_user_ids.filter(id => id !== userId)
        : [...prev.responsible_user_ids, userId]
    }));
  };

  const handleUpdateColumnResponsibles = async (colId: string, userIds: string[]) => {
    try {
      await api.patch(`/api/kanban-columns/${colId}`, {
        responsible_user_ids: userIds
      });
      fetchColumns();
      onSuccess();
    } catch (err) {
      alert('Erro ao atualizar responsáveis');
    }
  };

  const toggleResponsibleForExisting = async (col: Column, userId: string) => {
    const currentIds = col.responsible_user_ids || [];
    const newIds = currentIds.includes(userId)
      ? currentIds.filter(id => id !== userId)
      : [...currentIds, userId];

    // ATUALIZAÇÃO OTIMISTA (INSTANTÂNEA NA TELA)
    setColumns(prev => prev.map(c => c.id === col.id ? { ...c, responsible_user_ids: newIds } : c));

    try {
      await api.patch(`/api/kanban-columns/${col.id}`, {
        responsible_user_ids: newIds
      });
      onSuccess();
    } catch (err) {
      console.error('Erro ao salvar responsáveis:', err);
      fetchColumns(); // Reverte em caso de erro
    }
  };

  const handleDeleteColumn = async (id: string, title: string) => {
    if (!confirm(`Excluir a coluna "${title}"? Tarefas nesta coluna não serão excluídas, mas podem ficar ocultas.`)) return;
    try {
      await api.delete(`/api/kanban-columns/${id}`);
      fetchColumns();
      onSuccess();
    } catch (err) {
      alert('Erro ao excluir coluna');
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content workflow-modal animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-info-modal">
            <h2>Configurar Fluxo e Responsáveis</h2>
            <p>Defina as etapas e múltiplos usuários para automação de tarefas.</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body workflow-body">
          {/* Formulário de Nova Coluna */}
          <form className="add-stage-form" onSubmit={handleAddColumn}>
            <div className="form-row">
              <div className="form-group flex-3">
                <label><Layout size={14} /> Nome da Coluna</label>
                <input 
                  type="text" 
                  placeholder="Ex: Em Aprovação" 
                  value={newCol.title}
                  onChange={e => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                    setNewCol({ ...newCol, title, slug });
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label><UserIcon size={14} /> Atribuir Responsáveis Automáticos (Múltiplos)</label>
              <div className="user-selection-grid">
                {users.map(u => (
                  <div 
                    key={u.user_id} 
                    className={`user-pill-choice ${newCol.responsible_user_ids.includes(u.user_id) ? 'active' : ''}`}
                    onClick={() => toggleResponsibleForNew(u.user_id)}
                  >
                    <div className="u-avatar-mini" style={{ backgroundColor: u.color }}>{u.full_name.charAt(0)}</div>
                    <span>{u.full_name}</span>
                    {newCol.responsible_user_ids.includes(u.user_id) && <Check size={12} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label><Palette size={14} /> Cor do Topo</label>
              <div className="color-picker-mini">
                {PRESET_COLORS.map(c => (
                  <div 
                    key={c}
                    className={`c-dot ${newCol.color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewCol({ ...newCol, color: c })}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="add-btn-workflow" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /> Adicionar Coluna</>}
            </button>
          </form>

          <div className="stages-divider">Colunas Ativas e Automações</div>

          <div className="stages-list-scroll">
            {columns.map(col => (
              <div key={col.id} className="stage-card-manage" style={{ borderLeft: `4px solid ${col.color}` }}>
                <div className="stage-main-info">
                  <div className="stage-title-row">
                    <span className="stage-tag-badge" style={{ backgroundColor: col.color }}>{col.title}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/{col.slug}</span>
                  </div>
                  
                  <div className="stage-responsibles-config">
                    <label>Responsáveis Automáticos:</label>
                    <div className="responsibles-toggles-list">
                      {users.map(u => (
                        <div 
                          key={u.user_id}
                          className={`res-pill-toggle ${col.responsible_user_ids?.includes(u.user_id) ? 'active' : ''}`}
                          onClick={() => toggleResponsibleForExisting(col, u.user_id)}
                        >
                          <div className="u-avatar-dot" style={{ backgroundColor: u.color }}></div>
                          <span>{u.full_name}</span>
                          {col.responsible_user_ids?.includes(u.user_id) && <Check size={12} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="delete-stage-btn" onClick={() => handleDeleteColumn(col.id, col.title)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="submit-btn" onClick={onClose}>Concluir Configuração</button>
        </div>
      </div>
    </div>,
    document.body
  );
};
