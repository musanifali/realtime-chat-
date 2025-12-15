// client/src/components/PWA/UpdatePrompt.tsx
import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdatePrompt: React.FC = () => {
  const [showReload, setShowReload] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('✅ Service Worker registered:', r);
    },
    onRegisterError(error: any) {
      console.error('❌ Service Worker registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowReload(true);
      soundManager.playReceive(); // Play notification sound
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    soundManager.playClick();
    updateServiceWorker(true);
    setShowReload(false);
  };

  const handleDismiss = () => {
    soundManager.playClick();
    setShowReload(false);
    setNeedRefresh(false);
  };

  if (!showReload) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-comic-pop">
      <div
        className="relative p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-tertiary)',
          border: '3px solid var(--color-border)',
          boxShadow: '4px 4px 0 var(--color-border)'
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 p-2 rounded-lg animate-spin-slow"
            style={{
              backgroundColor: 'var(--color-primary)',
              border: '2px solid var(--color-border)'
            }}
          >
            <RefreshCw className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-black uppercase text-sm mb-1" style={{ color: 'var(--color-primary)' }}>
              🚀 New Update Available!
            </h3>
            <p className="text-xs font-bold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              A new version of ComicChat is ready. Reload to get the latest features!
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 px-3 py-2 font-black uppercase text-xs transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: '2px solid var(--color-border)',
                  borderRadius: '6px',
                  boxShadow: '2px 2px 0 var(--color-border)'
                }}
              >
                ⚡ RELOAD
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 font-bold text-xs transition-all hover:scale-105"
                style={{
                  backgroundColor: 'white',
                  border: '2px solid var(--color-border)',
                  borderRadius: '6px'
                }}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
