// client/src/components/Auth/AuthContainer.tsx

import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { Register } from './Register';

interface AuthContainerProps {
  onAuthSuccess: () => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthSuccess }) => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <>
      {showLogin ? (
        <LoginForm
          onSuccess={onAuthSuccess}
          onSwitchToRegister={() => setShowLogin(false)}
        />
      ) : (
        <Register
          onSuccess={onAuthSuccess}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      )}
    </>
  );
};
