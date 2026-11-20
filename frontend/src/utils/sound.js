class SoundFX {
  constructor() {
    this.muted = localStorage.getItem('qb_muted') === 'true';
    this.ctx = null;
  }

  getContext() {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('qb_muted', String(this.muted));
    return this.muted;
  }

  playTone(freq, duration = 0.12, type = 'square', delay = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  click() {
    this.playTone(520, 0.06, 'square');
  }

  correct() {
    this.playTone(523.25, 0.1, 'triangle', 0);
    this.playTone(659.25, 0.1, 'triangle', 0.09);
    this.playTone(783.99, 0.2, 'triangle', 0.18);
  }

  wrong() {
    this.playTone(220, 0.14, 'sawtooth', 0);
    this.playTone(165, 0.22, 'sawtooth', 0.14);
  }

  tick() {
    this.playTone(880, 0.04, 'square', 0);
  }

  podium() {
    [523, 659, 784, 1046].forEach((f, i) => this.playTone(f, 0.16, 'triangle', i * 0.12));
  }
}

export const soundFX = new SoundFX();
