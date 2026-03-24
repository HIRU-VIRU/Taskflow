import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }

  return {
    showSuccess: (message: string) => context.addNotification(message, 'success'),
    showError: (message: string) => context.addNotification(message, 'error'),
    showInfo: (message: string) => context.addNotification(message, 'info'),
    showWarning: (message: string) => context.addNotification(message, 'warning'),
  };
};
