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
    <div className="flex items-center justify-center min-h-screen px-4" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--radius-xl)' }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', boxShadow: 'var(--shadow-lg)' }}>
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Real-Time Chat
            </h1>
            <p className="text-gray-600 text-sm">
              Connect instantly with people around the world
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="Enter your username..."
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: 'var(--color-bg-secondary)', 
                  border: '1px solid var(--color-border)', 
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-md)'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                disabled={isConnecting}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {connectionError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <span>⚠️</span>
                <span>{connectionError}</span>
              </div>
            )}

            {/* Connect Button */}
            <button
              onClick={onConnect}
              disabled={isConnecting || !username.trim()}
              className="w-full py-3 px-4 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', 
                color: 'var(--color-text-on-primary)',
                boxShadow: 'var(--shadow-md)',
                borderRadius: 'var(--radius-md)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Join Chat</span>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-600">
            Press Enter to join • No signup required
          </div>
        </div>
      </div>
    </div>
  );
};
