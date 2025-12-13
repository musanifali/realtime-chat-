// client/src/hooks/useTypingIndicator.ts

import { useState, useEffect, useCallback } from 'react';
import { SocketService } from '../services/SocketService';

export const useTypingIndicator = (socketService: SocketService | null, currentRoom: string | null) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);

  useEffect(() => {
    if (!socketService) return;

    const handleTypingStart = (data: { username: string; room: string }) => {
      if (data.room === currentRoom) {
        setTypingUsers(prev => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      }
    };

    const handleTypingStop = (data: { username: string; room: string }) => {
      if (data.room === currentRoom) {
        setTypingUsers(prev => prev.filter(user => user !== data.username));
      }
    };

    socketService.onTypingStart(handleTypingStart);
    socketService.onTypingStop(handleTypingStop);

    return () => {
      // Cleanup if needed
    };
  }, [socketService, currentRoom]);

  const notifyTyping = useCallback(() => {
    if (!socketService || !currentRoom) return;

    socketService.sendTypingStart(currentRoom);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      socketService.sendTypingStop(currentRoom);
    }, 3000);

    setTypingTimeout(timeout);
  }, [socketService, currentRoom, typingTimeout]);

  return { typingUsers, notifyTyping };
};
