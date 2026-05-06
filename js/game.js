/* ============================================================
   game.js — Logique principale du jeu Snake
   ============================================================ */

/* --- Constantes ------------------------------------------- */
const DIR = { UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 } };
const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

const POWERUP_TYPES = [
  { id: 'slow',        icon: '⏱', label: 'Ralenti',       color: '#facc15', duration: 5000 },
  { id: 'invincible',  icon: '💙', label: 'Invincible',    color: '#38bdf8', duration: 3000 },
  { id: 'double',      icon: '✅', label: 'x2 Points',     color: '#4ade80', duration: 5000 },
  { id: 'ghost',       icon: '✂️', label: 'Clip Corps',    color: '#a78bfa', duration: 3000 },
];

/* --- Skins renderer config -------------------------------- */
const SKINS = {
  classique: {
    name: 'Classique',
    desc: 'Couleurs vives, style classique',
    bg:     '#0d0d1a',
    grid:   '#16213e',
    snakeHead: '#4ade80',
    snakeBody: '#22c55e',
    fruit:  '#ef4444',
    obstacle: '#475569',
    drawSegment(ctx, x, y, size, isHead, progress) {
      const pad = isHead ? 0 : 1;
      ctx.fillStyle = isHead ? SKINS.classique.snakeHead : SKINS.classique.snakeBody;
      ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);
    },
    drawFruit(ctx, x, y, size) {
      ctx.fillStyle = SKINS.classique.fruit;
      const r = size / 2 - 2;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, r, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  neon: {
    name: 'Néon',
    desc: 'Glow effect, couleurs fluo',
    bg:     '#080818',
    grid:   '#0d0d20',
    snakeHead: '#00ffe7',
    snakeBody: '#00ccbb',
    fruit:  '#ff2d78',
    obstacle: '#4a1a6e',
    drawSegment(ctx, x, y, size, isHead, progress) {
      const pad = 1;
      const color = isHead ? '#00ffe7' : '#00ccbb';
      ctx.shadowColor = color;
      ctx.shadowBlur = isHead ? 14 : 8;
      ctx.fillStyle = color;
      const r = isHead ? 4 : 3;
      roundRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, r);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
    drawFruit(ctx, x, y, size) {
      ctx.shadowColor = '#ff2d78';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ff2d78';
      const r = size / 2 - 2;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  },

  pixel: {
    name: 'Pixel Art',
    desc: 'Style rétro 8-bit',
    bg:     '#0d0d1a',
    grid:   '#12122a',
    snakeHead: '#78ff44',
    snakeBody: '#44cc22',
    fruit:  '#ff6600',
    obstacle: '#553300',
    drawSegment(ctx, x, y, size, isHead) {
      ctx.fillStyle = isHead ? '#78ff44' : '#44cc22';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = isHead ? '#aaffaa' : '#88ee66';
      ctx.fillRect(x + 1, y + 1, 3, 3);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + size - 2, y + size - 2, 2, 2);
    },
    drawFruit(ctx, x, y, size) {
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(x + 2, y + 2, 3, 3);
    },
  },

  degrade: {
    name: 'Dégradé',
    desc: 'Couleurs fluides et animées',
    bg:     '#0d0d1a',
    grid:   '#16213e',
    snakeHead: '#a78bfa',
    snakeBody: null,
    fruit:  '#f472b6',
    obstacle: '#2d1a4a',
    drawSegment(ctx, x, y, size, isHead, progress, index, total) {
      const hue = (200 + (index / Math.max(total, 1)) * 120) % 360;
      ctx.fillStyle = `hsl(${hue}, 80%, ${isHead ? 75 : 60}%)`;
      const pad = isHead ? 0 : 1;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 - pad, 0, Math.PI * 2);
      ctx.fill();
    },
    drawFruit(ctx, x, y, size) {
      const grad = ctx.createRadialGradient(
        x + size / 2, y + size / 2, 1,
        x + size / 2, y + size / 2, size / 2 - 2
      );
      grad.addColorStop(0, '#f472b6');
      grad.addColorStop(1, '#a78bfa');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  clair: {
    name: 'Clair',
    desc: 'Fond blanc, style épuré',
    bg:     '#f8fafc',
    grid:   '#dde4ee',
    snakeHead: '#16a34a',
    snakeBody: '#22c55e',
    fruit:  '#dc2626',
    obstacle: '#94a3b8',
    drawSegment(ctx, x, y, size, isHead) {
      const pad = isHead ? 0 : 1;
      // Corps principal
      ctx.fillStyle = isHead ? '#16a34a' : '#22c55e';
      roundRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, isHead ? 4 : 3);
      ctx.fill();
      // Contour légèrement plus sombre
      ctx.strokeStyle = isHead ? '#15803d' : '#16a34a';
      ctx.lineWidth = 1;
      roundRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, isHead ? 4 : 3);
      ctx.stroke();
      // Reflet blanc
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(x + pad + 2, y + pad + 2, (size - pad * 2) * 0.38, (size - pad * 2) * 0.28);
    },
    drawFruit(ctx, x, y, size) {
      const cx = x + size / 2, cy = y + size / 2, r = size / 2 - 2;
      // Corps rouge
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // Contour
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Tige
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx + r * 0.5, cy - r * 1.4, cx + r * 0.3, cy - r * 1.1);
      ctx.stroke();
      // Reflet
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    },
  },
};

/* --- Utility ---------------------------------------------- */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function randInt(a, b) { return Math.floor(Math.random() * (b - a)) + a; }

/* ============================================================
   GAME CLASS
   ============================================================ */
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    /* Settings (from UI) */
    this.gridSize   = 20;
    this.baseSpeed  = 5;        // 1-10 → interval ms
    this.snakePad   = 2;        // padding visuel segments
    this.mode       = 'classic';
    this.skin       = 'classique';

    /* State */
    this.state = 'idle';        // idle | running | paused | gameover
    this._animId = null;
    this._lastTick = 0;
    this._tickInterval = 0;
    this._pendingDir = null;
    this._waitingFirstInput = true;  // snake ne bouge pas avant la 1ère direction

    /* Session stats */
    this.stats = {};

    this._init();
  }

  /* --- Init / Reset -------------------------------------- */
  _init() {
    this.snake       = [];
    this.dir         = 'RIGHT';
    this.nextDir     = 'RIGHT';
    this.score       = 0;
    this.fruits      = [];
    this.powerUpItem = null;     // current spawned powerup on grid
    this.activePowerUp  = null;  // currently active effect
    this._powerUpTimer  = null;
    this.obstacles   = [];
    this.fruitsEaten = 0;
    this.maxLength   = 0;
    this.startTime   = Date.now();

    const mid = Math.floor(this.gridSize / 2);
    this.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];

    this._waitingFirstInput = true;
    this._nextPowerUpAt = randInt(4, 8);  // fruits before first power-up
    this._powerUpActiveStart = 0;
    this.maxLength = this.snake.length;

    // Obstacles en cours d'apparition (clignotement) : pas encore dangereux
    // Chaque entrée : { x, y, blinkCount } — blinkCount passe de 0 à 4 (2 ON + 2 OFF)
    this.pendingObstacles = [];

    this._spawnFruit();
    this._spawnObstacles();
    this._tickInterval = this._speedToInterval(this.baseSpeed);
  }

  _speedToInterval(speed) {
    return Math.round(200 - speed * 16);
  }

  /* --- Grid helpers -------------------------------------- */
  _isFree(x, y) {
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return false;
    if (this.snake.some(s => s.x === x && s.y === y)) return false;
    if (this.fruits.some(f => f.x === x && f.y === y)) return false;
    if (this.obstacles.some(o => o.x === x && o.y === y)) return false;
    if (this.pendingObstacles.some(o => o.x === x && o.y === y)) return false;
    if (this.powerUpItem && this.powerUpItem.x === x && this.powerUpItem.y === y) return false;
    return true;
  }

  _randomFreeCell() {
    let tries = 0;
    let x, y;
    do {
      x = randInt(0, this.gridSize);
      y = randInt(0, this.gridSize);
      tries++;
    } while (!this._isFree(x, y) && tries < 200);
    return tries < 200 ? { x, y } : null;
  }

  _spawnFruit() {
    const cell = this._randomFreeCell();
    if (cell) this.fruits = [cell];
  }

  _spawnObstacles() {
    // On ne spawne rien si des blocs clignotent encore (attente de leur solidification)
    if (this.pendingObstacles.length > 0) return;
    if (this.fruitsEaten === 0) return;

    const count = Math.min(Math.floor(this.fruitsEaten / 10) * 2, 12);
    const currentCount = this.obstacles.length;
    const toSpawn = count - currentCount;
    if (toSpawn <= 0) return;

    const mid = Math.floor(this.gridSize / 2);
    const newPending = [];

    for (let i = 0; i < toSpawn; i++) {
      let tries = 0;
      let cell;
      do {
        cell = { x: randInt(0, this.gridSize), y: randInt(0, this.gridSize) };
        tries++;
      } while (
        tries < 100 &&
        (!this._isFree(cell.x, cell.y) ||
          (Math.abs(cell.x - mid) < 3 && Math.abs(cell.y - mid) < 3) ||
          newPending.some(p => p.x === cell.x && p.y === cell.y))
      );
      if (tries < 100) newPending.push({ x: cell.x, y: cell.y, blinkCount: 0 });
    }

    this.pendingObstacles = newPending;
    if (newPending.length > 0) this._startObstacleBlink();
  }

  /* Anime le clignotement : 4 demi-cycles = 2 flashs ON/OFF, puis solidification */
  _startObstacleBlink() {
    const BLINK_HALF_DURATION = 350; // ms par demi-cycle (ON ou OFF)
    const TOTAL_HALF_CYCLES   = 4;   // 2 flashs complets (ON-OFF-ON-OFF)

    const tick = () => {
      if (this.state === 'gameover') return;
      if (this.pendingObstacles.length === 0) return;

      // Avance tous les blocs d'un demi-cycle
      this.pendingObstacles.forEach(o => o.blinkCount++);

      if (this.pendingObstacles[0].blinkCount >= TOTAL_HALF_CYCLES) {
        // Solidification : les blocs deviennent dangereux
        for (const o of this.pendingObstacles) {
          this.obstacles.push({ x: o.x, y: o.y });
        }
        this.pendingObstacles = [];
      } else {
        setTimeout(tick, BLINK_HALF_DURATION);
      }
    };

    setTimeout(tick, BLINK_HALF_DURATION);
  }

  _trySpawnPowerUp() {
    if (this.powerUpItem) return;
    if (this.fruitsEaten < this._nextPowerUpAt) return;

    this._nextPowerUpAt = this.fruitsEaten + randInt(4, 8);
    const cell = this._randomFreeCell();
    if (!cell) return;
    const type = POWERUP_TYPES[randInt(0, POWERUP_TYPES.length)];
    const spawnTime = Date.now();
    this.powerUpItem = { ...cell, ...type, spawnTime };
    setTimeout(() => {
      if (this.powerUpItem?.spawnTime === spawnTime) this.powerUpItem = null;
    }, 5000);
  }

  /* --- Direction ---------------------------------------- */
  setDirection(dir) {
    if (!DIR[dir]) return;
    if (OPPOSITE[dir] === this.dir) return;
    this._pendingDir = dir;
    this._waitingFirstInput = false;
  }

  /* --- Game Loop ---------------------------------------- */
  start() {
    this.state = 'running';
    this._lastTick = performance.now();
    audioManager.startMusic();
    this._loop(performance.now());
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    cancelAnimationFrame(this._animId);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this._lastTick = performance.now();
    this._loop(performance.now());
  }

  restart() {
    cancelAnimationFrame(this._animId);
    if (this._powerUpTimer) clearTimeout(this._powerUpTimer);
    this.activePowerUp = null;
    this.powerUpItem = null;
    this._init();
    this.start();
  }

  _loop(now) {
    if (this.state !== 'running') return;
    this._animId = requestAnimationFrame(t => this._loop(t));

    const elapsed = now - this._lastTick;
    if (elapsed >= this._tickInterval) {
      this._lastTick = now - (elapsed % this._tickInterval);
      this._tick();
    }

    this._render();
  }

  /* --- Tick (game logic) -------------------------------- */
  _tick() {
    if (this._waitingFirstInput) return;

    /* Apply pending direction */
    if (this._pendingDir) {
      if (OPPOSITE[this._pendingDir] !== this.dir) {
        this.dir = this._pendingDir;
      }
      this._pendingDir = null;
    }

    const head = this.snake[0];
    const d = DIR[this.dir];
    let nx = head.x + d.x;
    let ny = head.y + d.y;

    /* Wall behaviour */
    if (this.mode === 'infinite') {
      nx = (nx + this.gridSize) % this.gridSize;
      ny = (ny + this.gridSize) % this.gridSize;
    } else {
      if (nx < 0 || nx >= this.gridSize || ny < 0 || ny >= this.gridSize) {
        if (this.activePowerUp?.id === 'invincible') {
          nx = (nx + this.gridSize) % this.gridSize;
          ny = (ny + this.gridSize) % this.gridSize;
        } else {
          this._gameOver(); return;
        }
      }
    }

    /* Self collision */
    const hitSelf = this.snake.some(s => s.x === nx && s.y === ny);
    if (hitSelf) {
      const canPass = this.activePowerUp?.id === 'invincible' || this.activePowerUp?.id === 'ghost';
      if (!canPass) { this._gameOver(); return; }
    }

    /* Obstacle collision */
    const hitObstacle = this.obstacles.some(o => o.x === nx && o.y === ny);
    if (hitObstacle && this.activePowerUp?.id !== 'invincible') {
      this._gameOver(); return;
    }

    /* Move snake */
    this.snake.unshift({ x: nx, y: ny });

    /* Fruit eaten? */
    const fruitIdx = this.fruits.findIndex(f => f.x === nx && f.y === ny);
    if (fruitIdx >= 0) {
      this.fruits.splice(fruitIdx, 1);
      const pts = this.activePowerUp?.id === 'double' ? 20 : 10;
      this.score += pts;
      this.fruitsEaten++;
      this.maxLength = Math.max(this.maxLength, this.snake.length);

      audioManager.playEat();
      this._spawnFruit();
      this._trySpawnPowerUp();
      this._spawnObstacles();

      /* Infinite mode: speed up every 5 fruits */
      if (this.mode === 'infinite') {
        const boost = Math.floor(this.fruitsEaten / 5);
        this._tickInterval = Math.max(
          60,
          this._speedToInterval(this.baseSpeed) - boost * 8
        );
      }
    } else {
      this.snake.pop();
    }

    /* Power-up picked up? */
    if (this.powerUpItem && this.powerUpItem.x === nx && this.powerUpItem.y === ny) {
      this._activatePowerUp(this.powerUpItem);
      this.powerUpItem = null;
    }

    /* Expire old powerup item after 5s */
    if (this.powerUpItem && Date.now() - this.powerUpItem.spawnTime > 5000) {
      this.powerUpItem = null;
    }
  }

  /* --- Power-Ups ---------------------------------------- */
  _activatePowerUp(type) {
    if (this._powerUpTimer) clearTimeout(this._powerUpTimer);
    this.activePowerUp = type;
    this._powerUpActiveStart = Date.now();
    audioManager.playPowerUp();

    /* Slow: halve tick speed */
    if (type.id === 'slow') {
      this._tickInterval *= 2;
    }

    this._powerUpTimer = setTimeout(() => {
      if (type.id === 'slow') {
        this._tickInterval = Math.round(this._tickInterval / 2);
      }
      this.activePowerUp = null;
      audioManager.playPowerUpExpired();
      if (this._onPowerUpChange) this._onPowerUpChange(null);
    }, type.duration);

    if (this._onPowerUpChange) this._onPowerUpChange(type);
    if (this._onScoreChange)   this._onScoreChange(this.score);
  }

  /* --- Game Over ---------------------------------------- */
  _gameOver() {
    this.state = 'gameover';
    cancelAnimationFrame(this._animId);
    audioManager.stopMusic();
    audioManager.playGameOver();

    this.stats = {
      score:       this.score,
      fruits:      this.fruitsEaten,
      time:        Math.floor((Date.now() - this.startTime) / 1000),
      maxLength:   this.maxLength,
      mode:        this.mode === 'classic' ? 'Classique' : 'Infini',
    };

    this._render(); // final frame

    if (this._onGameOver) this._onGameOver(this.stats);
  }

  /* ============================================================
     RENDER
     ============================================================ */
  _render() {
    const canvas  = this.canvas;
    const ctx     = this.ctx;
    const gs      = this.gridSize;
    const cellSize = Math.floor(canvas.width / gs);
    const skin    = SKINS[this.skin] || SKINS.classique;

    /* Background */
    ctx.fillStyle = skin.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* Grid */
    ctx.strokeStyle = skin.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gs; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    /* Obstacles (solides — dangereux) */
    for (const o of this.obstacles) {
      ctx.fillStyle = skin.obstacle || '#475569';
      ctx.fillRect(o.x * cellSize, o.y * cellSize, cellSize, cellSize);
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.fillRect(o.x * cellSize + 2, o.y * cellSize + 2, cellSize - 4, cellSize - 4);
    }

    /* Obstacles en attente (clignotement) — pas encore dangereux.
       blinkCount pair = visible (ON), impair = invisible (OFF) */
    for (const o of this.pendingObstacles) {
      if (o.blinkCount % 2 === 0) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = skin.obstacle || '#475569';
        ctx.fillRect(o.x * cellSize, o.y * cellSize, cellSize, cellSize);
        ctx.fillStyle = 'rgba(255,255,100,.35)';
        ctx.fillRect(o.x * cellSize + 2, o.y * cellSize + 2, cellSize - 4, cellSize - 4);
        ctx.globalAlpha = 1;
      }
    }

    /* Power-up item (blinking) */
    if (this.powerUpItem) {
      const pu = this.powerUpItem;
      const blink = Math.sin(Date.now() / 200) > 0;
      if (blink) {
        ctx.fillStyle = pu.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(
          pu.x * cellSize + cellSize / 2,
          pu.y * cellSize + cellSize / 2,
          cellSize / 2 - 2, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = `${Math.floor(cellSize * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.icon, pu.x * cellSize + cellSize / 2, pu.y * cellSize + cellSize / 2);
      }
    }

    /* Fruit */
    for (const f of this.fruits) {
      skin.drawFruit(ctx, f.x * cellSize, f.y * cellSize, cellSize);
    }

    /* Snake */
    const total = this.snake.length;
    for (let i = total - 1; i >= 0; i--) {
      const seg = this.snake[i];
      skin.drawSegment(
        ctx,
        seg.x * cellSize,
        seg.y * cellSize,
        cellSize,
        i === 0,
        i / total,
        i,
        total
      );
    }

    /* Draw eyes on head (classique + pixel) */
    if (this.skin === 'classique' || this.skin === 'pixel') {
      this._drawEyes(ctx, this.snake[0], cellSize);
    }

    /* "Waiting for input" pulse on head */
    if (this._waitingFirstInput && this.state === 'running') {
      const h = this.snake[0];
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 250);
      ctx.strokeStyle = skin.snakeHead || '#4ade80';
      ctx.lineWidth = 2;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(
        h.x * cellSize + cellSize / 2,
        h.y * cellSize + cellSize / 2,
        cellSize * 0.8, 0, Math.PI * 2
      );
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* Active power-up timer bar */
    if (this.activePowerUp) {
      const pu = this.activePowerUp;
      const elapsed = Date.now() - this._powerUpActiveStart;
      const ratio = Math.max(0, 1 - elapsed / pu.duration);
      ctx.fillStyle = pu.color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(0, canvas.height - 5, canvas.width * ratio, 5);
      ctx.globalAlpha = 1;
    }
  }

  _drawEyes(ctx, head, cellSize) {
    const cx = head.x * cellSize + cellSize / 2;
    const cy = head.y * cellSize + cellSize / 2;
    const d = this.dir;
    const er = Math.max(2, cellSize / 9);
    const offset = cellSize * 0.22;

    let e1, e2;
    if (d === 'RIGHT') { e1 = { x: cx + offset, y: cy - offset }; e2 = { x: cx + offset, y: cy + offset }; }
    else if (d === 'LEFT') { e1 = { x: cx - offset, y: cy - offset }; e2 = { x: cx - offset, y: cy + offset }; }
    else if (d === 'UP')   { e1 = { x: cx - offset, y: cy - offset }; e2 = { x: cx + offset, y: cy - offset }; }
    else                   { e1 = { x: cx - offset, y: cy + offset }; e2 = { x: cx + offset, y: cy + offset }; }

    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(e1.x, e1.y, er, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2.x, e2.y, er, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(e1.x - er * 0.3, e1.y - er * 0.3, er * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2.x - er * 0.3, e2.y - er * 0.3, er * 0.4, 0, Math.PI * 2); ctx.fill();
  }

  /* --- Canvas resize ------------------------------------ */
  resize() {
    const container = this.canvas.parentElement;
    const available = Math.min(container.clientWidth, container.clientHeight);
    // On force la taille du canvas à être un multiple exact de gridSize
    // pour éviter qu'il reste des "demi-carrés" sur les bords.
    const cellSize = Math.floor(available / this.gridSize);
    const size = cellSize * this.gridSize;
    this.canvas.width  = size;
    this.canvas.height = size;
    this._render();
  }
}