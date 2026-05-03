/* ============================================================
   ui.js — Gestion UI : menus, leaderboard, settings, controls
   ============================================================ */

const STORAGE_KEY = 'snake_scores';
const SETTINGS_KEY = 'snake_settings';

/* --- Default settings ------------------------------------- */
const DEFAULT_SETTINGS = {
  volMusic:   0.4,
  volSfx:     0.7,
  baseSpeed:  5,
  gridSize:   20,
  thickness:  2,
  skin:       'classique',
  muted:      false,
};

const SKIN_META = {
  classique: { name: '🟢 Classique', desc: 'Couleurs vives, style classique' },
  neon:      { name: '💜 Néon',      desc: 'Glow effect, couleurs fluo' },
  pixel:     { name: '🕹️ Pixel Art', desc: 'Style rétro 8-bit pixelisé' },
  degrade:   { name: '🌈 Dégradé',   desc: 'Teintes fluides et animées' },
  clair:     { name: '☀️ Clair',     desc: 'Fond blanc, style épuré' },
};

const THICKNESS_LABELS = { '1': 'Fin', '2': 'Normal', '3': 'Épais' };

/* ============================================================
   UI Controller
   ============================================================ */
class SnakeUI {
  constructor() {
    this.settings = this._loadSettings();
    this.game = null;
    this.currentScore = 0;
    this._lastStats = null;

    this._initCanvas();
    this._initGame();
    this._bindNav();
    this._bindModeSelector();
    this._bindSkinSelector();
    this._bindGameControls();
    this._bindOverlayButtons();
    this._bindSettings();
    this._bindDPad();
    this._bindSwipe();
    this._bindKeyboard();
    this._applySettings(this.settings);
    this._updateLeaderboard();
    this._updateSkinInfo(this.settings.skin);
    this._setMuteIcon();
  }

  /* --- Canvas setup -------------------------------------- */
  _initCanvas() {
    this.canvas = document.getElementById('game-canvas');
    this._resizeCanvas();
    window.addEventListener('resize', () => {
      this._resizeCanvas();
      if (this.game) this.game.resize();
    });
  }

  _resizeCanvas() {
    const container = document.getElementById('swipe-zone');
    const size = Math.min(container.clientWidth, container.clientHeight, 540);
    this.canvas.width  = size;
    this.canvas.height = size;
  }

  /* --- Game init ----------------------------------------- */
  _initGame() {
    this.game = new Game(this.canvas);
    this.game.gridSize  = this.settings.gridSize;
    this.game.baseSpeed = this.settings.baseSpeed;
    this.game.skin      = this.settings.skin;
    this.game.mode      = 'classic';
    this.game.snakePad  = 4 - this.settings.thickness;
    this.game._init();
    this.game._render();

    /* Callbacks */
    this.game._onScoreChange = (score) => {
      this.currentScore = score;
      this._updateHUD();
      this._flashScore();
    };
    this.game._onPowerUpChange = (pu) => {
      this._updatePowerUpHUD(pu);
    };
    this.game._onGameOver = (stats) => {
      this._lastStats = stats;
      this._saveScore(stats.score);
      this._showGameOver(stats);
    };
  }

  /* --- Nav ---------------------------------------------- */
  _bindNav() {
    document.getElementById('btn-mute').addEventListener('click', () => {
      this.settings.muted = audioManager.toggle();
      this._setMuteIcon();
      this._saveSettings();
    });
    document.getElementById('btn-settings').addEventListener('click', () => {
      this._openSettings();
    });
  }

  _setMuteIcon() {
    document.getElementById('btn-mute').textContent = audioManager.enabled ? '🔊' : '🔇';
    document.getElementById('btn-mute').classList.toggle('muted', !audioManager.enabled);
  }

  /* --- Mode selector ------------------------------------ */
  _bindModeSelector() {
    document.querySelectorAll('.mode-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.game.mode = mode;
        document.getElementById('hud-mode').textContent = mode === 'classic' ? 'Classique' : 'Infini';
        document.getElementById('mode-label-start').textContent = mode === 'classic' ? 'Classique' : 'Infini';
        if (this.game.state !== 'running') {
          this._showOverlay('start');
        }
      });
    });
  }

  /* --- Skin selector ------------------------------------ */
  _bindSkinSelector() {
    document.querySelectorAll('.skin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const skin = btn.dataset.skin;
        this._applySkin(skin);
      });
    });
  }

  _applySkin(skin) {
    document.querySelectorAll('.skin-tab').forEach(b => b.classList.remove('active'));
    document.querySelector(`.skin-tab[data-skin="${skin}"]`)?.classList.add('active');
    document.body.dataset.skin = skin;
    this.game.skin = skin;
    this.settings.skin = skin;
    this._saveSettings();
    this._updateSkinInfo(skin);
    this.game._render();
  }

  _updateSkinInfo(skin) {
    const meta = SKIN_META[skin] || SKIN_META.classique;
    document.getElementById('skin-name-display').textContent = meta.name;
    document.getElementById('skin-desc').textContent = meta.desc;
  }

  /* --- Game Controls ------------------------------------ */
  _bindGameControls() {
    document.getElementById('btn-play-pause').addEventListener('click', () => this._togglePlayPause());
    document.getElementById('btn-restart-ctrl').addEventListener('click', () => this._doRestart());
  }

  _togglePlayPause() {
    const state = this.game.state;
    if (state === 'idle' || state === 'gameover') {
      this._doStart();
    } else if (state === 'running') {
      this.game.pause();
      this._showOverlay('pause');
      document.getElementById('btn-play-pause').textContent = '▶ Reprendre';
      document.getElementById('btn-play-pause').classList.remove('active');
    } else if (state === 'paused') {
      this.game.resume();
      this._hideAllOverlays();
      document.getElementById('btn-play-pause').textContent = '⏸ Pause';
      document.getElementById('btn-play-pause').classList.add('active');
    }
  }

  _doStart() {
    this._hideAllOverlays();
    this.currentScore = 0;
    this._updateHUD();
    this.game.restart();
    document.getElementById('btn-play-pause').textContent = '⏸ Pause';
    document.getElementById('btn-play-pause').classList.add('active');
    document.getElementById('rank-msg').classList.add('hidden');
  }

  _doRestart() {
    this._hideAllOverlays();
    this.currentScore = 0;
    this._updateHUD();
    this.game.restart();
    document.getElementById('btn-play-pause').textContent = '⏸ Pause';
    document.getElementById('btn-play-pause').classList.add('active');
    document.getElementById('rank-msg').classList.add('hidden');
  }

  /* --- Overlay Buttons ---------------------------------- */
  _bindOverlayButtons() {
    document.getElementById('btn-start').addEventListener('click', () => this._doStart());
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.game.resume();
      this._hideAllOverlays();
      document.getElementById('btn-play-pause').textContent = '⏸ Pause';
      document.getElementById('btn-play-pause').classList.add('active');
    });
    document.getElementById('btn-restart-pause').addEventListener('click', () => this._doRestart());
    document.getElementById('btn-restart').addEventListener('click', () => this._doRestart());
    document.getElementById('btn-share').addEventListener('click', () => this._shareScore());
    document.getElementById('btn-clear-scores').addEventListener('click', () => {
      if (confirm('Effacer tous les scores ?')) {
        localStorage.removeItem(STORAGE_KEY);
        this._updateLeaderboard();
        document.getElementById('rank-msg').classList.add('hidden');
      }
    });
  }

  /* --- Overlays ----------------------------------------- */
  _showOverlay(name) {
    this._hideAllOverlays();
    document.getElementById(`overlay-${name}`)?.classList.remove('hidden');
  }

  _hideAllOverlays() {
    ['start','pause','gameover'].forEach(n => {
      document.getElementById(`overlay-${n}`)?.classList.add('hidden');
    });
  }

  _showGameOver(stats) {
    this._hideAllOverlays();

    /* Stats grid */
    const grid = document.getElementById('stats-grid');
    const timeStr = stats.time >= 60
      ? `${Math.floor(stats.time/60)}m ${stats.time%60}s`
      : `${stats.time}s`;

    grid.innerHTML = `
      <div class="stat-item"><div class="stat-label">Fruits mangés</div><div class="stat-val">${stats.fruits}</div></div>
      <div class="stat-item"><div class="stat-label">Temps</div><div class="stat-val">${timeStr}</div></div>
      <div class="stat-item"><div class="stat-label">Longueur max</div><div class="stat-val">${stats.maxLength}</div></div>
      <div class="stat-item"><div class="stat-label">Mode</div><div class="stat-val">${stats.mode}</div></div>
    `;

    document.getElementById('final-score').textContent = `${stats.score} pts`;

    /* Rank */
    const rank = this._getScoreRank(stats.score);
    const rankEl = document.getElementById('rank-display');
    const best = this._getBestScore();

    if (stats.score > 0 && stats.score === best && best > 0) {
      rankEl.textContent = '🏆 Nouveau record !';
      rankEl.className = 'rank-display new-record';
      audioManager.playNewRecord();
    } else if (stats.score > 0 && rank <= 5) {
      rankEl.textContent = `🎉 Vous êtes ${rank === 1 ? '1er' : rank + 'e'} au classement !`;
      rankEl.className = 'rank-display';
    } else {
      rankEl.className = 'rank-display hidden';
    }

    this._showOverlay('gameover');
    this._updateLeaderboard(stats.score);

    document.getElementById('btn-play-pause').textContent = '▶ Rejouer';
    document.getElementById('btn-play-pause').classList.remove('active');
  }

  /* --- HUD ---------------------------------------------- */
  _updateHUD() {
    document.getElementById('hud-score').textContent = this.currentScore;
    document.getElementById('hud-best').textContent  = this._getBestScore();
  }

  _flashScore() {
    const el = document.getElementById('hud-score');
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  _updatePowerUpHUD(pu) {
    const block = document.getElementById('powerup-block');
    const val   = document.getElementById('hud-powerup');
    if (pu) {
      block.classList.remove('hidden');
      val.textContent = `${pu.icon} ${pu.label}`;
      /* Flash canvas border */
      const container = document.querySelector('.canvas-container');
      container.classList.add('powerup-flash');
      setTimeout(() => container.classList.remove('powerup-flash'), 600);
    } else {
      block.classList.add('hidden');
    }
  }

  /* --- Leaderboard -------------------------------------- */
  _loadScores() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  _saveScore(score) {
    if (score <= 0) return;
    const scores = this._loadScores();
    scores.push(score);
    scores.sort((a, b) => b - a);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, 10)));
  }

  _getBestScore() {
    const scores = this._loadScores();
    return scores[0] || 0;
  }

  _getScoreRank(score) {
    const scores = this._loadScores();
    return scores.findIndex(s => s <= score) + 1 || scores.length + 1;
  }

  _updateLeaderboard(currentScore = null) {
    const list = document.getElementById('leaderboard-list');
    const rankMsg = document.getElementById('rank-msg');
    const scores = this._loadScores().slice(0, 5);

    document.getElementById('hud-best').textContent = scores[0] || 0;

    if (scores.length === 0) {
      list.innerHTML = '<li class="lb-empty">Aucun score</li>';
      rankMsg.classList.add('hidden');
      return;
    }

    const rankLabels = ['gold', 'silver', 'bronze', '', ''];
    const rankEmoji  = ['🥇', '🥈', '🥉', '4.', '5.'];

    list.innerHTML = scores.map((s, i) => {
      const isCurrent = currentScore !== null && s === currentScore &&
        scores.indexOf(s) === i;
      return `
        <li class="${isCurrent ? 'current-score' : ''}">
          <span class="lb-rank ${rankLabels[i]}">${rankEmoji[i]}</span>
          <span>${isCurrent ? '▶ Vous' : `Joueur`}</span>
          <span class="lb-score">${s} pts</span>
        </li>
      `;
    }).join('');

    if (currentScore !== null) {
      const rank = this._getScoreRank(currentScore);
      if (rank <= 5) {
        rankMsg.textContent = `Vous êtes ${rank === 1 ? '1er' : rank + 'e'} !`;
        rankMsg.classList.remove('hidden');
      }
    }
  }

  /* --- Share score --------------------------------------- */
  _shareScore() {
    const score = this._lastStats?.score || 0;
    const text = `J'ai marqué ${score} points au Snake 🐍 ! Peux-tu faire mieux ?`;
    navigator.clipboard?.writeText(text).then(() => {
      const btn = document.getElementById('btn-share');
      btn.textContent = '✅';
      setTimeout(() => { btn.textContent = '📋'; }, 1500);
    }).catch(() => {
      prompt('Copier ce texte :', text);
    });
  }

  /* --- Keyboard ----------------------------------------- */
  _bindKeyboard() {
    const keyMap = {
      ArrowUp: 'UP',    ArrowDown: 'DOWN',   ArrowLeft: 'LEFT',  ArrowRight: 'RIGHT',
      z: 'UP',  Z: 'UP', s: 'DOWN', S: 'DOWN', q: 'LEFT', Q: 'LEFT', d: 'RIGHT', D: 'RIGHT',
      w: 'UP',  W: 'UP', a: 'LEFT', A: 'LEFT',
    };

    document.addEventListener('keydown', (e) => {
      if (keyMap[e.key]) {
        e.preventDefault();
        if (this.game.state === 'running') {
          this.game.setDirection(keyMap[e.key]);
        } else if (this.game.state === 'idle' || this.game.state === 'gameover') {
          this._doStart();
          this.game.setDirection(keyMap[e.key]);
        }
      }
      if (e.key === ' ' || e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this._togglePlayPause();
      }
    });
  }

  /* --- D-Pad -------------------------------------------- */
  _bindDPad() {
    document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        if (this.game.state === 'running') {
          this.game.setDirection(dir);
        } else {
          this._doStart();
          this.game.setDirection(dir);
        }
      });
    });
    document.getElementById('dpad-mid').addEventListener('click', () => this._togglePlayPause());
  }

  /* --- Swipe (touch) ------------------------------------ */
  _bindSwipe() {
    const zone = document.getElementById('swipe-zone');
    let startX = 0, startY = 0;

    zone.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    zone.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const threshold = 20;

      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      let dir;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'RIGHT' : 'LEFT';
      } else {
        dir = dy > 0 ? 'DOWN' : 'UP';
      }

      if (this.game.state === 'running') {
        this.game.setDirection(dir);
      } else {
        this._doStart();
        this.game.setDirection(dir);
      }
    }, { passive: true });
  }

  /* --- Settings ----------------------------------------- */
  _bindSettings() {
    document.getElementById('btn-settings').addEventListener('click', () => this._openSettings());
    document.getElementById('close-settings').addEventListener('click', () => this._closeSettings());
    document.getElementById('save-settings').addEventListener('click', () => {
      this._saveSettingsFromForm();
      this._closeSettings();
    });
    document.getElementById('modal-settings').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-settings')) this._closeSettings();
    });

    /* Live preview sliders */
    const sliders = [
      { id: 'slider-music',     valId: 'val-music',     fmt: v => `${v}%` },
      { id: 'slider-sfx',       valId: 'val-sfx',       fmt: v => `${v}%` },
      { id: 'slider-speed',     valId: 'val-speed',     fmt: v => v },
      { id: 'slider-thickness', valId: 'val-thickness', fmt: v => THICKNESS_LABELS[v] || v },
    ];
    sliders.forEach(({ id, valId, fmt }) => {
      document.getElementById(id).addEventListener('input', function() {
        document.getElementById(valId).textContent = fmt(this.value);
      });
    });
  }

  _openSettings() {
    const s = this.settings;
    document.getElementById('slider-music').value     = Math.round(s.volMusic * 100);
    document.getElementById('val-music').textContent  = `${Math.round(s.volMusic * 100)}%`;
    document.getElementById('slider-sfx').value       = Math.round(s.volSfx * 100);
    document.getElementById('val-sfx').textContent    = `${Math.round(s.volSfx * 100)}%`;
    document.getElementById('slider-speed').value     = s.baseSpeed;
    document.getElementById('val-speed').textContent  = s.baseSpeed;
    document.getElementById('sel-grid').value         = s.gridSize;
    document.getElementById('slider-thickness').value = s.thickness;
    document.getElementById('val-thickness').textContent = THICKNESS_LABELS[s.thickness] || s.thickness;

    document.getElementById('modal-settings').classList.remove('hidden');
    if (this.game.state === 'running') {
      this.game.pause();
    }
  }

  _closeSettings() {
    document.getElementById('modal-settings').classList.add('hidden');
  }

  _saveSettingsFromForm() {
    const s = this.settings;
    s.volMusic   = parseInt(document.getElementById('slider-music').value) / 100;
    s.volSfx     = parseInt(document.getElementById('slider-sfx').value) / 100;
    s.baseSpeed  = parseInt(document.getElementById('slider-speed').value);
    s.gridSize   = parseInt(document.getElementById('sel-grid').value);
    s.thickness  = parseInt(document.getElementById('slider-thickness').value);

    this._applySettings(s);
    this._saveSettings();
  }

  _applySettings(s) {
    audioManager.setVolMusic(s.volMusic);
    audioManager.setVolSfx(s.volSfx);
    if (s.muted) { audioManager.enabled = false; }

    this.game.baseSpeed = s.baseSpeed;
    this.game.gridSize  = s.gridSize;
    this.game.snakePad  = 4 - s.thickness;
    this.game._tickInterval = this.game._speedToInterval(s.baseSpeed);

    if (s.skin) {
      this._applySkin(s.skin);
    }
  }

  _loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch { return { ...DEFAULT_SETTINGS }; }
  }

  _saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
  }
}

/* --- Boot --------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  new SnakeUI();
});
