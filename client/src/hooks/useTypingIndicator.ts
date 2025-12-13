// client/src/hooks/useTypingIndicator.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { SocketService } from '../services/SocketService';

export const useTypingIndicator = (socketService: SocketService | null, currentRoom: string | null) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socketService) return;

    const handleTypingStart = (data: { username: string; room: string }) => {
      console.log('Typing start received:', data);
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
      console.log('Typing stop received:', data);
      if (data.room === currentRoom) {
        setTypingUsers(prev => prev.filter(user => user !== data.username));
      }
    };

    socketService.onTypingStart(handleTypingStart);
    socketService.onTypingStop(handleTypingStop);

    return () => {
      // Clean up timeout on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socketService, currentRoom]);

  const notifyTyping = useCallback(() => {
    if (!socketService || !currentRoom) return;

    console.log('Sending typing start to room:', currentRoom);
    socketService.sendTypingStart(currentRoom);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      console.log('Sending typing stop to room:', currentRoom);
      socketService.sendTypingStop(currentRoom);
      typingTimeoutRef.current = null;
    }, 3000);
  }, [socketService, currentRoom]);

  return { typingUsers, notifyTyping };
};
