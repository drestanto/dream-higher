// Sound manager for pre-loaded audio
class SoundManager {
  constructor() {
    this.sounds = {};
    this.muted = false;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Pre-load sounds using Web Audio API
    const soundFiles = {
      scanOut: '/sounds/beep-high.mp3',
      scanIn: '/sounds/beep-low.mp3',
      error: '/sounds/error.mp3',
      complete: '/sounds/complete.mp3',
    };

    // Create audio elements for each sound
    for (const [name, url] of Object.entries(soundFiles)) {
      try {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.sounds[name] = audio;
      } catch (error) {
        console.warn(`Failed to load sound: ${name}`, error);
      }
    }

    this.initialized = true;
  }

  play(soundName) {
    if (this.muted) return;

    const audio = this.sounds[soundName];
    if (audio) {
      // Clone and play to allow overlapping sounds
      const clone = audio.cloneNode();
      clone.volume = 0.5;
      clone.play().catch((e) => console.warn('Sound play failed:', e));
    }
  }

  playUrl(url) {
    if (this.muted || !url) return;

    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.play().catch((e) => console.warn('Sound play failed:', e));
    return audio;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setMuted(muted) {
    this.muted = muted;
  }
}

export const soundManager = new SoundManager();

// Generate beep sounds as base64 data URLs (fallback if mp3 files don't exist)
export function generateBeepSound(frequency = 800, duration = 0.1) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Simple beep function using Web Audio API
export function beep(type = 'scanOut') {
  const frequencies = {
    scanOut: 880,  // Higher pitch for selling
    scanIn: 440,   // Lower pitch for buying
    error: 200,    // Low error sound
    complete: 660, // Success sound
  };

  const frequency = frequencies[type] || 800;

  try {
    generateBeepSound(frequency, 0.15);
  } catch (error) {
    console.warn('Beep failed:', error);
  }
}

export default soundManager;
