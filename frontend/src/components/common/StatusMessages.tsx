import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClass} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
      />
    </div>
  );
};

export const ErrorMessage: React.FC<{ message: string; onDismiss?: () => void }> = ({
  message,
  onDismiss,
}) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
      <span className="block sm:inline">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-0 bottom-0 right-0 px-4 py-3">
          <span className="text-2xl">&times;</span>
        </button>
      )}
    </div>
  );
};

export const SuccessMessage: React.FC<{ message: string; onDismiss?: () => void }> = ({
  message,
  onDismiss,
}) => {
  return (
    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-4">
      <span className="block sm:inline">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-0 bottom-0 right-0 px-4 py-3">
          <span className="text-2xl">&times;</span>
        </button>
      )}
    </div>
  );
};
