import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  Briefcase, 
  Calendar, 
  User, 
  ExternalLink,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { api } from '../lib/api';
import { AddProjectModal } from '../components/AddProjectModal';
import './ProjectsPage.css';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Erro ao buscar projetos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${name}"? Todas as tarefas vinculadas poderão ser afetadas.`)) return;
    try {
      await api.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (err: any) {
      alert('Erro ao excluir projeto: ' + err.message);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="projects-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>Gestão de Projetos</h1>
          <p>Organize as entregas e o escopo de cada cliente.</p>
        </div>
        <button className="add-project-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Novo Projeto
        </button>
      </div>

      <div className="projects-grid">
        <div className="grid-controls">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar projetos ou clientes..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-btn"><Filter size={18} /> Filtros</button>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Carregando projetos...</p>
          </div>
        ) : (
          <div className="projects-list">
            {filteredProjects.length === 0 ? (
              <div className="empty-state-projects">
                <Briefcase size={48} />
                <p>Nenhum projeto encontrado. Comece criando um novo!</p>
              </div>
            ) : (
              filteredProjects.map(project => (
                <div key={project.id} className="project-card-premium">
                  <div className="project-card-header">
                    <div className="project-icon-box">
                      <Briefcase size={24} />
                    </div>
                    <div className="project-header-actions">
                      <button 
                        className="delete-btn-p" 
                        onClick={() => handleDeleteProject(project.id, project.name)}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="more-btn-p"><MoreVertical size={18} /></button>
                    </div>
                  </div>
                  
                  <div className="project-card-body">
                    <h3>{project.name}</h3>
                    <div className="project-client-tag">
                      <User size={14} />
                      <span>{project.client_name}</span>
                    </div>
                    <p className="project-desc">{project.description || 'Sem descrição definida.'}</p>
                  </div>

                  <div className="project-card-footer">
                    <div className="project-date">
                      <Calendar size={14} />
                      <span>Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <button className="open-wiki-btn">
                      Ver Detalhes
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddProjectModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={fetchProjects}
        />
      )}
    </div>
  );
};
