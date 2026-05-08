import React, { useState } from 'react';
import { 
  Plus, 
  Building2, 
  Mail, 
  Phone, 
  ExternalLink, 
  MoreVertical,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { AddClientModal } from '../components/AddClientModal';
import './ClientsPage.css';

export const ClientsPage: React.FC = () => {
  const { clients, loading, error, refresh } = useClients();
  const [showModal, setShowModal] = useState(false);

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
            <input type="text" placeholder="Buscar clientes..." />
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
            {clients.map(client => (
              <div key={client.id} className="client-card">
                <div className="card-header">
                  <div className="client-logo">
                    {client.logo_url ? <img src={client.logo_url} alt="" /> : <Building2 size={24} />}
                  </div>
                  <button className="more-btn"><MoreVertical size={20} /></button>
                </div>
                
                <div className="card-body">
                  <h3>{client.company}</h3>
                  <p className="contact-name">{client.name}</p>
                  
                  <div className="contact-info">
                    <div className="info-item">
                      <Mail size={14} />
                      <span>{client.email}</span>
                    </div>
                    <div className="info-item">
                      <Phone size={14} />
                      <span>{client.phone}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="projects-badge">
                      -- Projetos
                    </div>
                    <span className="status-dot ativo">Ativo</span>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button className="view-profile">Ver Perfil <ExternalLink size={14} /></button>
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
