import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Layout, Plus, Trash2, Palette, Loader2, User as UserIcon } from 'lucide-react';
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
    responsible_user_id: ''
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
        responsible_user_id: newCol.responsible_user_id || null
      });
      setNewCol({ title: '', slug: '', color: '#6366F1', responsible_user_id: '' });
      fetchColumns();
      onSuccess();
    } catch (err) {
      alert('Erro ao adicionar coluna');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateColumnResponsible = async (colId: string, userId: string) => {
    try {
      await api.patch(`/api/kanban-columns/${colId}`, {
        responsible_user_id: userId || null
      });
      fetchColumns();
      onSuccess();
    } catch (err) {
      alert('Erro ao atualizar responsável');
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
            <h2>Configurar Colunas e Responsáveis</h2>
            <p>Defina as etapas do projeto e quem assume as tarefas em cada fase.</p>
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
              <div className="form-group flex-2">
                <label><UserIcon size={14} /> Responsável Automático</label>
                <select 
                  value={newCol.responsible_user_id}
                  onChange={e => setNewCol({ ...newCol, responsible_user_id: e.target.value })}
                >
                  <option value="">Ninguém (Manual)</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
                  ))}
                </select>
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
                  
                  <div className="stage-responsible-select">
                    <UserIcon size={12} />
                    <select 
                      value={col.responsible_user_id || ''}
                      onChange={(e) => handleUpdateColumnResponsible(col.id, e.target.value)}
                    >
                      <option value="">Sem responsável automático</option>
                      {users.map(u => (
                        <option key={u.user_id} value={u.user_id}>Atribuir a: {u.full_name}</option>
                      ))}
                    </select>
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
          <button className="submit-btn" onClick={onClose}>Salvar e Sair</button>
        </div>
      </div>
    </div>,
    document.body
  );
};
