// client/src/services/SoundManager.ts

export type SoundType = 
  | 'whoosh'
  | 'pop'
  | 'click'
  | 'tick'
  | 'tap'
  | 'swoosh-in'
  | 'swoosh-out'
  | 'kapow'
  | 'bam'
  | 'zap';

class SoundManagerClass {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.3;
  private isTypingSoundPlaying: boolean = false;
  private typingInterval: number | null = null;

  constructor() {
    this.loadSettings();
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private loadSettings() {
    const muted = localStorage.getItem('sound-muted');
    const vol = localStorage.getItem('sound-volume');
    
    if (muted !== null) {
      this.isMuted = muted === 'true';
    }
    if (vol !== null) {
      this.volume = parseFloat(vol);
    }
  }

  private saveSettings() {
    localStorage.setItem('sound-muted', String(this.isMuted));
    localStorage.setItem('sound-volume', String(this.volume));
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    this.saveSettings();
  }

  getVolume(): number {
    return this.volume;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.saveSettings();
    return this.isMuted;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    this.saveSettings();
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }

  play(soundType: SoundType, pitch: number = 1) {
    if (this.isMuted || this.volume === 0) return;

    try {
      const ctx = this.initAudioContext();
      
      switch (soundType) {
        case 'whoosh':
          this.playWhoosh(ctx, pitch);
          break;
        case 'pop':
          this.playPop(ctx);
          break;
        case 'click':
          this.playClick(ctx);
          break;
        case 'tick':
          this.playTick(ctx);
          break;
        case 'tap':
          this.playTap(ctx);
          break;
        case 'swoosh-in':
          this.playSwooshIn(ctx);
          break;
        case 'swoosh-out':
          this.playSwooshOut(ctx);
          break;
        case 'kapow':
          this.playKapow(ctx);
          break;
        case 'bam':
          this.playBam(ctx);
          break;
        case 'zap':
          this.playZap(ctx);
          break;
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  private playWhoosh(ctx: AudioContext, pitch: number) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Swoosh sound with pitch variation based on message length
    const basePitch = 200 * pitch;
    oscillator.frequency.setValueAtTime(basePitch * 2, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(basePitch * 0.5, ctx.currentTime + 0.15);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.type = 'sawtooth';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  private playPop(ctx: AudioContext) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Quick pop sound
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    oscillator.type = 'sine';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  }

  private playClick(ctx: AudioContext) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sharp click
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);

    gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

    oscillator.type = 'square';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.03);
  }

  private playTick(ctx: AudioContext) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Light keyboard tick
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.02);

    oscillator.type = 'square';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.02);
  }

  private playTap(ctx: AudioContext) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Occasional tap while typing
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

    oscillator.type = 'triangle';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.04);
  }

  private playSwooshIn(ctx: AudioContext) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Rising tone entrance
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(this.volume * 0.4, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.type = 'sawtooth';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  private playSwooshOut(ctx: AudioContext) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Falling tone exit
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.type = 'sawtooth';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  private playKapow(ctx: AudioContext) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Deep explosion
    oscillator.frequency.setValueAtTime(100, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(this.volume * 0.7, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.type = 'sawtooth';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }

  private playBam(ctx: AudioContext) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Quick punch
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.type = 'square';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  private playZap(ctx: AudioContext) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Electric zap
    oscillator.frequency.setValueAtTime(3000, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.06);

    gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

    oscillator.type = 'square';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.06);
  }

  // Typing sound loop
  startTypingSound() {
    if (this.isTypingSoundPlaying || this.isMuted) return;
    
    this.isTypingSoundPlaying = true;
    
    // Initial tick
    this.play('tick');
    
    // Continue with occasional taps
    this.typingInterval = window.setInterval(() => {
      if (!this.isTypingSoundPlaying) {
        if (this.typingInterval) {
          clearInterval(this.typingInterval);
          this.typingInterval = null;
        }
        return;
      }
      
      // Random tap sounds while typing
      if (Math.random() > 0.7) {
        this.play('tap');
      } else {
        this.play('tick');
      }
    }, 100);
  }

  stopTypingSound() {
    this.isTypingSoundPlaying = false;
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
  }
}

export const soundManager = new SoundManagerClass();
