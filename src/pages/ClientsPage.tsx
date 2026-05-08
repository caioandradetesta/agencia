import React, { useState } from 'react';
import { 
  Plus, 
  Building2, 
  Mail, 
  Phone, 
  ExternalLink, 
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';
import './ClientsPage.css';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  projectsCount: number;
  status: 'Ativo' | 'Pendente';
  logo?: string;
}

const mockClients: Client[] = [
  { id: '1', name: 'Ricardo Santos', company: 'Tech Nova', email: 'ricardo@technova.com', phone: '(11) 98877-6655', projectsCount: 3, status: 'Ativo' },
  { id: '2', name: 'Juliana Paes', company: 'Studio J', email: 'juliana@studioj.com', phone: '(21) 97766-5544', projectsCount: 1, status: 'Ativo' },
  { id: '3', name: 'Marcos Oliveira', company: 'LogiFlow', email: 'marcos@logiflow.io', phone: '(41) 96655-4433', projectsCount: 0, status: 'Pendente' },
];

export const ClientsPage: React.FC = () => {
  const [clients] = useState<Client[]>(mockClients);

  return (
    <div className="clients-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>Gestão de Clientes</h1>
          <p>Base de clientes e histórico de parcerias.</p>
        </div>
        <button className="add-client-btn">
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

        <div className="clients-cards">
          {clients.map(client => (
            <div key={client.id} className="client-card">
              <div className="card-header">
                <div className="client-logo">
                  <Building2 size={24} />
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
                    {client.projectsCount} Projetos
                  </div>
                  <span className={`status-dot ${client.status.toLowerCase()}`}>
                    {client.status}
                  </span>
                </div>
              </div>
              
              <div className="card-actions">
                <button className="view-profile">Ver Perfil <ExternalLink size={14} /></button>
              </div>
            </div>
          ))}
          
          <button className="new-client-card">
            <div className="plus-icon"><Plus size={32} /></div>
            <span>Adicionar Novo Cliente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
