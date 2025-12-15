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

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          onClose();
        }, 400);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] transition-all duration-500 ease-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-[120%] opacity-0 scale-95'
      }`}
      onClick={() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          onClose();
        }, 400);
      }}
    >
      <div 
        className="relative cursor-pointer group"
        style={{
          filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))',
        }}
      >
        {/* Comic border effect */}
        <div 
          className="absolute inset-0 rounded-2xl transform rotate-1"
          style={{
            background: 'var(--color-border)',
            zIndex: -1,
          }}
        />
        
        {/* Main notification card */}
        <div 
          className="relative rounded-2xl p-4 pr-12 min-w-[280px] max-w-[320px] transform -rotate-1 group-hover:rotate-0 transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            border: '3px solid var(--color-border)',
            boxShadow: '4px 4px 0 var(--color-border)',
          }}
        >
          {/* Notification icon */}
          <div className="flex items-center gap-4">
            <div 
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl transform group-hover:scale-110 transition-transform"
              style={{
                background: 'white',
                border: '3px solid var(--color-border)',
                boxShadow: '2px 2px 0 var(--color-border)',
              }}
            >
              {message.icon || '💬'}
            </div>
            
            {/* Message text */}
            <div className="flex-1 min-w-0">
              <h3 
                className="font-black text-base uppercase tracking-wide mb-1"
                style={{
                  color: 'white',
                  textShadow: '2px 2px 0 var(--color-border)',
                }}
              >
                {message.title}
              </h3>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExiting(true);
              setTimeout(() => {
                setIsVisible(false);
                onClose();
              }, 400);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-lg transform hover:scale-125 hover:rotate-90 transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid var(--color-border)',
              color: 'var(--color-primary)',
              boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.2)',
            }}
          >
            ×
          </button>
          
          {/* Comic effect lines */}
          <div 
            className="absolute -top-2 -left-2 w-6 h-6 rounded-full opacity-50"
            style={{
              background: 'white',
              border: '2px solid var(--color-border)',
            }}
          />
          <div 
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full opacity-50"
            style={{
              background: 'white',
              border: '2px solid var(--color-border)',
            }}
          />
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
