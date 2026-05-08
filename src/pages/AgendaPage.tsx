import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, User as UserIcon, Flag, Tag, X } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { TaskDetailModal } from '../components/TaskDetailModal';
import './AgendaPage.css';

export const AgendaPage: React.FC = () => {
  const { tasks, refresh } = useTasks();
  const { users } = useUsers();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Estados para Filtros
  const [filterUser, setFilterUser] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  // Lógica de Filtro Aprimorada
  const getTasksForDay = (day: number) => {
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      // Aplicar Filtros de UI primeiro
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterStatus && task.status !== filterStatus) return false;
      if (filterUser && !task.assignees?.some((a: any) => a.user_id === filterUser)) return false;

      // Usar due_date ou created_at como âncora para a recorrência
      const baseDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at);
      baseDate.setHours(0, 0, 0, 0);
      
      const isExactMatch = baseDate.getTime() === targetDate.getTime();
      if (isExactMatch && (task.due_date || task.recurrence)) return true;

      if (task.recurrence && baseDate < targetDate) {
        const diffTime = targetDate.getTime() - baseDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (task.recurrence === 'daily') return true;
        if (task.recurrence === 'weekly') return diffDays % 7 === 0;
        if (task.recurrence === 'monthly') return baseDate.getDate() === day;
      }

      return false;
    });
  };

  const clearFilters = () => {
    setFilterUser('');
    setFilterPriority('');
    setFilterStatus('');
  };

  const hasActiveFilters = filterUser || filterPriority || filterStatus;

  return (
    <div className="agenda-page animate-fade-in">
      <div className="agenda-header">
        <div className="header-info">
          <h1>Agenda da Agência</h1>
          <p>Acompanhe prazos e entregas de forma visual.</p>
        </div>
        
        <div className="calendar-controls">
          <div className="month-selector">
            <button onClick={prevMonth}><ChevronLeft size={20} /></button>
            <h2>{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}</h2>
            <button onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>
          <button className="today-btn" onClick={() => setCurrentDate(new Date())}>Hoje</button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="agenda-filters">
        <div className="filter-group">
          <div className="filter-item">
            <UserIcon size={16} />
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)}>
              <option value="">Todos os Membros</option>
              {users.map(u => (
                <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <Flag size={16} />
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">Todas as Prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
          <div className="filter-item">
            <Tag size={16} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Todos os Estágios</option>
              <option value="todo">A Fazer</option>
              <option value="doing">Em Produção</option>
              <option value="review">Revisão</option>
              <option value="done">Concluído</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <X size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-grid">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
          
          {days.map((day, index) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            const isToday = day === new Date().getDate() && 
                            month === new Date().getMonth() && 
                            year === new Date().getFullYear();

            return (
              <div key={index} className={`calendar-day ${day ? '' : 'empty'} ${isToday ? 'today' : ''}`}>
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    <div className="day-tasks">
                      {dayTasks.slice(0, 4).map(task => (
                        <div 
                          key={task.id} 
                          className={`calendar-task-card ${task.priority} ${task.status}`}
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="task-indicators">
                            {task.assignees?.map((a: any) => (
                              <div 
                                key={a.user_id} 
                                className="mini-user-dot" 
                                style={{ backgroundColor: a.color || 'var(--accent-primary)' }}
                                title={a.full_name}
                              />
                            ))}
                          </div>
                          <span className="task-title">{task.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 4 && (
                        <div className="more-tasks">+{dayTasks.length - 4} mais</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => {
            refresh();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
