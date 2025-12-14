// client/src/components/Chat/Message.tsx

import React, { useEffect, useState } from 'react';
import { ChatMessage } from '../../types';
import { formatTime } from '../../utils/messageUtils';
import { soundManager } from '../../services/SoundManager';
import { VoiceMessage } from '../VoiceMessage/VoiceMessage';
import { ReactionPicker } from '../MessageReactions/ReactionPicker';
import { FloatingReaction } from '../MessageReactions/FloatingReaction';
import { ReactionBadge } from '../MessageReactions/ReactionBadge';
import { ComicImageFrame } from '../GifSticker/ComicImageFrame';
import { Smile } from 'lucide-react';
import { SocketService } from '../../services/SocketService';

interface MessageProps {
  message: ChatMessage;
  isOwn: boolean;
  currentUsername: string;
  chatTargetUsername: string;
  socketService: SocketService | null;
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export const Message: React.FC<MessageProps> = ({ message, isOwn, currentUsername, chatTargetUsername, socketService }) => {
  const [justReceived, setJustReceived] = useState(!isOwn && message.type !== 'system');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);

  useEffect(() => {
    // Play receive sound and animate for received messages
    if (!isOwn && message.type !== 'system') {
      soundManager.playReceive();
      setJustReceived(true);
      setTimeout(() => setJustReceived(false), 600);
    }
  }, [isOwn, message.type]);

  useEffect(() => {
    if (!socketService) return;

    // Listen for reaction updates from socket
    const handleReactionUpdate = (data: { messageId: string; emoji: string; username: string; action: 'add' | 'remove' }) => {
      if (data.messageId !== message.id) return;

      const existingReaction = reactions.find(r => r.emoji === data.emoji);

      if (data.action === 'add') {
        if (existingReaction) {
          // Update existing reaction
          setReactions(reactions.map(r =>
            r.emoji === data.emoji && !r.users.includes(data.username)
              ? { ...r, count: r.count + 1, users: [...r.users, data.username] }
              : r
          ));
        } else {
          // Add new reaction
          setReactions([...reactions, { emoji: data.emoji, count: 1, users: [data.username] }]);
        }
        addFloatingEmoji(data.emoji);
      } else {
        // Remove reaction
        setReactions(reactions.map(r =>
          r.emoji === data.emoji
            ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== data.username) }
            : r
        ).filter(r => r.count > 0));
      }
    };

    socketService.onReaction(handleReactionUpdate);

    return () => {
      if (socketService) {
        socketService.off('message_reaction', handleReactionUpdate as any);
      }
    };
  }, [message.id, reactions, socketService]);

  const handleAddReaction = (emoji: string) => {
    if (!message.id || !chatTargetUsername || !socketService) return;

    const existingReaction = reactions.find(r => r.emoji === emoji);
    const hasReacted = existingReaction?.users.includes(currentUsername);

    // Emit socket event to sync reactions
    socketService.sendReaction(message.id, emoji, chatTargetUsername);

    // Optimistic UI update
    if (hasReacted) {
      // Remove reaction
      setReactions(reactions.map(r =>
        r.emoji === emoji
          ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== currentUsername) }
          : r
      ).filter(r => r.count > 0));
    } else {
      if (existingReaction) {
        // Add to existing reaction
        setReactions(reactions.map(r =>
          r.emoji === emoji
            ? { ...r, count: r.count + 1, users: [...r.users, currentUsername] }
            : r
        ));
      } else {
        // New reaction
        setReactions([...reactions, { emoji, count: 1, users: [currentUsername] }]);
      }
      addFloatingEmoji(emoji);
    }
    
    setShowReactionPicker(false);
  };

  const addFloatingEmoji = (emoji: string) => {
    const id = Date.now();
    setFloatingEmojis([...floatingEmojis, { id, emoji }]);
  };

  const removeFloatingEmoji = (id: number) => {
    setFloatingEmojis(floatingEmojis.filter(e => e.id !== id));
  };
  if (message.type === 'system') {
    return (
      <div className="flex justify-center animate-comic-pop">
        <div className="px-4 py-2 text-sm font-black uppercase bendots-bg comic-outline" 
          style={{ 
            backgroundColor: 'var(--color-accent)', 
            color: 'var(--color-text-primary)',
            border: '3px solid var(--color-border)',
            borderRadius: '20px',
            boxShadow: '3px 3px 0 var(--color-border)',
            transform: 'rotate(-1deg)'
          }}>
          ⚡ {message.text} ⚡
        </div>
      </div>
    );
  }

  const isPrivate = message.type === 'private_sent' || message.type === 'private_received';
  
  // Check if message is a voice message
  const isVoiceMessage = (message as any).voiceData;
  
  // Check if message is a GIF
  const gifMatch = message.text?.match(/\[GIF\]\s*(https?:\/\/[^\s]+)/);
  const isGif = !!gifMatch;
  const gifUrl = gifMatch?.[1];

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${justReceived ? 'animate-bounce' : 'animate-comic-pop'}`}>
      <div className="relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%]">
        <div 
          className={`${!isVoiceMessage && !isGif ? 'speech-bubble-tail px-4 py-3' : ''} relative`}
          style={{
            background: (isVoiceMessage || isGif) ? 'transparent' : (isOwn
              ? isPrivate
                ? 'var(--color-tertiary)'
                : 'var(--color-accent)'
              : 'white'),
            color: 'var(--color-text-primary)',
            border: (isVoiceMessage || isGif) ? 'none' : '3px solid var(--color-border)',
            borderRadius: (isVoiceMessage || isGif) ? '0' : '20px',
            boxShadow: (isVoiceMessage || isGif) ? 'none' : (isOwn ? '4px 4px 0 var(--color-border)' : '-4px 4px 0 var(--color-border)'),
            transform: (isVoiceMessage || isGif) ? 'none' : (isOwn ? 'rotate(1deg)' : 'rotate(-1deg)'),
            fontWeight: '700',
            padding: (isVoiceMessage || isGif) ? '0' : undefined
          }}
        >
          {!isOwn && message.username && !isVoiceMessage && (
            <div className="text-xs font-black mb-1 uppercase" style={{ color: 'var(--color-primary)', textShadow: '1px 1px 0 var(--color-border)' }}>
              {message.username}
            </div>
          )}
          {isVoiceMessage ? (
            <VoiceMessage 
              audioURL={(message as any).voiceData.audioURL}
              duration={(message as any).voiceData.duration}
              effect={(message as any).voiceData.effect}
              isOwn={isOwn}
            />
          ) : isGif && gifUrl ? (
            <ComicImageFrame src={gifUrl} alt="GIF" isOwn={isOwn} />
          ) : (
            <div className="break-words text-base">{message.text}</div>
          )}
          {!isVoiceMessage && !isGif && (
            <div 
              className="text-xs mt-1.5 flex items-center justify-between gap-2"
              style={{ 
                color: 'var(--color-text-secondary)',
                opacity: 0.8
              }}
            >
              <button
                onClick={() => {
                  setShowReactionPicker(!showReactionPicker);
                  soundManager.playClick();
                }}
                className="font-bold hover:scale-110 transition-transform"
                title="Add Reaction"
              >
                <Smile className="w-4 h-4" />
              </button>
              <span className="font-bold">{formatTime(message.timestamp)}</span>
            </div>
          )}
        </div>
        
        {/* Timestamp and reaction button for voice/GIF messages */}
        {(isVoiceMessage || isGif) && (
          <div 
            className="text-xs mt-1 flex items-center justify-between gap-2"
            style={{ 
              color: 'var(--color-text-secondary)',
              opacity: 0.8
            }}
          >
            <button
              onClick={() => {
                setShowReactionPicker(!showReactionPicker);
                soundManager.playClick();
              }}
              className="font-bold hover:scale-110 transition-transform"
              title="Add Reaction"
            >
              <Smile className="w-4 h-4" />
            </button>
            <span className="font-bold">{formatTime(message.timestamp)}</span>
          </div>
        )}

        {/* Reaction Picker */}
        {showReactionPicker && (
          <ReactionPicker
            onReact={handleAddReaction}
            onClose={() => setShowReactionPicker(false)}
            isOwn={isOwn}
          />
        )}

        {/* Reaction Badges */}
        {reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {reactions.map((reaction) => (
              <ReactionBadge
                key={reaction.emoji}
                emoji={reaction.emoji}
                count={reaction.count}
                hasReacted={reaction.users.includes(currentUsername)}
                onClick={() => handleAddReaction(reaction.emoji)}
              />
            ))}
          </div>
        )}

        {/* Floating Reactions */}
        {floatingEmojis.map((item) => (
          <FloatingReaction
            key={item.id}
            emoji={item.emoji}
            onComplete={() => removeFloatingEmoji(item.id)}
          />
        ))}
      </div>
    </div>
  );
};
