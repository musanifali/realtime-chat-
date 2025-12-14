// client/src/components/PWA/InstallPrompt.tsx
import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt if user hasn't dismissed it before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallPrompt(true), 3000); // Show after 3 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('🎉 App is already installed!');
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    soundManager.playClick();
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    soundManager.playClick();
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-comic-pop">
      <div
        className="relative p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-accent)',
          border: '3px solid var(--color-border)',
          boxShadow: '4px 4px 0 var(--color-border)'
        }}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:scale-110 transition-transform"
          style={{
            backgroundColor: 'white',
            border: '2px solid var(--color-border)',
            borderRadius: '4px'
          }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div
            className="flex-shrink-0 p-2 rounded-lg"
            style={{
              backgroundColor: 'var(--color-primary)',
              border: '2px solid var(--color-border)'
            }}
          >
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-black uppercase text-sm mb-1" style={{ color: 'var(--color-primary)' }}>
              💥 Install ComicChat!
            </h3>
            <p className="text-xs font-bold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Get the app experience! Works offline, loads faster, and feels like a native app.
            </p>

            <button
              onClick={handleInstallClick}
              className="w-full px-4 py-2 font-black uppercase text-sm transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: '3px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: '3px 3px 0 var(--color-border)'
              }}
            >
              ⚡ INSTALL NOW!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
