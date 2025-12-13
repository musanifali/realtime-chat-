// client/src/components/ThemeToggle/ThemeToggle.tsx

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 transition-all duration-200 animate-comic-shake"
      style={{ 
        background: theme === 'light' ? 'var(--color-secondary)' : 'var(--color-accent)', 
        border: '3px solid var(--color-border)',
        boxShadow: '3px 3px 0 var(--color-border)',
        borderRadius: '50%',
        color: theme === 'light' ? 'white' : 'var(--color-text-on-yellow)'
      }}
      onMouseEnter={(e) => { 
        e.currentTarget.style.transform = 'rotate(15deg) scale(1.1)'; 
        e.currentTarget.style.animation = 'comic-shake 0.3s ease-in-out';
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.transform = 'rotate(0deg) scale(1)'; 
        e.currentTarget.style.animation = '';
      }}
      title={theme === 'light' ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
};
