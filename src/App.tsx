import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectWiki } from './components/ProjectWiki';
import { UsersPage } from './pages/UsersPage';
import { ClientsPage } from './pages/ClientsPage';
import { ContractsPage } from './pages/ContractsPage';
import { 
  BarChart3, 
  TrendingUp, 
  Users as UsersIcon, 
  Clock 
} from 'lucide-react';
import './App.css';

const Dashboard = () => (
  <div className="animate-fade-in">
    <div className="dashboard-header">
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
    
    <div style={{ marginTop: '40px' }}>
      <KanbanBoard />
    </div>
  </div>
);

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectWiki />} />
        <Route path="/tasks" element={<KanbanBoard />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
