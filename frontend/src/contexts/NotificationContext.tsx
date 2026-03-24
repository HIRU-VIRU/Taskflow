import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Notification } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      message,
      type,
      duration: 5000,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

// Hook to use notification context
export const useNotification = (): NotificationContextType => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
