// client/src/services/SoundManager.ts
import { Howl } from 'howler';

export type SoundType = 
  | 'send'
  | 'receive'
  | 'click'
  | 'user-join'
  | 'user-leave';

class SoundManagerClass {
  private sounds: Map<SoundType, Howl> = new Map();
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    this.loadSettings();
    this.initSounds();
  }

  private initSounds() {
    // Using real sound effects - comic book style sounds
    // These are free sound effects that match the pop art theme
    
    // Send message - whoosh/swoosh sound
    this.sounds.set('send', new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'],
      volume: this.volume * 0.3,
      html5: true,
      pool: 3 // Increase audio pool size
    }));

    // Receive message - notification pop
    this.sounds.set('receive', new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'],
      volume: this.volume * 0.4,
      html5: true,
      pool: 3
    }));

    // Click - button click
    this.sounds.set('click', new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
      volume: this.volume * 0.3,
      html5: true,
      pool: 3
    }));

    // User join - positive notification
    this.sounds.set('user-join', new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'],
      volume: this.volume * 0.4,
      html5: true,
      pool: 3
    }));

    // User leave - subtle notification
    this.sounds.set('user-leave', new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3'],
      volume: this.volume * 0.3,
      html5: true,
      pool: 3
    }));
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
    this.sounds.forEach(sound => sound.volume(this.volume * 0.5));
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

  play(soundType: SoundType) {
    if (this.isMuted) return;

    const sound = this.sounds.get(soundType);
    if (sound) {
      sound.play();
    }
  }

  // Convenient methods
  playSend() { this.play('send'); }
  playReceive() { this.play('receive'); }
  playClick() { this.play('click'); }
  playUserJoin() { this.play('user-join'); }
  playUserLeave() { this.play('user-leave'); }
}

export const soundManager = new SoundManagerClass();
