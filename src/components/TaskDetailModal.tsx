import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Loader2, Type, AlignLeft, Flag, Calendar, 
  Users as UsersIcon, Send, MessageSquare, Layout, RefreshCcw, Trash2, Briefcase,
  Paperclip, Link, FileText, Check, Edit2, History
} from 'lucide-react';
import { api } from '../lib/api';
import { useUsers } from '../hooks/useUsers';
import { useProjects } from '../hooks/useProjects';
import { handleImagePaste, insertAtCursor } from '../utils/imagePaste';
import { RichText } from './RichText';
import { useAuth } from '../context/AuthContext';
import './Modal.css';
const translateField = (field: string) => {
  const map: Record<string, string> = {
    title: 'Título',
    description: 'Descrição',
    status: 'Estágio',
    priority: 'Prioridade',
    due_date: 'Prazo',
    recurrence: 'Recorrência',
    assignees: 'Responsáveis'
  };
  return map[field] || field;
};

const formatValue = (field: string, value: any, usersList: any[], columnsList: any[]) => {
  if (value === null || value === undefined || value === '') return 'vazio';
  
  if (field === 'status') {
    const col = columnsList.find(c => c.slug === value);
    return col ? col.title : value;
  }
  if (field === 'priority') {
    const map: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta' };
    return map[value] || value;
  }
  if (field === 'due_date') {
    return new Date(value).toLocaleDateString('pt-BR');
  }
  if (field === 'assignees') {
    if (!Array.isArray(value)) return 'nenhum';
    return value.map(userId => {
      const u = usersList.find(usr => usr.user_id === userId);
      return u ? u.full_name : userId;
    }).join(', ') || 'nenhum';
  }
  return String(value);
};

interface TaskDetailModalProps {
  task: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const { users } = useUsers();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    title: task.title || '',
    description: task.description || '',
    project_id: task.project_id || '',
    project_folder_id: task.project_folder_id || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
    assignee_ids: task.assignees?.map((a: any) => a.user_id) || [],
    workflow_tag: task.workflow_tag || '',
    recurrence: task.recurrence || ''
  });

  const [folders, setFolders] = useState<any[]>([]);

  useEffect(() => {
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

  const prevProjectIdRef = useRef(formData.project_id);
  useEffect(() => {
    if (prevProjectIdRef.current !== formData.project_id) {
      setFormData(prev => ({ ...prev, project_folder_id: '' }));
      prevProjectIdRef.current = formData.project_id;
    }
  }, [formData.project_id]);

  // Estado para Menções
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  // Estados para Anexos
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentForm, setAttachmentForm] = useState({
    name: '',
    type: 'file', // 'file' | 'link'
    url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [editingAttachmentId, setEditingAttachmentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    url: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get(`/api/tasks/${task.id}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchKanbanColumns();
    fetchAttachments();
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [task.id, activeTab]);

  const fetchAttachments = async () => {
    try {
      setAttachmentsLoading(true);
      const res = await api.get(`/api/tasks/${task.id}/attachments`);
      setAttachments(res.data);
    } catch (err) {
      console.error('Erro ao buscar anexos:', err);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentForm.name.trim()) {
      alert('Por favor, informe o nome do anexo.');
      return;
    }

    try {
      setUploadingAttachment(true);
      let finalUrl = attachmentForm.url;

      if (attachmentForm.type === 'file') {
        if (!selectedFile) {
          alert('Por favor, selecione um arquivo.');
          setUploadingAttachment(false);
          return;
        }
        const { uploadFile } = await import('../lib/storage');
        finalUrl = await uploadFile('attachments', selectedFile);
      } else {
        if (!finalUrl.trim()) {
          alert('Por favor, informe a URL/link do anexo.');
          setUploadingAttachment(false);
          return;
        }
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = 'http://' + finalUrl;
        }
      }

      const res = await api.post(`/api/tasks/${task.id}/attachments`, {
        name: attachmentForm.name,
        type: attachmentForm.type,
        url: finalUrl
      });

      setAttachments(prev => [...prev, res.data]);
      setAttachmentForm({ name: '', type: 'file', url: '' });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      alert('Erro ao adicionar anexo: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este anexo?')) return;

    try {
      await api.delete(`/api/attachments/${attachmentId}`);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    } catch (err) {
      alert('Erro ao excluir anexo');
    }
  };

  const handleStartEdit = (att: any) => {
    setEditingAttachmentId(att.id);
    setEditForm({
      name: att.name,
      url: att.url
    });
  };

  const handleCancelEdit = () => {
    setEditingAttachmentId(null);
    setEditForm({ name: '', url: '' });
  };

  const handleSaveEdit = async (attachmentId: string, type: string) => {
    if (!editForm.name.trim()) {
      alert('O nome do anexo não pode ser vazio.');
      return;
    }
    if (type === 'link' && !editForm.url.trim()) {
      alert('O link do anexo não pode ser vazio.');
      return;
    }

    try {
      let finalUrl = editForm.url;
      if (type === 'link' && !/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'http://' + finalUrl;
      }
      const res = await api.patch(`/api/attachments/${attachmentId}`, {
        name: editForm.name,
        url: type === 'link' ? finalUrl : undefined
      });

      setAttachments(prev => prev.map(att => att.id === attachmentId ? res.data : att));
      setEditingAttachmentId(null);
    } catch (err) {
      alert('Erro ao atualizar anexo');
    }
  };

  const getAttachmentUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';
    return `${API_URL}${url}`;
  };

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

  const handleDescriptionPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    await handleImagePaste(e, 'tasks', (url) => {
      const fullUrl = `${window.location.origin}${url}`;
      const newValue = insertAtCursor(e.currentTarget, `\n![imagem](${fullUrl})\n`);
      setFormData({ ...formData, description: newValue });
    });
  };

  const handleCommentPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    await handleImagePaste(e, 'comments', (url) => {
      const fullUrl = `${window.location.origin}${url}`;
      const newValue = insertAtCursor(e.currentTarget, ` ${fullUrl} `);
      setNewComment(newValue);
    });
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    setNewComment(value);

    // Detectar @ para menções
    const lastAtPos = value.lastIndexOf('@', cursorPosition - 1);
    
    if (lastAtPos !== -1) {
      const textAfterAt = value.substring(lastAtPos + 1, cursorPosition);
      // Se não houver espaço entre o @ e o cursor, estamos buscando menção
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setMentionStartIndex(lastAtPos);
        setShowMentionList(true);
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }
  };

  const selectMention = (user: any) => {
    const beforeAt = newComment.substring(0, mentionStartIndex);
    const afterMention = newComment.substring(mentionStartIndex + mentionSearch.length + 1);
    const updatedComment = `${beforeAt}@${user.full_name} ${afterMention}`;
    
    setNewComment(updatedComment);
    setShowMentionList(false);
    setMentionSearch('');
  };

  const filteredMentionUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

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

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.')) return;
    
    setLoading(true);
    try {
      await api.delete(`/api/tasks/${task.id}`);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Erro ao excluir tarefa');
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h2 style={{ margin: 0, lineHeight: 1.2 }}>Detalhes da Tarefa</h2>
              {task.creator_name ? (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Criado por <strong>{task.creator_name}</strong> em {new Date(task.created_at).toLocaleDateString('pt-BR')} às {new Date(task.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : task.created_at ? (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Criado em {new Date(task.created_at).toLocaleDateString('pt-BR')} às {new Date(task.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : null}
            </div>
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
              <label><Briefcase size={16} /> Projeto Relacionado</label>
              <select 
                className="premium-select"
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
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
                onPaste={handleDescriptionPaste}
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

            {/* Linha Divisória */}
            <hr className="premium-divider" />

            {/* Seção de Anexos */}
            <div className="attachments-section">
              <div className="attachments-section-title">
                <Paperclip size={16} />
                <h3>Anexos</h3>
              </div>

              {/* Tabela de Anexos */}
              <div className="attachments-table-container">
                {attachmentsLoading ? (
                  <div className="attachments-loading">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Carregando anexos...</span>
                  </div>
                ) : attachments.length === 0 ? (
                  <div className="attachments-empty">
                    Nenhum anexo adicionado a esta tarefa.
                  </div>
                ) : (
                  <table className="attachments-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attachments.map(att => {
                        const isEditing = editingAttachmentId === att.id;
                        return (
                          <tr key={att.id}>
                            <td>
                              {isEditing ? (
                                <div className="table-edit-inputs">
                                  <input
                                    type="text"
                                    className="premium-input table-edit-input"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveEdit(att.id, att.type);
                                      }
                                    }}
                                    placeholder="Nome do Anexo"
                                  />
                                  {att.type === 'link' && (
                                    <input
                                      type="text"
                                      className="premium-input table-edit-input link-edit-input"
                                      value={editForm.url}
                                      onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleSaveEdit(att.id, att.type);
                                        }
                                      }}
                                      placeholder="https://link.com"
                                    />
                                  )}
                                </div>
                              ) : (
                                <a 
                                  href={getAttachmentUrl(att.url)}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="attachment-link"
                                >
                                  {att.name}
                                </a>
                              )}
                            </td>
                            <td>
                              <span className={`attachment-badge ${att.type}`}>
                                {att.type === 'file' ? (
                                  <>
                                    <FileText size={12} />
                                    <span>Arquivo</span>
                                  </>
                                ) : (
                                  <>
                                    <Link size={12} />
                                    <span>Link</span>
                                  </>
                                )}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="attachment-row-actions">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      className="action-btn save-btn"
                                      onClick={() => handleSaveEdit(att.id, att.type)}
                                      title="Salvar"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="action-btn cancel-btn-icon"
                                      onClick={handleCancelEdit}
                                      title="Cancelar"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="action-btn edit-btn"
                                      onClick={() => handleStartEdit(att)}
                                      title="Editar"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="action-btn delete-btn"
                                      onClick={() => handleDeleteAttachment(att.id)}
                                      title="Excluir"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Box para Adicionar Novo Anexo */}
              <div className="add-attachment-container">
                <h4>Novo Anexo</h4>
                <div className="add-attachment-fields">
                  <div className="form-group">
                    <label>Nome do Anexo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Contrato assinado, Briefing..."
                      className="premium-input"
                      value={attachmentForm.name}
                      onChange={e => setAttachmentForm({ ...attachmentForm, name: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAttachment(e);
                        }
                      }}
                    />
                  </div>

                  <div className="form-row mini-row">
                    <div className="form-group">
                      <label>Tipo de Anexo</label>
                      <select 
                        className="premium-select"
                        value={attachmentForm.type}
                        onChange={e => setAttachmentForm({ ...attachmentForm, type: e.target.value })}
                      >
                        <option value="file">Arquivo (Upload)</option>
                        <option value="link">Link (Web URL)</option>
                      </select>
                    </div>

                    {attachmentForm.type === 'file' ? (
                      <div className="form-group">
                        <label>Arquivo</label>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="premium-input file-upload-input"
                          onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>URL / Link</label>
                        <input 
                          type="text" 
                          placeholder="https://exemplo.com"
                          className="premium-input"
                          value={attachmentForm.url}
                          onChange={e => setAttachmentForm({ ...attachmentForm, url: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddAttachment(e);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    type="button" 
                    className="add-attachment-submit-btn"
                    onClick={handleAddAttachment}
                    disabled={uploadingAttachment}
                  >
                    {uploadingAttachment ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      'Adicionar Anexo'
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions-footer">
              <button 
                type="button" 
                className="delete-task-btn" 
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 size={18} />
                Excluir
              </button>
              <button type="submit" className="save-task-btn" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Alterações'}
              </button>
            </div>
          </form>

          {/* Lado Direito: Comentários / Histórico */}
          <div className="comments-side">
            <div className="side-tabs">
              <button 
                type="button"
                className={`side-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                onClick={() => setActiveTab('comments')}
              >
                <MessageSquare size={16} />
                Comentários
              </button>
              <button 
                type="button"
                className={`side-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={16} />
                Histórico
              </button>
            </div>

            {activeTab === 'comments' ? (
              <>
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
                        <div className="comment-content">
                          <RichText content={c.content} />
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={commentsEndRef} />
                </div>

                <form onSubmit={handlePostComment} className="comment-input-area">
                  {showMentionList && filteredMentionUsers.length > 0 && (
                    <div className="mention-list-dropdown">
                      {filteredMentionUsers.map(u => (
                        <div 
                          key={u.user_id} 
                          className="mention-item"
                          onClick={() => selectMention(u)}
                        >
                          <div className="m-avatar" style={{ backgroundColor: u.color || 'var(--accent-primary)' }}>
                            {u.full_name?.charAt(0)}
                          </div>
                          <span>{u.full_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="Escreva um comentário (use @ para marcar)..."
                    value={newComment}
                    onChange={handleCommentChange}
                    onPaste={handleCommentPaste}
                  />
                  <button type="submit" className="send-comment-btn" disabled={!newComment.trim()}>
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="history-list">
                {historyLoading ? (
                  <div className="loading-comments"><Loader2 className="animate-spin" /></div>
                ) : history.length === 0 ? (
                  <div className="empty-comments">Nenhuma alteração registrada ainda.</div>
                ) : (
                  history.map(h => (
                    <div key={h.id} className="history-item">
                      <div className="history-header">
                        <div className="history-user">
                          <div className="h-avatar" style={{ backgroundColor: h.user_color || 'var(--accent-primary)' }}>
                            {h.user_name ? h.user_name.charAt(0) : '?'}
                          </div>
                          <span className="h-name">{h.user_name || 'Sistema'}</span>
                        </div>
                        <span className="h-date">
                          {new Date(h.created_at).toLocaleDateString('pt-BR')} {new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="history-body">
                        {h.action === 'create' ? (
                          <span>Tarefa criada com o título <strong>"{h.details?.title}"</strong>.</span>
                        ) : h.action === 'update' && h.details ? (
                          <div className="history-changes">
                            {Object.keys(h.details).map(field => {
                              const change = h.details[field];
                              return (
                                <div key={field} className="history-change-item">
                                  <strong>{translateField(field)}</strong> alterado de{' '}
                                  <span className="old-val">"{formatValue(field, change.old, users, kanbanColumns)}"</span>{' '}
                                  para{' '}
                                  <span className="new-val">"{formatValue(field, change.new, users, kanbanColumns)}"</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span>Alteração realizada.</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
