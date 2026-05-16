import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Users, 
  UserSquare2, 
  FileText, 
  ChevronLeft,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoLight from '../assets/logo-light.png';
import logoDark from '../assets/logo-dark.png';
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
];

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['projects']);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { user, logout } = useAuth();

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
        {!isCollapsed && (
          <div className="logo-container">
            <img 
              src={theme === 'light' ? logoLight : logoDark} 
              alt="FLUXSeed" 
              className="logo-img" 
            />
          </div>
        )}
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
        <div className="user-profile-section">
          <div 
            className="user-avatar" 
            style={{ backgroundColor: user?.profile?.color || 'var(--accent-primary)' }}
          >
            {user?.profile?.full_name?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <span className="user-name">{user?.profile?.full_name}</span>
              <span className="user-role">{user?.profile?.role}</span>
            </div>
          )}
        </div>
        
        <div className="footer-actions">
          <button className="footer-action" onClick={toggleTheme} title="Alternar Tema">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="footer-action logout" onClick={logout} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
