import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Building2, 
  Mail, 
  Phone, 
  ExternalLink, 
  Search,
  Filter,
  Loader2,
  Trash2,
  Edit3,
  User,
  Briefcase,
  FolderOpen
} from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { AddClientModal } from '../components/AddClientModal';
import { api } from '../lib/api';
import './ClientsPage.css';

export const ClientsPage: React.FC = () => {
  const { clients, loading, error, refresh } = useClients();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${name}"?`)) return;
    try {
      await api.delete(`/api/clients/${id}`);
      refresh();
    } catch (err: any) {
      alert('Erro ao excluir cliente: ' + err.message);
    }
  };

  const filteredClients = clients.filter(c => 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="clients-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>Gestão de Clientes</h1>
          <p>Base de clientes e histórico de parcerias.</p>
        </div>
        <button className="add-client-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      <div className="clients-grid">
        <div className="grid-controls">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar clientes..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-btn"><Filter size={18} /> Filtros</button>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Carregando clientes...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>Erro ao carregar clientes: {error}</p>
          </div>
        ) : (
          <div className="clients-cards">
            {filteredClients.map(client => (
              <div key={client.id} className="client-card">
                <div className="card-header">
                  <div className="client-logo">
                    {client.logo_url ? <img src={client.logo_url} alt="" /> : <Building2 size={24} />}
                  </div>
                  <div className="card-header-actions">
                    <button className="icon-btn edit" title="Editar"><Edit3 size={16} /></button>
                    <button 
                      className="icon-btn delete" 
                      title="Excluir"
                      onClick={() => handleDeleteClient(client.id, client.company)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="card-body">
                  <Link to={`/clients/${client.id}`} target="_blank" className="client-title-link" title="Acessar Repositório">
                    <h3>{client.company}</h3>
                  </Link>
                  <div className="responsible-box">
                    <User size={14} />
                    <span>Responsável: <strong>{client.name}</strong></span>
                  </div>
                  
                  <div className="contact-info">
                    <div className="info-item">
                      <Mail size={14} />
                      <span>{client.email || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <Phone size={14} />
                      <span>{client.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="projects-count-badge">
                      <Briefcase size={14} />
                      {client.project_count || 0} {client.project_count === 1 ? 'Projeto' : 'Projetos'}
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <Link to={`/clients/${client.id}`} target="_blank" className="view-repository-btn">
                    Repositório <FolderOpen size={14} />
                  </Link>
                  <button className="view-profile">
                    Projetos <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
            
            <button className="new-client-card" onClick={() => setShowModal(true)}>
              <div className="plus-icon"><Plus size={32} /></div>
              <span>Adicionar Novo Cliente</span>
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AddClientModal 
          onClose={() => setShowModal(false)} 
          onSuccess={refresh}
        />
      )}
    </div>
  );
};
