import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Loader2, Type, AlignLeft, Flag, Calendar, 
  Users as UsersIcon, Send, MessageSquare, Layout, RefreshCcw 
} from 'lucide-react';
import { api } from '../lib/api';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import './Modal.css';

interface TaskDetailModalProps {
  task: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const { users } = useUsers();
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
    assignee_ids: task.assignees?.map((a: any) => a.user_id) || [],
    workflow_tag: task.workflow_tag || '',
    recurrence: task.recurrence || ''
  });

  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
    fetchKanbanColumns();
  }, [task.id]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchKanbanColumns = async () => {
    try {
      const res = await api.get('/api/kanban-columns');
      setKanbanColumns(res.data);
    } catch (err) {
      console.error('Erro ao buscar colunas do Kanban:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/tasks/${task.id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Erro ao buscar comentários:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/api/tasks/${task.id}/comments`, {
        user_id: currentUser?.id,
        content: newComment
      });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      alert('Erro ao postar comentário');
    }
  };

  const toggleAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        ? prev.assignee_ids.filter((id: string) => id !== userId)
        : [...prev.assignee_ids, userId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.patch(`/api/tasks/${task.id}`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao atualizar tarefa');
    } finally {
      setLoading(false);
    }
  };

  const currentColumn = kanbanColumns.find(c => c.slug === formData.status);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-with-status">
            <span 
              className="status-tag-premium" 
              style={{ backgroundColor: currentColumn?.color || 'var(--bg-tertiary)' }}
            >
              {currentColumn?.title || formData.status}
            </span>
            <h2>Detalhes da Tarefa</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="detail-grid">
          {/* Lado Esquerdo: Edição */}
          <form onSubmit={handleSubmit} className="task-edit-side">
            <div className="form-group">
              <label><Type size={16} /> Título da Tarefa</label>
              <input 
                type="text" 
                required 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="premium-input"
              />
            </div>

            <div className="form-group">
              <label><Layout size={16} /> Estágio Atual</label>
              <div className="stage-pills-selector">
                {kanbanColumns.map((col: any) => (
                  <div 
                    key={col.id} 
                    className={`stage-pill-item ${formData.status === col.slug ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, status: col.slug })}
                    style={{ '--stage-color': col.color } as any}
                  >
                    <span className="s-dot" style={{ backgroundColor: col.color }}></span>
                    {col.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><Flag size={16} /> Prioridade</label>
                <select 
                  className="premium-select"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="form-group">
                <label><Calendar size={16} /> Prazo Final</label>
                <input 
                  type="date" 
                  className="premium-input"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label><AlignLeft size={16} /> Descrição Detalhada</label>
              <textarea 
                rows={4}
                className="premium-textarea"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que precisa ser feito..."
              />
            </div>

            <div className="form-group">
              <label><RefreshCcw size={16} /> Recorrência de Tarefa</label>
              <select 
                className="premium-select"
                value={formData.recurrence}
                onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
              >
                <option value="">Nenhuma</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
              </select>
            </div>

            <div className="form-group">
              <label><UsersIcon size={16} /> Responsáveis pela Execução</label>
              <div className="assignees-selector mini">
                {users.map(u => (
                  <div 
                    key={u.user_id} 
                    className={`assignee-item ${formData.assignee_ids.includes(u.user_id) ? 'selected' : ''}`}
                    onClick={() => toggleAssignee(u.user_id)}
                    title={u.full_name}
                  >
                    <div className="assignee-avatar" style={{ backgroundColor: u.color || 'var(--accent-primary)' }}>
                      {u.full_name?.charAt(0)}
                    </div>
                    <span className="assignee-name">{u.full_name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions-footer">
              <button type="submit" className="save-task-btn" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* Lado Direito: Comentários */}
          <div className="comments-side">
            <div className="comments-header">
              <MessageSquare size={16} />
              <h3>Comentários</h3>
            </div>

            <div className="comments-list">
              {commentsLoading ? (
                <div className="loading-comments"><Loader2 className="animate-spin" /></div>
              ) : comments.length === 0 ? (
                <div className="empty-comments">Nenhum comentário ainda.</div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className={`comment-item ${c.user_id === currentUser?.id ? 'own' : ''}`}>
                    <div className="comment-header">
                      <div className="comment-user">
                        <div className="c-avatar" style={{ backgroundColor: c.color || 'var(--accent-primary)' }}>
                          {c.full_name?.charAt(0)}
                        </div>
                        <span className="c-name">{c.full_name}</span>
                      </div>
                      <span className="c-date">{new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="comment-content">{c.content}</div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            <form onSubmit={handlePostComment} className="comment-input-area">
              <input 
                type="text" 
                placeholder="Escreva um comentário..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button type="submit" className="send-comment-btn" disabled={!newComment.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
