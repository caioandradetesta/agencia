import React from 'react';
import { Sidebar } from './Sidebar';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">
        <header className="content-header">
          <div className="breadcrumb">
            <span>Visão Geral</span>
          </div>
          <div className="header-actions">
            <div className="user-profile">
              <div className="avatar">JD</div>
              <div className="user-info">
                <p className="name">John Doe</p>
                <p className="role">Administrador</p>
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
