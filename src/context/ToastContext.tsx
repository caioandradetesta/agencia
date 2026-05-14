import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  content: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface ToastContextType {
  addToast: (title: string, content: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, content: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, content, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Internal Toast Container Component
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info as InfoIcon } from 'lucide-react';
import './Toast.css';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="toast-icon success" />;
      case 'warning': return <AlertCircle size={20} className="toast-icon warning" />;
      case 'error': return <X size={20} className="toast-icon error" />;
      default: return <InfoIcon size={20} className="toast-icon info" />;
    }
  };

  return createPortal(
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast-item animate-slide-in ${toast.type || 'info'}`}>
          <div className="toast-left">
            {getIcon(toast.type)}
          </div>
          <div className="toast-body">
            <h4>{toast.title}</h4>
            <p>{toast.content}</p>
          </div>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};
