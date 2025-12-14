// client/src/components/Auth/Register.tsx

import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { soundManager } from '../../services/SoundManager';

interface RegisterProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
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

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.displayName) {
      setError('All fields are required!');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    soundManager.playClick();

    try {
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
      });

      soundManager.playSend();
      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="w-full max-w-md mx-auto p-8 animate-comic-pop"
      style={{
        backgroundColor: 'white',
        border: '4px solid var(--color-border)',
        borderRadius: '20px',
        boxShadow: '8px 8px 0 var(--color-border)',
        transform: 'rotate(-1deg)'
      }}
    >
      <h1 
        className="text-4xl font-black uppercase mb-2 text-center"
        style={{
          color: 'var(--color-primary)',
          textShadow: '3px 3px 0 var(--color-border)',
          WebkitTextStroke: '2px var(--color-border)'
        }}
      >
        💥 SIGN UP! 💥
      </h1>
      <p className="text-center font-bold mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        Create your account to join the chat!
      </p>

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
          <label className="block font-black uppercase text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="cooluser123"
            className="w-full px-4 py-3 font-bold focus:outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '3px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '3px 3px 0 var(--color-border)'
            }}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block font-black uppercase text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="cool@example.com"
            className="w-full px-4 py-3 font-bold focus:outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '3px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '3px 3px 0 var(--color-border)'
            }}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block font-black uppercase text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Display Name
          </label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            placeholder="Cool User"
            className="w-full px-4 py-3 font-bold focus:outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '3px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '3px 3px 0 var(--color-border)'
            }}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block font-black uppercase text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            className="w-full px-4 py-3 font-bold focus:outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '3px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '3px 3px 0 var(--color-border)'
            }}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block font-black uppercase text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••"
            className="w-full px-4 py-3 font-bold focus:outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '3px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '3px 3px 0 var(--color-border)'
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
            boxShadow: '4px 4px 0 var(--color-border)',
            textShadow: '2px 2px 0 var(--color-border)'
          }}
        >
          {isLoading ? '⏳ CREATING...' : '🚀 CREATE ACCOUNT!'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="font-bold text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <button
            onClick={() => {
              soundManager.playClick();
              onSwitchToLogin();
            }}
            className="font-black underline hover:scale-105 inline-block transition-transform"
            style={{ color: 'var(--color-primary)' }}
          >
            LOGIN HERE! ⚡
          </button>
        </p>
      </div>
    </div>
  );
};
