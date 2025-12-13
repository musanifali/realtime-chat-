// client/src/components/Chat/MessageList.tsx

import React, { useEffect, useRef } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Message } from './Message';
import { ChatMessage } from '../../types';

interface MessageListProps {
  messages: ChatMessage[];
  username: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  username,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <ScrollArea.Root className="flex-1 overflow-hidden">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="p-4 space-y-4">
          {messages.map((msg) => (
            <Message 
              key={msg.id}
              message={msg}
              isOwn={msg.username === username || msg.type === 'private_sent'}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className="flex select-none touch-none p-1 transition-colors duration-150 ease-out data-[orientation=vertical]:w-4 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-4"
        style={{ backgroundColor: 'var(--color-accent)', border: '2px solid var(--color-border)' }}
        orientation="vertical"
      >
          <ScrollArea.Thumb className="flex-1 relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" style={{ backgroundColor: 'var(--color-primary)', border: '2px solid var(--color-border)', borderRadius: '8px' }} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
};
