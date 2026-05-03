/* ============================================================
   audio.js — Gestion sons via Web Audio API (procédural)
   Pas de fichiers externes requis
   ============================================================ */

class AudioManager {
  constructor() {
    this._ctx = null;
    this._musicNode = null;
    this._musicGain = null;
    this._sfxGain = null;
    this._masterGain = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.volMusic = 0.4;
    this.volSfx = 0.7;
    this._musicPlaying = false;
    this._musicInterval = null;
  }

  _init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();

    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 1;
    this._masterGain.connect(this._ctx.destination);

    this._sfxGain = this._ctx.createGain();
    this._sfxGain.gain.value = this.volSfx;
    this._sfxGain.connect(this._masterGain);

    this._musicGain = this._ctx.createGain();
    this._musicGain.gain.value = this.volMusic;
    this._musicGain.connect(this._masterGain);
  }

  _resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  /* --- Tone helper ---------------------------------------- */
  _tone(freq, type, duration, gain, dest, delay = 0) {
    const ctx = this._ctx;
    const t = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(env);
    env.connect(dest);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  /* --- SFX: manger un fruit ------------------------------- */
  playEat() {
    if (!this.enabled) return;
    this._init(); this._resume();
    const dest = this._sfxGain;
    this._tone(440, 'sine', 0.08, 0.4, dest);
    this._tone(660, 'sine', 0.08, 0.3, dest, 0.05);
  }

  /* --- SFX: game over ------------------------------------- */
  playGameOver() {
    if (!this.enabled) return;
    this._init(); this._resume();
    const dest = this._sfxGain;
    this._tone(320, 'sawtooth', 0.15, 0.3, dest);
    this._tone(240, 'sawtooth', 0.15, 0.25, dest, 0.12);
    this._tone(160, 'sawtooth', 0.3,  0.2,  dest, 0.24);
  }

  /* --- SFX: power-up obtenu ------------------------------- */
  playPowerUp() {
    if (!this.enabled) return;
    this._init(); this._resume();
    const dest = this._sfxGain;
    this._tone(523, 'sine', 0.1, 0.35, dest);
    this._tone(659, 'sine', 0.1, 0.3,  dest, 0.09);
    this._tone(784, 'sine', 0.12, 0.25, dest, 0.18);
  }

  /* --- SFX: power-up expiré ------------------------------- */
  playPowerUpExpired() {
    if (!this.enabled) return;
    this._init(); this._resume();
    const dest = this._sfxGain;
    this._tone(400, 'triangle', 0.08, 0.2, dest);
    this._tone(300, 'triangle', 0.12, 0.15, dest, 0.07);
  }

  /* --- SFX: nouveau record -------------------------------- */
  playNewRecord() {
    if (!this.enabled) return;
    this._init(); this._resume();
    const dest = this._sfxGain;
    [523, 659, 784, 1047].forEach((f, i) => {
      this._tone(f, 'sine', 0.15, 0.3, dest, i * 0.1);
    });
  }

  /* --- Musique de fond (procédurale) ---------------------- */
  startMusic() {
    if (!this.musicEnabled || this._musicPlaying) return;
    this._init();
    this._musicPlaying = true;
    this._playMusicLoop();
  }

  _playMusicLoop() {
    if (!this._musicPlaying || !this.musicEnabled) return;
    const ctx = this._ctx;
    if (!ctx) return;

    // Sequence mélodique simple 8 notes
    const notes = [262, 294, 330, 349, 392, 349, 330, 294];
    const noteLen = 0.22;
    const totalLen = notes.length * noteLen;

    notes.forEach((freq, i) => {
      this._tone(freq, 'triangle', noteLen * 0.8, 0.18, this._musicGain, i * noteLen);
    });

    // Basse
    [130, 130, 146, 130].forEach((freq, i) => {
      this._tone(freq, 'sine', noteLen * 1.8, 0.12, this._musicGain, i * noteLen * 2);
    });

    this._musicInterval = setTimeout(() => this._playMusicLoop(), totalLen * 1000 + 100);
  }

  stopMusic() {
    this._musicPlaying = false;
    if (this._musicInterval) {
      clearTimeout(this._musicInterval);
      this._musicInterval = null;
    }
  }

  /* --- Toggle --------------------------------------------- */
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopMusic();
    else if (this.musicEnabled) this.startMusic();
    return this.enabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) this.startMusic();
    else this.stopMusic();
    return this.musicEnabled;
  }

  setVolMusic(v) {
    this.volMusic = v;
    if (this._musicGain) this._musicGain.gain.value = v;
  }

  setVolSfx(v) {
    this.volSfx = v;
    if (this._sfxGain) this._sfxGain.gain.value = v;
  }
}

const audioManager = new AudioManager();
