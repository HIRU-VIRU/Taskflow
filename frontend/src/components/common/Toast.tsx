import { useContext } from 'react';
import { NotificationContext } from '../../contexts/NotificationContext';
import { X, Check, AlertCircle, Info } from 'lucide-react';

const Toast = () => {
  const context = useContext(NotificationContext);
  if (!context) return null;

  const { notifications, removeNotification } = context;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-96">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 p-4 rounded-lg border ${getStyles(
            notification.type
          )} animate-in fade-in slide-in-from-right-4`}
        >
          {getIcon(notification.type)}
          <p className="flex-1 text-sm font-medium">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
