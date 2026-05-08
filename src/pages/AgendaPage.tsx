import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { TaskDetailModal } from '../components/TaskDetailModal';
import './AgendaPage.css';

export const AgendaPage: React.FC = () => {
  const { tasks, refresh } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any>(null);

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
  // Dias vazios do mês anterior
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  // Dias do mês atual
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const getTasksForDay = (day: number) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getDate() === day &&
        taskDate.getMonth() === month &&
        taskDate.getFullYear() === year
      );
    });
  };

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
                      {dayTasks.slice(0, 3).map(task => (
                        <div 
                          key={task.id} 
                          className={`calendar-task-card ${task.priority} ${task.status}`}
                          onClick={() => setSelectedTask(task)}
                        >
                          <span className="task-dot" />
                          <span className="task-title">{task.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="more-tasks">+{dayTasks.length - 3} mais</div>
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
