// client/src/components/Toast/Toast.tsx

import React, { useEffect, useState } from 'react';

interface ToastMessage {
  id: string;
  title: string;
  body: string;
  icon?: string;
}

interface ToastProps {
  message: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade-out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
      onClick={() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }}
    >
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-lg shadow-2xl p-4 min-w-[300px] max-w-[400px] cursor-pointer hover:scale-105 transition-transform">
        <div className="flex items-start gap-3">
          {message.icon && (
            <div className="text-2xl flex-shrink-0">{message.icon}</div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm mb-1 truncate">{message.title}</h3>
            <p className="text-xs opacity-90 line-clamp-2">{message.body}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white/80 hover:text-white text-lg leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Container to manage multiple toasts
export const ToastContainer: React.FC<{ maxToasts?: number }> = ({ maxToasts = 3 }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // Listen for custom toast events
    const handleShowToast = (event: CustomEvent<Omit<ToastMessage, 'id'>>) => {
      const newToast: ToastMessage = {
        ...event.detail,
        id: Date.now().toString() + Math.random(),
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Keep only the most recent toasts
        return updated.slice(-maxToasts);
      });
    };

    window.addEventListener('showToast' as any, handleShowToast);
    return () => window.removeEventListener('showToast' as any, handleShowToast);
  }, [maxToasts]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// Helper function to show toast
export const showToast = (title: string, body: string, icon?: string) => {
  window.dispatchEvent(
    new CustomEvent('showToast', {
      detail: { title, body, icon },
    })
  );
};
