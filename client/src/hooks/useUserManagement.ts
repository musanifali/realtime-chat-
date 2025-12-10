// client/src/hooks/useUserManagement.ts

import { useState, useCallback } from 'react';

export const useUserManagement = () => {
  const [allUsers, setAllUsers] = useState<string[]>([]);

  const updateUserList = useCallback((users: string[], currentUsername: string) => {
    setAllUsers(users.filter(u => u !== currentUsername));
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
