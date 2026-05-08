import React, { useState } from 'react';
import { MoreVertical, Plus, Clock, MessageSquare } from 'lucide-react';
import './KanbanBoard.css';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Baixa' | 'Média' | 'Alta';
  assignee: string;
  dueDate: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'A Fazer',
    tasks: [
      { id: '1', title: 'Design Landing Page', description: 'Criar protótipo no Figma', priority: 'Alta', assignee: 'JD', dueDate: '12 Mai' },
      { id: '2', title: 'Setup Supabase', description: 'Configurar banco e auth', priority: 'Média', assignee: 'AS', dueDate: '15 Mai' }
    ]
  },
  {
    id: 'doing',
    title: 'Em Andamento',
    tasks: [
      { id: '3', title: 'Integração API', description: 'Conectar frontend com backend', priority: 'Alta', assignee: 'JD', dueDate: '10 Mai' }
    ]
  },
  {
    id: 'review',
    title: 'Revisão',
    tasks: [
      { id: '4', title: 'Ajustes de CSS', description: 'Refinar responsividade', priority: 'Baixa', assignee: 'ML', dueDate: '08 Mai' }
    ]
  },
  {
    id: 'done',
    title: 'Concluído',
    tasks: [
      { id: '5', title: 'Configuração do Vite', description: 'Init project', priority: 'Baixa', assignee: 'JD', dueDate: '07 Mai' }
    ]
  }
];

export const KanbanBoard: React.FC = () => {
  const [columns] = useState<Column[]>(initialColumns);

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h2>Quadro de Tarefas</h2>
        <button className="add-task-btn">
          <Plus size={18} />
          Nova Tarefa
        </button>
      </div>

      <div className="kanban-board">
        {columns.map(column => (
          <div key={column.id} className="kanban-column">
            <div className="column-header">
              <div className="column-title">
                <span className={`status-dot ${column.id}`}></span>
                <h3>{column.title}</h3>
                <span className="task-count">{column.tasks.length}</span>
              </div>
              <button className="more-btn"><MoreVertical size={16} /></button>
            </div>

            <div className="task-list">
              {column.tasks.map(task => (
                <div key={task.id} className="task-card animate-fade-in">
                  <div className="task-priority">
                    <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  
                  <div className="task-footer">
                    <div className="task-meta">
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{task.dueDate}</span>
                      </div>
                      <div className="meta-item">
                        <MessageSquare size={14} />
                        <span>2</span>
                      </div>
                    </div>
                    <div className="task-assignee">
                      {task.assignee}
                    </div>
                  </div>
                </div>
              ))}
              <button className="column-add-btn">
                <Plus size={16} />
                Adicionar item
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
