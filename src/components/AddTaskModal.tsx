import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Type, AlignLeft, Flag, Calendar } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import './Modal.css';

interface AddTaskModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onSuccess }) => {
  const { addTask } = useTasks();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as const,
    priority: 'medium' as const,
    due_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addTask(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova Tarefa</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
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
            <label><AlignLeft size={16} /> Descrição</label>
            <textarea 
              rows={3}
              placeholder="Detalhes sobre o que precisa ser feito..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
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
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
