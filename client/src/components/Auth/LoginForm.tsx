// client/src/components/Auth/LoginForm.tsx

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { authService } from '../../services/authService';
import { soundManager } from '../../services/SoundManager';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Username and password are required!');
      return;
    }

    setIsLoading(true);
    soundManager.playClick();

    try {
      await authService.login({
        username: formData.username,
        password: formData.password,
      });

      soundManager.playSend();
      onSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 halftone-bg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="w-full max-w-md animate-comic-pop">
        <div 
          className="p-8"
          style={{ 
            backgroundColor: 'white',
            border: '4px solid var(--color-border)',
            borderRadius: '20px',
            boxShadow: '8px 8px 0 var(--color-border)',
            transform: 'rotate(-1deg)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 mb-4 animate-comic-shake"
              style={{ 
                backgroundColor: 'var(--color-accent)',
                border: '4px solid var(--color-border)',
                boxShadow: '4px 4px 0 var(--color-border)',
                borderRadius: '50%',
                transform: 'rotate(5deg)'
              }}
            >
              <MessageSquare className="w-10 h-10" style={{ color: 'var(--color-text-primary)', strokeWidth: 3 }} />
            </div>
            <h1 
              className="text-4xl md:text-5xl font-black uppercase mb-2"
              style={{ 
                color: 'var(--color-primary)',
                textShadow: '3px 3px 0 var(--color-border)',
                WebkitTextStroke: '2px var(--color-border)'
              }}
            >
              💥 LOGIN! 💥
            </h1>
            <p className="font-bold text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              🎨 JUMP BACK INTO THE ACTION! 💥
            </p>
          </div>

          {error && (
            <div 
              className="mb-4 p-3 rounded-lg font-bold text-sm animate-comic-shake"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: '3px solid var(--color-border)',
                boxShadow: '3px 3px 0 var(--color-border)'
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-black uppercase text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
                USERNAME OR EMAIL:
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="cooluser123"
                className="w-full px-4 py-3 font-bold focus:outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '3px solid var(--color-border)',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0 var(--color-border)'
                }}
                onFocus={(e) => { 
                  e.currentTarget.style.border = '3px solid var(--color-primary)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '3px solid var(--color-border)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div>
              <label className="block font-black uppercase text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
                PASSWORD:
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                className="w-full px-4 py-3 font-bold focus:outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '3px solid var(--color-border)',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0 var(--color-border)'
                }}
                onFocus={(e) => { 
                  e.currentTarget.style.border = '3px solid var(--color-primary)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '3px solid var(--color-border)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 font-black uppercase text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: '4px solid var(--color-border)',
                borderRadius: '15px',
                boxShadow: isLoading ? '2px 2px 0 var(--color-border)' : '4px 4px 0 var(--color-border)',
                textShadow: '2px 2px 0 var(--color-border)',
                transform: isLoading ? 'scale(0.98)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.animation = 'kapow 0.3s ease-in-out';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.animation = '';
              }}
            >
              {isLoading ? '⏳ LOGGING IN...' : '⚡ LET\'S GO! ⚡'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-bold text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  soundManager.playClick();
                  onSwitchToRegister();
                }}
                className="font-black underline hover:scale-105 inline-block transition-transform"
                style={{ color: 'var(--color-primary)' }}
              >
                SIGN UP! 🚀
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
