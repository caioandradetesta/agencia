import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  MoreVertical, 
  Plus,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useContracts } from '../hooks/useContracts';
import { AddContractModal } from '../components/AddContractModal';
import './ContractsPage.css';

export const ContractsPage: React.FC = () => {
  const { contracts, loading, error, refresh } = useContracts();
  const [showModal, setShowModal] = useState(false);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: 'Rascunho',
      pending: 'Pendente',
      signed: 'Assinado',
      expired: 'Expirado'
    };
    return map[status] || status;
  };

  return (
    <div className="contracts-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>Contratos e Planejamento</h1>
          <p>Gerencie documentos legais e marcos do projeto.</p>
        </div>
        <button className="add-contract-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Novo Contrato
        </button>
      </div>

      <div className="contracts-stats">
        <div className="c-stat">
          <div className="c-icon blue"><FileText size={20} /></div>
          <div className="c-info">
            <span className="c-label">Total de Contratos</span>
            <span className="c-value">{contracts.length}</span>
          </div>
        </div>
        <div className="c-stat">
          <div className="c-icon green"><DollarSign size={20} /></div>
          <div className="c-info">
            <span className="c-label">Valor Total</span>
            <span className="c-value">R$ {contracts.reduce((acc, c) => acc + (c.value || 0), 0).toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <div className="c-stat">
          <div className="c-icon orange"><Calendar size={20} /></div>
          <div className="c-info">
            <span className="c-label">Próximos Vencimentos</span>
            <span className="c-value">--</span>
          </div>
        </div>
      </div>

      <div className="contracts-container">
        <div className="table-controls">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Buscar por título ou cliente..." />
          </div>
          <button className="filter-btn"><Filter size={18} /> Filtros</button>
        </div>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Carregando contratos...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={32} />
            <p>Erro ao carregar contratos: {error}</p>
          </div>
        ) : (
          <div className="contracts-table-wrapper">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>Título do Contrato</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      Nenhum contrato encontrado.
                    </td>
                  </tr>
                ) : (
                  contracts.map(contract => (
                    <tr key={contract.id}>
                      <td>
                        <div className="doc-cell">
                          <FileText size={20} className="doc-icon" />
                          <div className="doc-info">
                            <span className="doc-title">{contract.title}</span>
                            <span className="doc-project">{contract.project_name || 'Sem projeto'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{contract.client_name || '--'}</td>
                      <td>
                        <span className="value-cell">R$ {contract.value?.toLocaleString('pt-BR')}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${contract.status}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </td>
                      <td>{new Date(contract.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <div className="action-group">
                          <button className="icon-btn" title="Ver Detalhes"><Eye size={16} /></button>
                          {contract.file_url && (
                            <a href={contract.file_url} target="_blank" rel="noreferrer" className="icon-btn" title="Download">
                              <Download size={16} />
                            </a>
                          )}
                          <button className="icon-btn"><MoreVertical size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddContractModal 
          onClose={() => setShowModal(false)} 
          onSuccess={refresh}
        />
      )}
    </div>
  );
};
