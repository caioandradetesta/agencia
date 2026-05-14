import React, { useState, useEffect } from 'react';
import { Bell, X, Info } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './NotificationCenter.css';

interface Notification {
  id: string;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
}

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const seenNotifIds = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get(`/api/notifications?user_id=${user?.id}`);
      const newNotifications: Notification[] = res.data;
      
      // Se não for a primeira carga, mostra toast para novas notificações não lidas
      if (seenNotifIds.current.size > 0) {
        newNotifications.forEach(n => {
          if (!n.read && !seenNotifIds.current.has(n.id)) {
            addToast(n.title, n.content, 'info');
          }
        });
      }

      // Atualiza o conjunto de IDs vistos
      newNotifications.forEach(n => seenNotifIds.current.add(n.id));
      
      setNotifications(newNotifications);
    } catch (err) {
      console.error('Erro ao buscar notificações');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Erro ao marcar como lida');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-center">
      <button className={`bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`} onClick={() => setShowDropdown(!showDropdown)}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notifications-dropdown animate-fade-in">
          <div className="dropdown-header">
            <h3>Notificações</h3>
            <button onClick={() => setShowDropdown(false)}><X size={16} /></button>
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-notif">Nenhuma notificação por aqui.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`} onClick={() => markAsRead(n.id)}>
                  <div className="notif-icon">
                    <Info size={16} />
                  </div>
                  <div className="notif-content">
                    <h4>{n.title}</h4>
                    <p>{n.content}</p>
                    <span className="notif-time">{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {!n.read && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
