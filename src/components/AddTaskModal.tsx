import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { createPortal } from 'react-dom';
import { X, Loader2, Type, AlignLeft, Flag, Calendar, Users as UsersIcon, Check, RefreshCcw, Briefcase } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useProjects } from '../hooks/useProjects';
import { handleImagePaste, insertAtCursor } from '../utils/imagePaste';
import './Modal.css';

interface AddTaskModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onSuccess }) => {
  const { addTask } = useTasks();
  const { users } = useUsers();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    project_folder_id: '',
    status: 'todo' as const,
    priority: 'medium' as const,
    due_date: '',
    assignee_ids: [] as string[],
    recurrence: ''
  });

  const [folders, setFolders] = useState<any[]>([]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, project_folder_id: '' }));
    if (formData.project_id) {
      api.get(`/api/projects/${formData.project_id}/folders`)
        .then(res => {
          setFolders(res.data);
        })
        .catch(err => {
          console.error('Erro ao buscar pastas do projeto:', err);
          setFolders([]);
        });
    } else {
      setFolders([]);
    }
  }, [formData.project_id]);

  const toggleAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        ? prev.assignee_ids.filter(id => id !== userId)
        : [...prev.assignee_ids, userId]
    }));
  };

  const handleDescriptionPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    await handleImagePaste(e, 'tasks', (url) => {
      const fullUrl = `${window.location.origin}${url}`;
      const newValue = insertAtCursor(e.currentTarget, `\n![imagem](${fullUrl})\n`);
      setFormData({ ...formData, description: newValue });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addTask(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      // Erro tratado no hook
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova Tarefa</h2>
          <div className="header-actions">
            <button 
              type="submit" 
              form="add-task-form" 
              className="premium-btn-header save" 
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : (
                <>
                  <Check size={16} />
                  <span>Criar</span>
                </>
              )}
            </button>
            <button className="close-btn" type="button" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <form id="add-task-form" onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label><Type size={16} /> Título da Tarefa</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Finalizar protótipo do App"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label><Briefcase size={16} /> Projeto Relacionado</label>
            <select 
              value={formData.project_id}
              onChange={e => setFormData({ ...formData, project_id: e.target.value })}
              className="premium-select"
            >
              <option value="">Nenhum Projeto</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {formData.project_id && folders.length > 0 && (
            <div className="form-group">
              <label><Briefcase size={16} /> Pasta do Projeto</label>
              <select
                value={formData.project_folder_id}
                onChange={e => setFormData({ ...formData, project_folder_id: e.target.value })}
                className="premium-select"
              >
                <option value="">Nenhuma Pasta</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label><AlignLeft size={16} /> Descrição</label>
            <textarea 
              rows={3}
              placeholder="Detalhes sobre o que precisa ser feito..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              onPaste={handleDescriptionPaste}
            />
          </div>

          <div className="form-group">
            <label><UsersIcon size={16} /> Atribuir Membros</label>
            <div className="assignees-selector">
              {users.map(user => (
                <div 
                  key={user.user_id} 
                  className={`assignee-item ${formData.assignee_ids.includes(user.user_id) ? 'selected' : ''}`}
                  onClick={() => toggleAssignee(user.user_id)}
                >
                  <div className="assignee-avatar">
                    {user.full_name?.charAt(0)}
                  </div>
                  <span className="assignee-name">{user.full_name}</span>
                  {formData.assignee_ids.includes(user.user_id) && <Check size={14} className="check-icon" />}
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><Flag size={16} /> Prioridade</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="form-group">
              <label><Calendar size={16} /> Prazo</label>
              <input 
                type="date" 
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><RefreshCcw size={16} /> Recorrência</label>
              <select 
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
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
