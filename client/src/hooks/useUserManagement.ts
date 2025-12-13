// client/src/hooks/useUserManagement.ts

import { useState, useCallback, useRef } from 'react';
import { soundManager } from '../services/SoundManager';

export const useUserManagement = () => {
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const previousUsersRef = useRef<Set<string>>(new Set());

  const updateUserList = useCallback((users: string[], currentUsername: string) => {
    const filteredUsers = users.filter(u => u !== currentUsername);
    const newUsersSet = new Set(filteredUsers);
    const previousUsers = previousUsersRef.current;
    
    // Detect new users (joined)
    filteredUsers.forEach(user => {
      if (!previousUsers.has(user)) {
        soundManager.play('swoosh-in');
      }
    });
    
    // Detect removed users (left)
    previousUsers.forEach(user => {
      if (!newUsersSet.has(user)) {
        soundManager.play('swoosh-out');
      }
    });
    
    previousUsersRef.current = newUsersSet;
    setAllUsers(filteredUsers);
  }, []);

  const clearUsers = useCallback(() => {
    setAllUsers([]);
  }, []);

  return {
    allUsers,
    updateUserList,
    clearUsers,
  };
};
