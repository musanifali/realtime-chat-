// client/src/hooks/useTypingIndicator.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { SocketService } from '../services/SocketService';

export const useTypingIndicator = (socketService: SocketService | null, currentUser: string | null) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!socketService) return;

    const handleTypingStart = (data: { username: string }) => {
      console.log('Typing start received from:', data.username);
      if (data.username === currentUser) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = (data: { username: string }) => {
      console.log('Typing stop received from:', data.username);
      if (data.username === currentUser) {
        setIsTyping(false);
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
  }, [socketService, currentUser]);

  const notifyTyping = useCallback(() => {
    if (!socketService || !currentUser) return;

    console.log('Sending typing start to user:', currentUser);
    socketService.sendTypingStart(currentUser);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      console.log('Sending typing stop to user:', currentUser);
      socketService.sendTypingStop(currentUser);
      typingTimeoutRef.current = null;
      setIsTyping(false);
    }, 3000);
  }, [socketService, currentUser]);
  
  const stopTyping = useCallback(() => {
    if (!socketService || !currentUser) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    console.log('Sending typing stop to user:', currentUser);
    socketService.sendTypingStop(currentUser);
    setIsTyping(false);
  }, [socketService, currentUser]);

  return { isTyping, notifyTyping, stopTyping };
};
