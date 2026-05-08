import React, { useState, useEffect } from 'react';
import { MoreVertical, Plus, Clock, MessageSquare, Loader2, Settings } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { AddTaskModal } from './AddTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { BoardSettingsModal } from './BoardSettingsModal';
import { api } from '../lib/api';
import './KanbanBoard.css';

export const KanbanBoard: React.FC = () => {
  const { tasks, loading, updateTaskStatus, refresh } = useTasks();
  const [columns, setColumns] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

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

  const getPriorityLabel = (priority?: string) => {
    const map: Record<string, string> = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta'
    };
    return map[priority || 'medium'] || priority || 'Média';
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    const taskId = e.dataTransfer.getData('taskId');
    updateTaskStatus(taskId, status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div className="header-info-kanban">
          <h2>Quadro de Tarefas</h2>
          <p>Gerencie o fluxo de trabalho da sua equipe.</p>
        </div>
        <div className="header-actions">
          <button className="settings-btn-kanban" onClick={() => setShowSettingsModal(true)}>
            <Settings size={18} />
            Gerenciar Quadro
          </button>
          <button className="add-task-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Nova Tarefa
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={32} />
          <p>Sincronizando tarefas...</p>
        </div>
      ) : (
        <div className="kanban-board">
          {columns.map(column => (
            <div 
              key={column.id} 
              className="kanban-column"
              onDrop={(e) => handleDrop(e, column.slug)}
              onDragOver={handleDragOver}
            >
              <div className="column-header" style={{ borderTop: `4px solid ${column.color}` }}>
                <div className="column-title">
                  <span className="status-dot" style={{ backgroundColor: column.color }}></span>
                  <h3>{column.title}</h3>
                  <span className="task-count">
                    {tasks.filter(t => t.status === column.slug).length}
                  </span>
                </div>
                <div className="column-header-right">
                  {column.responsible_user_id && (
                    <div className="col-owner" title={`Responsável: ${column.responsible_name}`}>
                      <div 
                        className="col-owner-avatar" 
                        style={{ backgroundColor: column.responsible_color || 'var(--accent-primary)' }}
                      >
                        {column.responsible_name?.charAt(0)}
                      </div>
                    </div>
                  )}
                  <button className="more-btn"><MoreVertical size={16} /></button>
                </div>
              </div>

              <div className="task-list">
                {tasks.filter(t => t.status === column.slug).map(task => (
                  <div 
                    key={task.id} 
                    className="task-card animate-fade-in"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setSelectedTask(task)}
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
                      <div className="task-assignees">
                        {task.assignees?.map((a: any) => (
                          <div 
                            key={a.user_id} 
                            className="assignee-avatar" 
                            style={{ backgroundColor: a.color || 'var(--accent-primary)' }}
                            title={a.full_name}
                          >
                            {a.full_name?.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {tasks.filter(t => t.status === column.slug).length === 0 && (
                  <div className="empty-column-hint">Arrastar aqui</div>
                )}

                <button className="column-add-btn" onClick={() => setShowAddModal(true)}>
                  <Plus size={16} />
                  Adicionar item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTaskModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={refresh}
        />
      )}

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={refresh}
        />
      )}

      {showSettingsModal && (
        <BoardSettingsModal 
          onClose={() => setShowSettingsModal(false)}
          onSuccess={() => {
            fetchColumns();
            refresh();
          }}
        />
      )}
    </div>
  );
};
