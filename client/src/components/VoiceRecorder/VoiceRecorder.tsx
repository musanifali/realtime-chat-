// client/src/components/VoiceRecorder/VoiceRecorder.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, duration: number, effect?: VoiceEffect) => void;
  onClose: () => void;
}

export type VoiceEffect = 'normal' | 'robot' | 'echo' | 'chipmunk';

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<VoiceEffect>('normal');
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      soundManager.playClick();

      // Start timer
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start waveform animation
      visualizeAudio();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please grant permission.');
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const animate = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Sample every few values to get 20 bars
      const step = Math.floor(dataArray.length / 20);
      const newWaveform = Array(20).fill(0).map((_, i) => {
        const index = i * step;
        return dataArray[index] / 255;
      });
      
      setWaveform(newWaveform);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      soundManager.playClick();
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioURL);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
    soundManager.playClick();
  };

  const deleteRecording = () => {
    setAudioURL('');
    setDuration(0);
    audioChunksRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    soundManager.playClick();
  };

  const sendVoiceMessage = () => {
    if (audioURL && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onSendVoice(audioBlob, duration, selectedEffect);
      soundManager.playSend();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="comic-outline p-4 mb-3 animate-comic-pop" style={{
      backgroundColor: 'var(--color-surface)',
      border: '3px solid var(--color-border)',
      borderRadius: '15px',
      boxShadow: '4px 4px 0 var(--color-border)'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black uppercase text-sm" style={{ color: 'var(--color-primary)' }}>
          🎤 VOICE MESSAGE
        </h3>
        <button
          onClick={onClose}
          className="text-xs font-bold px-2 py-1 rounded"
          style={{ border: '2px solid var(--color-border)' }}
        >
          ✕
        </button>
      </div>

      {/* Waveform Visualization */}
      <div className="flex items-center justify-center gap-1 h-24 mb-3 p-3 rounded-lg" style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '2px solid var(--color-border)'
      }}>
        {waveform.map((value, i) => {
          const height = isRecording ? Math.max(10, value * 80) : (audioURL ? 30 : 10);
          const color = isRecording 
            ? 'var(--color-primary)' 
            : (audioURL ? 'var(--color-tertiary)' : 'var(--color-border)');
          
          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-100"
              style={{
                height: `${height}px`,
                backgroundColor: color,
                border: '1px solid var(--color-border)',
                transform: isRecording ? `scaleY(${0.5 + value})` : 'scaleY(1)'
              }}
            />
          );
        })}
      </div>

      {/* Timer */}
      <div className="text-center mb-3 font-black text-2xl" style={{
        color: isRecording ? 'var(--color-primary)' : 'var(--color-text-primary)'
      }}>
        {formatTime(duration)}
      </div>

      {/* Voice Effects */}
      {audioURL && (
        <div className="mb-3">
          <p className="text-xs font-bold mb-2 uppercase">VOICE EFFECTS:</p>
          <div className="flex gap-2">
            {(['normal', 'robot', 'echo', 'chipmunk'] as VoiceEffect[]).map(effect => (
              <button
                key={effect}
                onClick={() => {
                  setSelectedEffect(effect);
                  soundManager.playClick();
                }}
                className="flex-1 px-2 py-1 text-xs font-bold uppercase rounded transition-all"
                style={{
                  backgroundColor: selectedEffect === effect ? 'var(--color-accent)' : 'white',
                  border: '2px solid var(--color-border)',
                  boxShadow: selectedEffect === effect ? '2px 2px 0 var(--color-border)' : 'none',
                  transform: selectedEffect === effect ? 'rotate(-1deg)' : 'none'
                }}
              >
                {effect === 'normal' && '🎵'}
                {effect === 'robot' && '🤖'}
                {effect === 'echo' && '🔊'}
                {effect === 'chipmunk' && '🐿️'}
                <br />
                {effect}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!audioURL ? (
          <>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 font-black uppercase rounded-lg transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: '3px solid var(--color-border)',
                  boxShadow: '3px 3px 0 var(--color-border)'
                }}
              >
                <Mic className="w-5 h-5" />
                REC
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 font-black uppercase rounded-lg transition-all hover:scale-105 animate-pulse"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: '3px solid var(--color-border)',
                  boxShadow: '3px 3px 0 var(--color-border)'
                }}
              >
                <Square className="w-5 h-5" />
                STOP
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={togglePlayback}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 font-black uppercase rounded-lg transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-secondary)',
                color: 'white',
                border: '3px solid var(--color-border)',
                boxShadow: '3px 3px 0 var(--color-border)'
              }}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={deleteRecording}
              className="px-4 py-2 font-black uppercase rounded-lg transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-error)',
                color: 'white',
                border: '3px solid var(--color-border)',
                boxShadow: '3px 3px 0 var(--color-border)'
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={sendVoiceMessage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 font-black uppercase rounded-lg transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-primary)',
                border: '3px solid var(--color-border)',
                boxShadow: '3px 3px 0 var(--color-border)'
              }}
            >
              <Send className="w-4 h-4" />
              ZAP!
            </button>
          </>
        )}
      </div>
    </div>
  );
};
