// client/src/components/VoiceMessage/VoiceMessage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';

interface VoiceMessageProps {
  audioURL: string;
  duration: number;
  effect?: 'normal' | 'robot' | 'echo' | 'chipmunk';
  isOwn: boolean;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ 
  audioURL, 
  duration, 
  effect = 'normal',
  isOwn 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(15).fill(0.3));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    // Generate random waveform for visualization
    const randomWaveform = Array(15).fill(0).map(() => 0.2 + Math.random() * 0.8);
    setWaveform(randomWaveform);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const applyVoiceEffect = (audioContext: AudioContext, source: MediaElementAudioSourceNode) => {
    const destination = audioContext.destination;

    switch (effect) {
      case 'robot': {
        // Robot effect: bit crusher + distortion
        const waveshaper = audioContext.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1;
          curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.5);
        }
        waveshaper.curve = curve;
        
        source.connect(waveshaper);
        waveshaper.connect(destination);
        break;
      }
      
      case 'echo': {
        // Echo effect
        const delay = audioContext.createDelay();
        const feedback = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        delay.delayTime.value = 0.3;
        feedback.gain.value = 0.4;
        filter.frequency.value = 1000;
        
        source.connect(filter);
        filter.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        filter.connect(destination);
        delay.connect(destination);
        break;
      }
      
      case 'chipmunk': {
        // Chipmunk effect: speed up playback
        if (audioRef.current) {
          audioRef.current.playbackRate = 1.5;
        }
        source.connect(destination);
        break;
      }
      
      default:
        source.connect(destination);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioURL);
      
      // Setup audio context for effects
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(audioRef.current);
      
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      
      applyVoiceEffect(audioContext, source);

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
    }
    
    soundManager.playClick();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg max-w-xs"
      style={{
        backgroundColor: isOwn ? 'var(--color-accent)' : 'white',
        border: '2px solid var(--color-border)',
        boxShadow: '2px 2px 0 var(--color-border)'
      }}
    >
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          border: '2px solid var(--color-border)',
          boxShadow: '2px 2px 0 var(--color-border)'
        }}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>

      {/* Waveform & Progress */}
      <div className="flex-1">
        {/* Waveform */}
        <div className="flex items-center justify-center gap-0.5 h-8 mb-1">
          {waveform.map((value, i) => {
            const isActive = (i / waveform.length) * 100 <= progress;
            const height = value * 100;
            
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-200"
                style={{
                  height: `${height}%`,
                  backgroundColor: isActive 
                    ? 'var(--color-primary)' 
                    : 'var(--color-border)',
                  opacity: isActive ? 1 : 0.3,
                  border: '1px solid var(--color-border)',
                  transform: isPlaying && isActive ? `scaleY(${0.8 + Math.random() * 0.4})` : 'scaleY(1)'
                }}
              />
            );
          })}
        </div>

        {/* Time & Effect */}
        <div className="flex items-center justify-between text-xs font-bold">
          <span>{formatTime(currentTime)}</span>
          <span className="text-xs">
            {effect === 'robot' && '🤖'}
            {effect === 'echo' && '🔊'}
            {effect === 'chipmunk' && '🐿️'}
            {effect === 'normal' && '🎵'}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
