import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Users, 
  UserSquare2, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import './Sidebar.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  subItems?: { id: string; label: string }[];
}

const navItems: NavItem[] = [
  { 
    id: 'projects', 
    label: 'Projetos', 
    icon: <LayoutDashboard size={20} />,
    subItems: [
      { id: 'all-projects', label: 'Todos os Projetos' },
      { id: 'new-project', label: 'Novo Projeto' },
      { id: 'templates', label: 'Modelos' }
    ]
  },
  { 
    id: 'tasks', 
    label: 'Tarefas', 
    icon: <CheckSquare size={20} />,
    subItems: [
      { id: 'my-tasks', label: 'Minhas Tarefas' },
      { id: 'kanban', label: 'Quadro Kanban' },
      { id: 'backlog', label: 'Backlog' }
    ]
  },
  { id: 'agenda', label: 'Agenda', icon: <Calendar size={20} /> },
  { id: 'clients', label: 'Clientes', icon: <Users size={20} /> },
  { id: 'users', label: 'Usuários', icon: <UserSquare2 size={20} /> },
  { id: 'contracts', label: 'Contratos', icon: <FileText size={20} /> },
  { id: 'admin', label: 'Admin', icon: <Settings size={20} /> },
];

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['projects']);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleExpand = (id: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedItems([id]);
      return;
    }
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h1 className="logo">Agência<span>.</span></h1>}
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div key={item.id} className="nav-group">
            <button 
              className={`nav-item ${expandedItems.includes(item.id) ? 'active' : ''}`}
              onClick={() => item.subItems ? toggleExpand(item.id) : null}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {!isCollapsed && item.subItems && (
                <span className={`expand-icon ${expandedItems.includes(item.id) ? 'open' : ''}`}>
                  <ChevronDown size={16} />
                </span>
              )}
            </button>

            {!isCollapsed && item.subItems && expandedItems.includes(item.id) && (
              <div className="sub-nav">
                {item.subItems.map(sub => (
                  <button key={sub.id} className="sub-nav-item">
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="footer-action" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {!isCollapsed && <span>{theme === 'light' ? 'Escuro' : 'Claro'}</span>}
        </button>
        <button className="footer-action logout">
          <LogOut size={20} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};
