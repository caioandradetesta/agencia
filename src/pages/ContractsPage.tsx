import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  History, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Search,
  Calendar,
  MoreVertical
} from 'lucide-react';
import './ContractsPage.css';

interface Contract {
  id: string;
  client: string;
  project: string;
  value: string;
  status: 'Assinado' | 'Aguardando' | 'Expirado';
  date: string;
}

const mockContracts: Contract[] = [
  { id: 'CT-001', client: 'Tech Nova', project: 'Redesign Landing Page', value: 'R$ 4.500,00', status: 'Assinado', date: '01/05/2026' },
  { id: 'CT-002', client: 'Studio J', project: 'Gestão de Redes Sociais', value: 'R$ 2.200,00/mês', status: 'Aguardando', date: '05/05/2026' },
  { id: 'CT-003', client: 'LogiFlow', project: 'App Development', value: 'R$ 15.000,00', status: 'Expirado', date: '20/04/2026' },
];

export const ContractsPage: React.FC = () => {
  const [contracts] = useState<Contract[]>(mockContracts);

  return (
    <div className="contracts-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>Contratos e Planejamento</h1>
          <p>Gestão de documentos legais e cronogramas financeiros.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn"><History size={18} /> Histórico</button>
          <button className="add-contract-btn"><Plus size={18} /> Novo Contrato</button>
        </div>
      </div>

      <div className="contracts-overview">
        <div className="overview-card">
          <div className="o-icon blue"><FileText size={24} /></div>
          <div className="o-info">
            <span className="o-label">Total em Contratos</span>
            <span className="o-value">R$ 21.700,00</span>
          </div>
        </div>
        <div className="overview-card">
          <div className="o-icon green"><CheckCircle2 size={24} /></div>
          <div className="o-info">
            <span className="o-label">Assinados</span>
            <span className="o-value">12</span>
          </div>
        </div>
        <div className="overview-card">
          <div className="o-icon orange"><AlertCircle size={24} /></div>
          <div className="o-info">
            <span className="o-label">Pendentes</span>
            <span className="o-value">3</span>
          </div>
        </div>
      </div>

      <div className="contracts-section">
        <div className="section-header">
          <h2>Contratos Recentes</h2>
          <div className="section-search">
            <Search size={18} />
            <input type="text" placeholder="Buscar por cliente ou projeto..." />
          </div>
        </div>

        <div className="contracts-list">
          {contracts.map(contract => (
            <div key={contract.id} className="contract-item">
              <div className="c-info-main">
                <div className="c-icon"><FileText size={20} /></div>
                <div className="c-text">
                  <h3>{contract.project}</h3>
                  <p>{contract.client} • {contract.id}</p>
                </div>
              </div>
              
              <div className="c-meta">
                <div className="meta-block">
                  <span className="m-label">Valor</span>
                  <span className="m-value">{contract.value}</span>
                </div>
                <div className="meta-block">
                  <span className="m-label">Data</span>
                  <div className="m-date">
                    <Calendar size={14} />
                    <span>{contract.date}</span>
                  </div>
                </div>
                <div className={`status-pill ${contract.status.toLowerCase()}`}>
                  {contract.status}
                </div>
              </div>

              <div className="c-actions">
                <button className="action-icon" title="Visualizar"><Eye size={18} /></button>
                <button className="action-icon" title="Download"><Download size={18} /></button>
                <button className="action-icon more"><MoreVertical size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
