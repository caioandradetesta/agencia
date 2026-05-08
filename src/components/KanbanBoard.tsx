import React, { useState } from 'react';
import { MoreVertical, Plus, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { AddTaskModal } from './AddTaskModal';
import './KanbanBoard.css';

const COLUMN_MAP = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'doing', title: 'Em Andamento' },
  { id: 'review', title: 'Revisão' },
  { id: 'done', title: 'Concluído' }
];

export const KanbanBoard: React.FC = () => {
  const { tasks, loading, updateTaskStatus, refresh } = useTasks();
  const [showModal, setShowModal] = useState(false);

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta'
    };
    return map[priority] || priority;
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: any) => {
    const taskId = e.dataTransfer.getData('taskId');
    updateTaskStatus(taskId, status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h2>Quadro de Tarefas</h2>
        <button className="add-task-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nova Tarefa
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={32} />
          <p>Sincronizando tarefas...</p>
        </div>
      ) : (
        <div className="kanban-board">
          {COLUMN_MAP.map(column => (
            <div 
              key={column.id} 
              className="kanban-column"
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
            >
              <div className="column-header">
                <div className="column-title">
                  <span className={`status-dot ${column.id}`}></span>
                  <h3>{column.title}</h3>
                  <span className="task-count">
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </div>
                <button className="more-btn"><MoreVertical size={16} /></button>
              </div>

              <div className="task-list">
                {tasks.filter(t => t.status === column.id).map(task => (
                  <div 
                    key={task.id} 
                    className="task-card animate-fade-in"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  >
                    <div className="task-priority">
                      <span className={`priority-tag ${task.priority}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                    
                    <div className="task-footer">
                      <div className="task-meta">
                        <div className="meta-item">
                          <Clock size={14} />
                          <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'S/ Data'}</span>
                        </div>
                        <div className="meta-item">
                          <MessageSquare size={14} />
                          <span>0</span>
                        </div>
                      </div>
                      <div className="task-assignee">
                        {task.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {tasks.filter(t => t.status === column.id).length === 0 && (
                  <div className="empty-column-hint">Arrastar aqui</div>
                )}

                <button className="column-add-btn" onClick={() => setShowModal(true)}>
                  <Plus size={16} />
                  Adicionar item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddTaskModal 
          onClose={() => setShowModal(false)} 
          onSuccess={refresh}
        />
      )}
    </div>
  );
};
