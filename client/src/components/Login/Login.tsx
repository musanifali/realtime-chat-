// client/src/components/Login/Login.tsx

import React from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';

interface LoginProps {
  username: string;
  isConnecting: boolean;
  connectionError: string;
  onUsernameChange: (username: string) => void;
  onConnect: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Login: React.FC<LoginProps> = ({
  username,
  isConnecting,
  connectionError,
  onUsernameChange,
  onConnect,
  onKeyPress,
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 halftone-bg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="w-full max-w-md animate-comic-pop">
        <div className="comic-outline p-8" style={{ 
          backgroundColor: 'var(--color-surface)', 
          border: '4px solid var(--color-border)', 
          boxShadow: 'var(--shadow-xl)', 
          borderRadius: 'var(--radius-md)',
          transform: 'rotate(-1deg)'
        }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 animate-comic-shake" style={{ 
              backgroundColor: 'var(--color-accent)',
              border: '4px solid var(--color-border)',
              boxShadow: 'var(--shadow-pop)',
              borderRadius: '50%',
              transform: 'rotate(5deg)'
            }}>
              <MessageSquare className="w-10 h-10" style={{ color: 'var(--color-text-primary)', strokeWidth: 3 }} />
            </div>
            <h1 className="comic-text text-4xl md:text-5xl mb-2" style={{ 
              color: 'var(--color-primary)',
              textShadow: '3px 3px 0 var(--color-border)',
              WebkitTextStroke: '2px var(--color-border)'
            }}>
              CHAT!
            </h1>
            <p className="font-bold text-base md:text-lg" style={{ color: 'var(--color-text-primary)' }}>
              🎨 POP INTO THE CONVERSATION! 💥
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black mb-2 comic-text" style={{ 
                color: 'var(--color-text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                HERO NAME:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="TYPE YOUR NAME!"
                className="w-full px-4 py-3 font-bold focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed comic-outline"
                style={{ 
                  backgroundColor: 'var(--color-surface)', 
                  border: '3px solid var(--color-border)', 
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onFocus={(e) => { 
                  e.currentTarget.style.border = '3px solid var(--color-primary)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '3px solid var(--color-border)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                disabled={isConnecting}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {connectionError && (
              <div className="flex items-center gap-2 px-4 py-3 comic-outline animate-comic-shake" style={{
                backgroundColor: 'var(--color-error)',
                border: '3px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-on-primary)',
                boxShadow: 'var(--shadow-md)',
                fontWeight: 'bold'
              }}>
                <span className="text-2xl">⚠️</span>
                <span className="uppercase">{connectionError}</span>
              </div>
            )}

            {/* Connect Button */}
            <button
              onClick={onConnect}
              disabled={isConnecting || !username.trim()}
              className="w-full py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 comic-text text-xl md:text-2xl comic-outline"
              style={{ 
                backgroundColor: 'var(--color-accent)',
                border: '4px solid var(--color-border)',
                color: 'var(--color-text-on-yellow)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-sm)',
                transform: 'rotate(-1deg)',
                textShadow: '2px 2px 0 rgba(255,255,255,0.5)'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.transform = 'rotate(-1deg) scale(1.05)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                e.currentTarget.classList.add('animate-kapow');
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.transform = 'rotate(-1deg) scale(1)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.classList.remove('animate-kapow');
              }}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" strokeWidth={3} />
                  <span>ZAP! CONNECTING...</span>
                </>
              ) : (
                <>
                  <span>💥 JOIN CHAT! 💥</span>
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center font-bold" style={{ color: 'var(--color-text-primary)' }}>
            <span className="text-sm">⚡ PRESS ENTER TO ZAP IN! ⚡</span>
          </div>
        </div>
      </div>
    </div>
  );
};
