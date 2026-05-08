import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  path: string;
  subItems?: { id: string; label: string; path: string }[];
}

const navItems: NavItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: <LayoutDashboard size={20} />,
    path: '/'
  },
  { 
    id: 'projects', 
    label: 'Projetos', 
    icon: <LayoutDashboard size={20} />,
    path: '/projects',
    subItems: [
      { id: 'all-projects', label: 'Todos os Projetos', path: '/projects' },
      { id: 'new-project', label: 'Novo Projeto', path: '/projects' }
    ]
  },
  { 
    id: 'tasks', 
    label: 'Tarefas', 
    icon: <CheckSquare size={20} />,
    path: '/tasks'
  },
  { id: 'agenda', label: 'Agenda', icon: <Calendar size={20} />, path: '/agenda' },
  { id: 'clients', label: 'Clientes', icon: <Users size={20} />, path: '/clients' },
  { id: 'users', label: 'Usuários', icon: <UserSquare2 size={20} />, path: '/users' },
  { id: 'contracts', label: 'Contratos', icon: <FileText size={20} />, path: '/contracts' },
  { id: 'admin', label: 'Admin', icon: <Settings size={20} />, path: '/' },
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

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
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
            <NavLink 
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={(e) => item.subItems ? toggleExpand(e, item.id) : null}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {!isCollapsed && item.subItems && (
                <span className={`expand-icon ${expandedItems.includes(item.id) ? 'open' : ''}`}>
                  <ChevronDown size={16} />
                </span>
              )}
            </NavLink>

            {!isCollapsed && item.subItems && expandedItems.includes(item.id) && (
              <div className="sub-nav">
                {item.subItems.map(sub => (
                  <NavLink key={sub.id} to={sub.path} className="sub-nav-item">
                    {sub.label}
                  </NavLink>
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
