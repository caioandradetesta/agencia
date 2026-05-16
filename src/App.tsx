import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectWiki } from './components/ProjectWiki';
import { ProjectsPage } from './pages/ProjectsPage';
import { UsersPage } from './pages/UsersPage';
import { ClientsPage } from './pages/ClientsPage';
import { ContractsPage } from './pages/ContractsPage';
import { LoginPage } from './pages/LoginPage';
import { AgendaPage } from './pages/AgendaPage';
import { useAuth } from './context/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users as UsersIcon, 
  Clock,
  Loader2
} from 'lucide-react';
import './App.css';

const Dashboard = () => (
  <div className="animate-fade-in">
    <div className="dashboard-header">
      <div className="welcome">
        <h1>Bem-vindo ao Painel! 👋</h1>
        <p>Aqui está o resumo das atividades da agência.</p>
      </div>
    </div>
    
    <KanbanBoard />
  </div>
);

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="animate-spin" size={48} />
        <p>Carregando sistema...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/wiki" element={<ProjectWiki />} />
        <Route path="/tasks" element={<KanbanBoard />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
