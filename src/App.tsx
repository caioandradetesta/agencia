import { useState } from 'react';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectWiki } from './components/ProjectWiki';
import { 
  BarChart3, 
  TrendingUp, 
  Users as UsersIcon, 
  Clock 
} from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'wiki'>('kanban');

  return (
    <Layout>
      <div className="dashboard-header animate-fade-in">
        <div className="welcome">
          <h1>Bem-vindo de volta, João! 👋</h1>
          <p>Você tem 3 tarefas urgentes para hoje.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><BarChart3 size={20} /></div>
            <div className="stat-info">
              <span className="label">Projetos Ativos</span>
              <span className="value">12</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><TrendingUp size={20} /></div>
            <div className="stat-info">
              <span className="label">Concluídos</span>
              <span className="value">48</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><UsersIcon size={20} /></div>
            <div className="stat-info">
              <span className="label">Equipe</span>
              <span className="value">8</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><Clock size={20} /></div>
            <div className="stat-info">
              <span className="label">Horas/Mês</span>
              <span className="value">164h</span>
            </div>
          </div>
        </div>
      </div>

      <div className="module-selector">
        <button 
          className={activeTab === 'kanban' ? 'active' : ''} 
          onClick={() => setActiveTab('kanban')}
        >
          Tarefas (Kanban)
        </button>
        <button 
          className={activeTab === 'wiki' ? 'active' : ''} 
          onClick={() => setActiveTab('wiki')}
        >
          Base de Conhecimento
        </button>
      </div>

      <div className="module-content">
        {activeTab === 'kanban' ? <KanbanBoard /> : <ProjectWiki />}
      </div>
    </Layout>
  );
}

export default App;
