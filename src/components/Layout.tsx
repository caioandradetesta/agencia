import React from 'react';
import { Sidebar } from './Sidebar';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <header className="content-header">
          <div className="breadcrumb">
            <span>Visão Geral</span>
          </div>
          <div className="header-actions">
            <NotificationCenter />
            <div className="user-profile">
              <div className="avatar">{user?.full_name?.charAt(0) || 'U'}</div>
              <div className="user-info">
                <p className="name">{user?.full_name || 'Usuário'}</p>
                <p className="role">{user?.role || 'Membro'}</p>
              </div>
            </div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};
