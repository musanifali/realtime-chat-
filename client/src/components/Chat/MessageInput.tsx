// client/src/components/Chat/MessageInput.tsx

import React, { useState } from 'react';
import { ChatTarget } from '../../types';
import { Send, Mic, Sticker } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';
import { VoiceRecorder, VoiceEffect } from '../VoiceRecorder/VoiceRecorder';
import { ComicStickers } from '../GifSticker/ComicStickers';
import { GifSearch } from '../GifSticker/GifSearch';

interface MessageInputProps {
  chatTarget: ChatTarget;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onSendVoice?: (audioBlob: Blob, duration: number, effect?: VoiceEffect) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  chatTarget,
  input,
  onInputChange,
  onSendMessage,
  onSendVoice,
  onKeyPress,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e.target.value);
  };

  const handleSendClick = async () => {
    if (input.trim() && !isSending) {
      setIsSending(true);
      soundManager.playSend();
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 150));
      
      onSendMessage();
      setIsSending(false);
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim() && !isSending) {
      setIsSending(true);
      soundManager.playSend();
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    onKeyPress(e);
    if (e.key === 'Enter') {
      setIsSending(false);
    }
  };

  const handleSendVoice = (audioBlob: Blob, duration: number, effect?: VoiceEffect) => {
    if (onSendVoice) {
      onSendVoice(audioBlob, duration, effect);
      setShowVoiceRecorder(false);
    }
  };

  const handleStickerSelect = (text: string) => {
    onInputChange(text);
    setShowStickerPicker(false);
    // Auto-send sticker
    setTimeout(() => {
      if (!isSending) {
        setIsSending(true);
        soundManager.playSend();
        setTimeout(() => {
          onSendMessage();
          setIsSending(false);
        }, 150);
      }
    }, 100);
  };

  const handleGifSelect = (gifUrl: string) => {
    onInputChange(`[GIF] ${gifUrl}`);
    setShowGifPicker(false);
    // Auto-send GIF
    setTimeout(() => {
      if (!isSending) {
        setIsSending(true);
        soundManager.playSend();
        setTimeout(() => {
          onSendMessage();
          setIsSending(false);
        }, 150);
      }
    }, 100);
  };

  return (
    <div className="p-3 md:p-4 halftone-bg relative" style={{ backgroundColor: 'var(--color-bg-primary)', borderTop: '4px solid var(--color-border)', boxShadow: '0 -4px 0 var(--color-accent)' }}>
      {showVoiceRecorder && (
        <VoiceRecorder 
          onSendVoice={handleSendVoice}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}
      
      {/* Sticker/GIF Picker Modal */}
      {(showStickerPicker || showGifPicker) && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 md:mx-4 rounded-lg overflow-hidden animate-comic-pop"
          style={{
            backgroundColor: 'white',
            border: '3px solid var(--color-border)',
            boxShadow: '4px 4px 0 var(--color-border)',
            maxHeight: '400px'
          }}>
          {/* Tab Buttons */}
          <div className="flex border-b-3 border-border">
            <button
              onClick={() => {
                setShowStickerPicker(true);
                setShowGifPicker(false);
                soundManager.playClick();
              }}
              className="flex-1 px-4 py-2 font-black uppercase text-sm transition-all"
              style={{
                backgroundColor: showStickerPicker ? 'var(--color-accent)' : 'white',
                borderRight: '3px solid var(--color-border)'
              }}
            >
              💥 STICKERS
            </button>
            <button
              onClick={() => {
                setShowStickerPicker(false);
                setShowGifPicker(true);
                soundManager.playClick();
              }}
              className="flex-1 px-4 py-2 font-black uppercase text-sm transition-all"
              style={{
                backgroundColor: showGifPicker ? 'var(--color-accent)' : 'white'
              }}
            >
              🎬 GIFS
            </button>
          </div>
          
          {showStickerPicker && (
            <ComicStickers
              onSelect={handleStickerSelect}
              onClose={() => setShowStickerPicker(false)}
            />
          )}
          {showGifPicker && (
            <GifSearch
              onSelect={handleGifSelect}
              onClose={() => setShowGifPicker(false)}
            />
          )}
        </div>
      )}

      <div className="flex gap-2 md:gap-3">
        <button
          onClick={() => {
            setShowVoiceRecorder(!showVoiceRecorder);
            if (showVoiceRecorder) {
              setShowStickerPicker(false);
              setShowGifPicker(false);
            }
            soundManager.playClick();
          }}
          className="px-3 py-2 md:py-3 transition-all hover:scale-110"
          style={{
            backgroundColor: showVoiceRecorder ? 'var(--color-primary)' : 'var(--color-accent)',
            color: showVoiceRecorder ? 'white' : 'var(--color-text-primary)',
            border: '3px solid var(--color-border)',
            boxShadow: '3px 3px 0 var(--color-border)',
            borderRadius: '12px'
          }}
          title="Voice Message"
        >
          <Mic className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setShowStickerPicker(!showStickerPicker);
            if (!showStickerPicker) {
              setShowVoiceRecorder(false);
            }
            soundManager.playClick();
          }}
          className="px-3 py-2 md:py-3 transition-all hover:scale-110"
          style={{
            backgroundColor: (showStickerPicker || showGifPicker) ? 'var(--color-primary)' : 'var(--color-accent)',
            color: (showStickerPicker || showGifPicker) ? 'white' : 'var(--color-text-primary)',
            border: '3px solid var(--color-border)',
            boxShadow: '3px 3px 0 var(--color-border)',
            borderRadius: '12px'
          }}
          title="Stickers & GIFs"
        >
          <Sticker className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={`💬 @${chatTarget.username}...`}
          className="flex-1 px-3 md:px-4 py-2 md:py-3 focus:outline-none comic-outline font-bold text-sm md:text-base"
          style={{ 
            backgroundColor: 'white', 
            border: '3px solid var(--color-border)', 
            color: 'var(--color-text-primary)',
            boxShadow: '3px 3px 0 var(--color-border)',
            borderRadius: '15px',
            transform: 'rotate(-0.5deg)'
          }}
          onFocus={(e) => { 
            e.currentTarget.style.borderColor = 'var(--color-primary)'; 
            e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'rotate(-0.5deg) scale(1)';
          }}
        />
        <button
          onClick={handleSendClick}
          disabled={!input.trim() || isSending}
          className={`px-3 md:px-6 py-2 md:py-3 disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center gap-1 md:gap-2 font-black uppercase text-sm md:text-base ${isSending ? 'animate-pulse' : ''}`}
          style={{ 
            background: input.trim() && !isSending ? 'var(--color-primary)' : '#9ca3af',
            color: 'white',
            border: '4px solid var(--color-border)',
            boxShadow: isSending ? '2px 2px 0 var(--color-border)' : '4px 4px 0 var(--color-border)',
            borderRadius: '15px',
            transform: isSending ? 'rotate(1deg) scale(0.95)' : 'rotate(1deg)',
            textShadow: '2px 2px 0 var(--color-border)'
          }}
          onMouseEnter={(e) => { 
            if (input.trim() && !isSending) {
              e.currentTarget.style.animation = 'kapow 0.3s ease-in-out';
              e.currentTarget.style.transform = 'rotate(1deg) scale(1.05)';
            }
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.animation = '';
            e.currentTarget.style.transform = isSending ? 'rotate(1deg) scale(0.95)' : 'rotate(1deg) scale(1)';
          }}
        >
          {isSending ? <span className="text-xl">✓</span> : <Send className="w-5 h-5" />}
          <span className="hidden sm:inline">{isSending ? 'SENT!' : '⚡ ZAP!'}</span>
          <span className="sm:hidden">{isSending ? '✓' : '⚡'}</span>
        </button>
      </div>
    </div>
  );
};
