import React, { useState } from 'react';
import { FileText, ChevronRight, Plus, Search, Edit2, Share2, MoreHorizontal } from 'lucide-react';
import './ProjectWiki.css';

interface Page {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  subPages?: Page[];
}

const initialPages: Page[] = [
  {
    id: '1',
    title: 'Diretrizes do Projeto',
    content: 'Estas são as diretrizes principais para o desenvolvimento da plataforma...',
    updatedAt: 'Há 2 horas',
    subPages: [
      { id: '1-1', title: 'Identidade Visual', content: 'Cores, tipografia e logotipos...', updatedAt: 'Ontem' },
      { id: '1-2', title: 'Arquitetura de Dados', content: 'Modelagem do banco de dados...', updatedAt: 'Ontem' }
    ]
  },
  {
    id: '2',
    title: 'Manual do Usuário',
    content: 'Como utilizar todas as funcionalidades do sistema...',
    updatedAt: 'Há 3 dias'
  }
];

export const ProjectWiki: React.FC = () => {
  const [pages] = useState<Page[]>(initialPages);
  const [selectedPage, setSelectedPage] = useState<Page>(initialPages[0]);

  return (
    <div className="wiki-container">
      <div className="wiki-sidebar">
        <div className="wiki-sidebar-header">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Buscar páginas..." />
          </div>
          <button className="add-page-btn"><Plus size={16} /></button>
        </div>
        
        <nav className="wiki-nav">
          {pages.map(page => (
            <div key={page.id} className="wiki-nav-group">
              <button 
                className={`wiki-nav-item ${selectedPage.id === page.id ? 'active' : ''}`}
                onClick={() => setSelectedPage(page)}
              >
                <ChevronRight size={14} className={page.subPages ? 'has-sub' : 'hidden'} />
                <FileText size={16} />
                <span>{page.title}</span>
              </button>
              {page.subPages && (
                <div className="wiki-sub-nav">
                  {page.subPages.map(sub => (
                    <button 
                      key={sub.id} 
                      className={`wiki-nav-item sub ${selectedPage.id === sub.id ? 'active' : ''}`}
                      onClick={() => setSelectedPage(sub)}
                    >
                      <FileText size={14} />
                      <span>{sub.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="wiki-content">
        <div className="wiki-content-header">
          <div className="page-title-area">
            <h1>{selectedPage.title}</h1>
            <p className="last-update">Atualizado {selectedPage.updatedAt}</p>
          </div>
          <div className="wiki-actions">
            <button className="action-btn"><Edit2 size={18} /> Editar</button>
            <button className="action-btn"><Share2 size={18} /> Compartilhar</button>
            <button className="action-btn icon-only"><MoreHorizontal size={18} /></button>
          </div>
        </div>

        <div className="wiki-body">
          <div className="content-placeholder">
            {selectedPage.content}
            <div className="demo-text">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <h3>Próximos Passos</h3>
              <ul>
                <li>Definir cronograma inicial</li>
                <li>Validar protótipo com o cliente</li>
                <li>Iniciar setup do ambiente de dev</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
