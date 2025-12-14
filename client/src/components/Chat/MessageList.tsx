// client/src/components/Chat/MessageList.tsx

import React, { useEffect, useRef } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Message } from './Message';
import { ChatMessage } from '../../types';
import { SocketService } from '../../services/SocketService';

interface MessageListProps {
  messages: ChatMessage[];
  username: string;
  chatTargetUsername?: string;
  socketService: SocketService | null;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  username,
  chatTargetUsername = '',
  socketService,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <ScrollArea.Root className="flex-1 overflow-hidden">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((msg) => (
            <Message 
              key={msg.id}
              message={msg}
              isOwn={msg.username === username || msg.type === 'private_sent'}
              currentUsername={username}
              chatTargetUsername={chatTargetUsername}
              socketService={socketService}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea.Viewport>
      {/* Scrollbar hidden but functionality preserved */}
      <ScrollArea.Scrollbar
        className="hidden"
        orientation="vertical"
      >
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
};
