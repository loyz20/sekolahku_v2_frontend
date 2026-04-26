import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  metadata: any;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastNotifId = useRef<string | null>(null);

  const fetchNotifications = useCallback(async (isFirstLoad = false) => {
    if (!isAuthenticated) return;
    
    try {
      if (isFirstLoad) setLoading(true);
      const response = await api.get<{ data: { notifications: Notification[], unreadCount: number } }>('/notifications');
      const newNotifs = response.data.notifications;
      
      // Check for new unread notifications to show toast
      if (!isFirstLoad && newNotifs.length > 0) {
        const latest = newNotifs[0];
        if (!latest.is_read && latest.id !== lastNotifId.current) {
          toast(latest.title, {
            description: latest.message,
            action: {
              label: 'Lihat',
              onClick: () => {
                const bell = document.getElementById('notif-bell');
                if (bell) bell.click();
              }
            }
          });
        }
      }
      
      if (newNotifs.length > 0) {
        lastNotifId.current = newNotifs[0].id;
      }
      
      setNotifications(newNotifs);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(true);
      // Poll for notifications every 60 seconds
      const interval = setInterval(() => fetchNotifications(false), 60000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      refreshNotifications: fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
