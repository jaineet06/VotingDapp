import React, { useState, useEffect } from 'react';
import '../styles/Notification.css';

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  onClose: () => void;
  autoClose?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  details,
  onClose,
  autoClose = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && type === 'success') {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoClose, type]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
    }
  };

  return (
    <div className={`notification-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`notification notification-${type} ${isVisible ? 'show' : ''}`}>
        <div className="notification-header">
          <span className="notification-icon">{getIcon()}</span>
          <h3 className="notification-title">{getTitle()}</h3>
          <button className="notification-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="notification-body">
          <p className="notification-message">{message}</p>
          {details && (
            <div className="notification-details">
              <details>
                <summary>More details</summary>
                <pre>{details}</pre>
              </details>
            </div>
          )}
        </div>

        {type === 'error' && (
          <div className="notification-footer">
            <p className="notification-hint">
              💡 Need help? Check the <strong>FIX_DEPLOYMENT.md</strong> file for troubleshooting steps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for managing notifications
export interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showSuccess = (message: string, details?: string) => {
    setNotification({ type: 'success', message, details });
  };

  const showError = (message: string, details?: string) => {
    setNotification({ type: 'error', message, details });
  };

  const showWarning = (message: string, details?: string) => {
    setNotification({ type: 'warning', message, details });
  };

  const showInfo = (message: string, details?: string) => {
    setNotification({ type: 'info', message, details });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotification
  };
};
