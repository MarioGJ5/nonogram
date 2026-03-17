// ─── STATE ────────────────────────────────────────────────────────────────────
let MODE = 'menu';
let arcadeIndex = 0;
let arcadeTotalTime = 0;
let arcadeTotalMistakes = 0;

const G = {
  size: 5,
  diff: 'easy',
  sol: [],
  user: [],
  history: [],
  time: 0,
  tmr: null,
  mistakes: 0,
  maxMistakes: 3,
  hintsLeft: 3,
  maxHints: 3,
  dragging: false,
  dragFill: null,
  dragMode: null
};

// ─── AUDIO SYSTEM ─────────────────────────────────────────────────────────────
const AUDIO = {
  music:   new Audio(),
  click:   new Audio(),
  correct: new Audio(),
  wrong:   new Audio(),
  win:     new Audio(),
  hint:    new Audio()
};

let musicVolume = 0.5;
let sfxVolume   = 0.5;

// To plug in your sounds, set src like:
//   AUDIO.music.src   = 'sounds/menu.mp3';
//   AUDIO.click.src   = 'sounds/click.mp3';
//   AUDIO.correct.src = 'sounds/correct.mp3';
//   AUDIO.wrong.src   = 'sounds/wrong.mp3';
//   AUDIO.win.src     = 'sounds/win.mp3';
//   AUDIO.hint.src    = 'sounds/hint.mp3';
AUDIO.music.loop = true;

function playSound(key) {
  try {
    const a = AUDIO[key];
    if (!a || !a.src || a.src === window.location.href) return;
    a.currentTime = 0;
    a.volume = sfxVolume;
    a.play().catch(() => {});
  } catch (e) {}
}

function setMusicVol(v) {
  musicVolume = parseFloat(v);
  AUDIO.music.volume = musicVolume;
  document.getElementById('musicVolVal').textContent = Math.round(v * 100) + '%';
}

function setSfxVol(v) {
  sfxVolume = parseFloat(v);
  document.getElementById('sfxVolVal').textContent = Math.round(v * 100) + '%';
}

// ─── ARCADE LEVELS ────────────────────────────────────────────────────────────
const ARCADE_LEVELS = [
  { name: '❤ Heart',    size: 5, grid: [[0,1,0,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]] },
  { name: '↑ Arrow',    size: 5, grid: [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0]] },
  { name: '★ Star',     size: 5, grid: [[0,0,1,0,0],[1,1,1,1,1],[0,1,1,1,0],[1,0,1,0,1],[0,0,1,0,0]] },
  { name: '◆ Diamond',  size: 5, grid: [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]] },
  { name: 'Z Bolt',     size: 5, grid: [[1,1,1,1,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,1,1,1,1]] },
  { name: '⌂ House',    size: 5, grid: [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[1,0,1,0,1],[1,0,1,0,1]] },
  { name: '+ Cross',    size: 5, grid: [[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0]] },
  { name: '□ Frame',    size: 5, grid: [[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1]] },
  { name: '/ Diagonal', size: 5, grid: [[0,0,0,0,1],[0,0,0,1,1],[0,0,1,1,0],[0,1,1,0,0],[1,1,0,0,0]] },
  { name: 'π Pi',       size: 5, grid: [[1,1,1,1,1],[0,1,0,1,0],[0,1,0,1,0],[0,1,0,1,0],[0,1,0,1,0]] },
  {
    name: '⊕ Target', size: 10,
    grid: [
      [0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,0,0,0,0,1,1,0],
      [1,1,0,0,1,1,0,0,1,1],[1,1,0,1,1,1,1,0,1,1],[1,1,0,1,1,1,1,0,1,1],
      [1,1,0,0,1,1,0,0,1,1],[0,1,1,0,0,0,0,1,1,0],[0,0,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,0,0,0]
    ]
  },
  {
    name: '☆ Big Star', size: 10,
    grid: [
      [0,0,0,0,1,1,0,0,0,0],[0,0,0,0,1,1,0,0,0,0],[1,0,0,0,1,1,0,0,0,1],
      [1,1,0,0,1,1,0,0,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,0],[1,1,0,0,1,1,0,0,1,1],[1,0,0,0,1,1,0,0,0,1],
      [0,0,0,0,1,1,0,0,0,0]
    ]
  }
];

// ─── CLUE HELPERS ─────────────────────────────────────────────────────────────
function getClues(line) {
  const r = [];
  let c = 0;
  for (const v of line) {
    if (v) c++;
    else if (c) { r.push(c); c = 0; }
  }
  if (c) r.push(c);
  return r.length ? r : [0];
}

function buildClues(grid, n) {
  const rc = [], cc = [];
  for (let i = 0; i < n; i++) rc.push(getClues(grid[i]));
  for (let j = 0; j < n; j++) cc.push(getClues(grid.map(r => r[j])));
  return { rc, cc };
}

// ─── PUZZLE GENERATOR ─────────────────────────────────────────────────────────
function solveLine(clues, len) {
  if (clues[0] === 0) return Array(len).fill(0);
  const left = [], right = [];
  let p = 0;
  for (const c of clues) { left.push(p); p += c + 1; }
  p = len - 1;
  for (let i = clues.length - 1; i >= 0; i--) { right.unshift(p - clues[i] + 1); p = p - clues[i] - 1; }
  const result = Array(len).fill(-1);
  for (let k = 0; k < clues.length; k++)
    for (let x = right[k]; x < left[k] + clues[k]; x++) result[x] = 1;
  const covered = Array(len).fill(false);
  for (let k = 0; k < clues.length; k++)
    for (let x = right[k]; x < left[k] + clues[k]; x++) covered[x] = true;
  for (let x = 0; x < len; x++) if (!covered[x] && result[x] === -1) result[x] = 0;
  return result;
}

function generatePuzzle(n, diff) {
  const targets = { easy: [0.55, 0.75], medium: [0.38, 0.58], hard: [0.20, 0.42] };
  const [lo, hi] = targets[diff];
  let best = null, bestScore = Infinity;
  for (let a = 0; a < 120; a++) {
    const fp = diff === 'easy' ? .65 : diff === 'medium' ? .52 : .40;
    const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => Math.random() < fp ? 1 : 0));
    let valid = true;
    for (let i = 0; i < n; i++) if (!grid[i].some(v => v)) { valid = false; break; }
    if (valid) for (let j = 0; j < n; j++) if (!grid.map(r => r[j]).some(v => v)) { valid = false; break; }
    if (!valid) continue;
    const { rc } = buildClues(grid, n);
    let sol = 0;
    for (let i = 0; i < n; i++) { const res = solveLine(rc[i], n); for (const v of res) if (v !== -1) sol++; }
    const ratio = sol / (n * n);
    if (ratio >= lo && ratio <= hi) { best = grid; break; }
    const dist = Math.abs(ratio - (lo + hi) / 2);
    if (dist < bestScore) { bestScore = dist; best = grid; }
  }
  return best;
}

// ─── MENU CONTROL ─────────────────────────────────────────────────────────────
function goToMenu() {
  closeAllModals();
  clearInterval(G.tmr);
  document.getElementById('mainMenu').classList.add('on');
  MODE = 'menu';
  updateModeDisplay();
}

function startClassic() {
  MODE = 'classic';
  document.getElementById('mainMenu').classList.remove('on');
  document.getElementById('classicControls').style.display = '';
  document.getElementById('arcadeControls').style.display = 'none';
  document.getElementById('arcadeProgressDisplay').style.display = 'none';
  document.getElementById('newPuzzleBtn').textContent = '→ NEW PUZZLE';
  updateModeDisplay();
  newGame();
}

function startArcade() {
  MODE = 'arcade';
  arcadeIndex = 0;
  arcadeTotalTime = 0;
  arcadeTotalMistakes = 0;
  document.getElementById('mainMenu').classList.remove('on');
  document.getElementById('arcadeCompleteModal').classList.remove('on');
  document.getElementById('classicControls').style.display = 'none';
  document.getElementById('arcadeControls').style.display = '';
  document.getElementById('arcadeProgressDisplay').style.display = 'flex';
  document.getElementById('newPuzzleBtn').textContent = '→ NEW PUZZLE';
  updateModeDisplay();
  loadArcadeLevel();
}

function openSettings() { document.getElementById('settingsMenu').classList.add('on'); }
function closeSettings() { document.getElementById('settingsMenu').classList.remove('on'); }

function closeAllModals() {
  ['winModal', 'loseModal', 'arcadeCompleteModal', 'settingsMenu'].forEach(id =>
    document.getElementById(id).classList.remove('on')
  );
}

function updateModeDisplay() {
  const el = document.getElementById('modeDisplay');
  if (MODE === 'classic') el.innerHTML = '<span class="mode-badge classic">CLASSIC MODE</span>';
  else if (MODE === 'arcade') el.innerHTML = '<span class="mode-badge arcade">ARCADE MODE</span>';
  else el.innerHTML = '';
}

function updateArcadeProgress() {
  const el = document.getElementById('arcadeProgressDisplay');
  el.innerHTML = ARCADE_LEVELS.map((_, i) =>
    `<div class="ap-dot${i < arcadeIndex ? ' done' : i === arcadeIndex ? ' current' : ''}"></div>`
  ).join('');
}

// ─── LOAD ARCADE LEVEL ────────────────────────────────────────────────────────
function loadArcadeLevel() {
  const lvl = ARCADE_LEVELS[arcadeIndex];
  G.size     = lvl.size;
  G.sol      = lvl.grid.map(r => [...r]);
  G.user     = Array.from({ length: G.size }, () => Array(G.size).fill(-1));
  G.history  = [];
  G.mistakes = 0;
  G.time     = 0;
  G.maxMistakes = 3;
  G.hintsLeft   = 3;
  G.maxHints    = 3;

  const { rc, cc } = buildClues(G.sol, G.size);
  G.rowClues = rc;
  G.colClues = cc;

  document.getElementById('arcadeLevelName').textContent = `#${arcadeIndex + 1} — ${lvl.name}`;
  updateArcadeProgress();
  clearInterval(G.tmr);
  render();
  updateStats();
  G.tmr = setInterval(() => { G.time++; updateStats(); }, 1000);
  document.getElementById('clueCheck').textContent = '';
  document.getElementById('clueCheck').className = 'clue-check';
}

// ─── CLASSIC GAME ─────────────────────────────────────────────────────────────
function newGame() {
  closeAllModals();
  clearInterval(G.tmr);
  setTimeout(() => {
    const n = G.size;
    G.sol      = generatePuzzle(n, G.diff);
    G.user     = Array.from({ length: n }, () => Array(n).fill(-1));
    G.history  = [];
    G.mistakes = 0;
    G.time     = 0;
    G.hintsLeft = G.maxHints;
    const { rc, cc } = buildClues(G.sol, n);
    G.rowClues = rc;
    G.colClues = cc;
    render();
    G.tmr = setInterval(() => { G.time++; updateStats(); }, 1000);
    updateStats();
    document.getElementById('clueCheck').textContent = '';
    document.getElementById('clueCheck').className = 'clue-check';
  }, 40);
}

function handleNewBtn() {
  if (MODE === 'arcade') loadArcadeLevel();
  else newGame();
}

function resetGame() {
  closeAllModals();
  clearInterval(G.tmr);
  G.user     = Array.from({ length: G.size }, () => Array(G.size).fill(-1));
  G.history  = [];
  G.mistakes = 0;
  G.time     = 0;
  G.hintsLeft = G.maxHints;
  render();
  G.tmr = setInterval(() => { G.time++; updateStats(); }, 1000);
  updateStats();
  document.getElementById('clueCheck').textContent = '';
  document.getElementById('clueCheck').className = 'clue-check';
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function cs() { return G.size === 5 ? 40 : G.size === 10 ? 28 : 22; }

function render() {
  const n = G.size, cell = cs();
  const gEl = document.getElementById('grid');
  gEl.style.gridTemplateColumns = `repeat(${n}, ${cell}px)`;
  gEl.innerHTML = '';

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const d = document.createElement('div');
      d.className = 'cell';
      d.style.width = d.style.height = cell + 'px';
      const v = G.user[i][j];
      if (v === 1) d.classList.add('on');
      else if (v === 0) d.classList.add('x');

      d.addEventListener('mousedown',  e => { e.preventDefault(); startDrag(i, j, e.button === 2 ? 'x' : 'fill'); });
      d.addEventListener('mouseover',  () => { if (G.dragging) applyDrag(i, j); });
      d.addEventListener('contextmenu', e => e.preventDefault());
      d.addEventListener('touchstart', e => { e.preventDefault(); startDrag(i, j, 'fill'); }, { passive: false });
      d.addEventListener('touchmove',  e => {
        e.preventDefault();
        const t = e.touches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el && el.dataset.r !== undefined) applyDrag(+el.dataset.r, +el.dataset.c);
      }, { passive: false });

      d.dataset.r = i;
      d.dataset.c = j;
      gEl.appendChild(d);
    }
  }
  renderClues();
  updateProgress();
  updateClueCheck();
}

// ─── CLUE FEEDBACK ────────────────────────────────────────────────────────────
function checkLineFeedback(clues, userLine) {
  let ci = 0, overflow = false, runLen = 0;
  for (const v of userLine) {
    if (v === 1) { runLen++; }
    else {
      if (runLen > 0) {
        if (ci >= clues.length || runLen > clues[ci]) { overflow = true; break; }
        if (v === 0) ci++;
        runLen = 0;
      }
    }
  }
  if (runLen > 0 && (ci >= clues.length || runLen > clues[ci])) overflow = true;
  if (overflow) return 'error';
  if (userLine.every(v => v !== -1)) {
    const f = getClues(userLine.map(v => v === 1 ? 1 : 0));
    return JSON.stringify(f) === JSON.stringify(clues) ? 'done' : 'error';
  }
  return 'partial';
}

function clueState(i, isRow) {
  return checkLineFeedback(
    isRow ? G.rowClues[i] : G.colClues[i],
    isRow ? G.user[i] : G.user.map(r => r[i])
  );
}

function renderClues() {
  const n = G.size;
  const rc = document.getElementById('rowClues'); rc.innerHTML = '';
  const cc = document.getElementById('colClues'); cc.innerHTML = '';
  rc.style.fontSize = n === 15 ? '.58rem' : n === 10 ? '.68rem' : '.75rem';
  cc.style.fontSize = n === 15 ? '.54rem' : n === 10 ? '.60rem' : '.65rem';

  for (let i = 0; i < n; i++) {
    const s = clueState(i, true);
    const d = document.createElement('div');
    d.className = 'cr' + (s === 'done' ? ' done' : s === 'error' ? ' error' : '');
    d.style.height = cs() + 'px';
    d.style.alignItems = 'center';
    d.innerHTML = G.rowClues[i].map(c => `<span class="cn">${c}</span>`).join('');
    rc.appendChild(d);
  }

  for (let j = 0; j < n; j++) {
    const s = clueState(j, false);
    const d = document.createElement('div');
    d.className = 'cc' + (s === 'done' ? ' done' : s === 'error' ? ' error' : '');
    d.style.width = cs() + 'px';
    d.innerHTML = G.colClues[j].map(c => `<span class="cn">${c}</span>`).join('');
    cc.appendChild(d);
  }
}

function renderCell(r, c) {
  const el = document.getElementById('grid').children[r * G.size + c];
  if (!el) return;
  el.className = 'cell';
  el.style.width = el.style.height = cs() + 'px';
  if (G.user[r][c] === 1) el.classList.add('on');
  else if (G.user[r][c] === 0) el.classList.add('x');
}

// ─── DRAG ─────────────────────────────────────────────────────────────────────
function startDrag(r, c, mode) {
  G.dragging = true;
  G.dragMode = mode;
  G.dragFill = mode === 'fill'
    ? (G.user[r][c] === 1 ? -1 : 1)
    : (G.user[r][c] === 0 ? -1 : 0);
  applyDrag(r, c);
}

document.addEventListener('mouseup',  () => { G.dragging = false; });
document.addEventListener('touchend', () => { G.dragging = false; });

function applyDrag(r, c) {
  if (!G.dragging) return;
  const prev = G.user[r][c];
  if (prev === G.dragFill) return;

  G.history.push({ r, c, prev });
  G.user[r][c] = G.dragFill;
  playSound('click');

  if (G.dragFill === 1 && G.sol[r][c] !== 1) {
    G.mistakes++;
    playSound('wrong');
    const el = document.getElementById('grid').children[r * G.size + c];
    if (el) { el.classList.add('err-flash'); setTimeout(() => el && el.classList.remove('err-flash'), 350); }
    if (G.mistakes >= G.maxMistakes) {
      clearInterval(G.tmr);
      renderClues();
      updateStats();
      document.getElementById('loseModal').classList.add('on');
      return;
    }
  } else if (G.dragFill === 1) {
    playSound('correct');
  }

  renderCell(r, c);
  renderClues();
  updateProgress();
  updateStats();
  updateClueCheck();
  checkWin();
}

// ─── CLUE CHECK SUMMARY ───────────────────────────────────────────────────────
function updateClueCheck() {
  const n = G.size;
  let dr = 0, dc = 0, er = 0, ec = 0;
  for (let i = 0; i < n; i++) {
    const rs = clueState(i, true), cs2 = clueState(i, false);
    if (rs === 'done') dr++; if (rs === 'error') er++;
    if (cs2 === 'done') dc++; if (cs2 === 'error') ec++;
  }
  const el = document.getElementById('clueCheck');
  if (er + ec > 0) {
    el.textContent = `⚠ ${er + ec} line(s) have an error`;
    el.className = 'clue-check bad';
  } else if (dr + dc > 0) {
    el.textContent = `✓ ${dr}/${n} rows · ${dc}/${n} cols solved`;
    el.className = 'clue-check good';
  } else {
    el.textContent = '';
    el.className = 'clue-check';
  }
}

// ─── HINT ─────────────────────────────────────────────────────────────────────
function doHint() {
  if (G.hintsLeft <= 0) return;
  let opts = [];
  for (let i = 0; i < G.size; i++)
    for (let j = 0; j < G.size; j++)
      if (G.user[i][j] !== 1 && G.sol[i][j] === 1) opts.push([i, j]);
  if (!opts.length) return;

  opts.sort((a, b) => {
    const sa = G.user[a[0]].filter(v => v === 1).length + G.user.map(r => r[a[1]]).filter(v => v === 1).length;
    const sb = G.user[b[0]].filter(v => v === 1).length + G.user.map(r => r[b[1]]).filter(v => v === 1).length;
    return sb - sa;
  });

  G.hintsLeft--;
  const [r, c] = opts[0];
  G.history.push({ r, c, prev: G.user[r][c] });
  G.user[r][c] = 1;
  playSound('hint');
  renderCell(r, c);

  const el = document.getElementById('grid').children[r * G.size + c];
  if (el) { el.classList.add('hint-flash'); setTimeout(() => el && el.classList.remove('hint-flash'), 800); }

  renderClues();
  updateProgress();
  updateStats();
  updateClueCheck();
  checkWin();
}

// ─── UNDO ─────────────────────────────────────────────────────────────────────
function doUndo() {
  if (!G.history.length) return;
  const { r, c, prev } = G.history.pop();
  G.user[r][c] = prev;
  renderCell(r, c);
  renderClues();
  updateProgress();
  updateStats();
  updateClueCheck();
  const t = document.getElementById('undoToast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1300);
}

// ─── PROGRESS & STATS ─────────────────────────────────────────────────────────
function updateProgress() {
  let ok = 0, total = 0;
  for (let i = 0; i < G.size; i++)
    for (let j = 0; j < G.size; j++) {
      if (G.sol[i][j] === 1) { total++; if (G.user[i][j] === 1) ok++; }
    }
  document.getElementById('prog').style.width = total > 0 ? (ok / total * 100) + '%' : '0%';
}

function fmt(s) {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function updateStats() {
  document.getElementById('tstat').textContent = fmt(G.time);
  const ms = document.getElementById('mstat');
  ms.textContent = `${G.mistakes}/${G.maxMistakes}`;
  ms.className = 'sv' + (G.mistakes === G.maxMistakes - 1 ? ' danger' : '');
  document.getElementById('hintCount').textContent = G.hintsLeft;
  document.getElementById('hintBtn').disabled = G.hintsLeft <= 0;
}

// ─── WIN CHECK ────────────────────────────────────────────────────────────────
function checkWin() {
  for (let i = 0; i < G.size; i++)
    for (let j = 0; j < G.size; j++)
      if (G.sol[i][j] === 1 && G.user[i][j] !== 1) return;

  clearInterval(G.tmr);
  playSound('win');

  const fl = document.getElementById('levelFlash');
  fl.classList.add('show');
  setTimeout(() => fl.classList.remove('show'), 500);

  if (MODE === 'arcade') {
    arcadeTotalTime     += G.time;
    arcadeTotalMistakes += G.mistakes;
    arcadeIndex++;

    if (arcadeIndex >= ARCADE_LEVELS.length) {
      document.getElementById('arcadeCompleteStats').textContent =
        `Total time: ${fmt(arcadeTotalTime)} · Mistakes: ${arcadeTotalMistakes}`;
      document.getElementById('arcadeNameInput').value = '';
      document.getElementById('arcadeCompleteModal').classList.add('on');
      setTimeout(() => document.getElementById('arcadeNameInput').focus(), 400);
      return;
    }

    updateArcadeProgress();
    setTimeout(loadArcadeLevel, 900);

  } else {
    document.getElementById('winMsg').textContent =
      `${G.size}×${G.size} · ${G.diff.toUpperCase()} · ${fmt(G.time)} · ${G.mistakes} mistake${G.mistakes !== 1 ? 's' : ''}`;
    document.getElementById('pname').value = '';
    document.getElementById('winModal').classList.add('on');
    setTimeout(() => document.getElementById('pname').focus(), 400);
  }
}

// ─── SIZE / DIFF ──────────────────────────────────────────────────────────────
function changeSize(s) {
  document.querySelectorAll('.sz-btn').forEach(b => b.classList.toggle('on', +b.dataset.s === s));
  G.size = s;
  newGame();
}

function changeDiff(d) {
  document.querySelectorAll('.df-btn').forEach(b => b.classList.toggle('on', b.dataset.d === d));
  G.diff = d;
  G.maxMistakes = d === 'easy' ? 5 : d === 'medium' ? 3 : 1;
  G.maxHints    = d === 'easy' ? 5 : d === 'medium' ? 3 : 1;
  newGame();
}

// ─── CLASSIC LEADERBOARD ──────────────────────────────────────────────────────
function saveScore() {
  const n = document.getElementById('pname').value.trim();
  if (!n) { document.getElementById('pname').style.borderColor = '#ff4444'; return; }
  let lb = [];
  try { lb = JSON.parse(localStorage.getItem('ng_lb') || '[]'); } catch (e) {}
  lb.push({ n, s: G.size, t: G.time, m: G.mistakes, d: G.diff });
  lb.sort((a, b) => a.t - b.t);
  lb = lb.slice(0, 20);
  try { localStorage.setItem('ng_lb', JSON.stringify(lb)); } catch (e) {}
  document.getElementById('winModal').classList.remove('on');
  updateLB();
  newGame();
}

function updateLB() {
  let lb = [];
  try { lb = JSON.parse(localStorage.getItem('ng_lb') || '[]'); } catch (e) {}
  document.getElementById('lb').innerHTML = lb.slice(0, 8).map((e, i) =>
    `<div class="lb-e">
      <span class="lb-r">#${i + 1}</span>
      <span class="lb-n">${e.n}</span>
      <span class="lb-t">${e.s}x${e.s} ${fmt(e.t)}</span>
    </div>`
  ).join('') || '<div style="color:var(--muted);text-align:center;font-size:.75rem;padding:8px;">No results yet</div>';
}

// ─── ARCADE LEADERBOARD ───────────────────────────────────────────────────────
function saveArcadeScore() {
  const n = document.getElementById('arcadeNameInput').value.trim();
  if (!n) { document.getElementById('arcadeNameInput').style.borderColor = '#ff4444'; return; }
  let lb = [];
  try { lb = JSON.parse(localStorage.getItem('ng_arcade_lb') || '[]'); } catch (e) {}
  lb.push({ n, t: arcadeTotalTime, m: arcadeTotalMistakes, lvl: ARCADE_LEVELS.length });
  lb.sort((a, b) => a.t - b.t);
  lb = lb.slice(0, 20);
  try { localStorage.setItem('ng_arcade_lb', JSON.stringify(lb)); } catch (e) {}
  document.getElementById('arcadeCompleteModal').classList.remove('on');
  updateArcadeLB();
  startArcade();
}

function updateArcadeLB() {
  let lb = [];
  try { lb = JSON.parse(localStorage.getItem('ng_arcade_lb') || '[]'); } catch (e) {}
  const el = document.getElementById('arcadeLB');
  if (!el) return;
  el.innerHTML = lb.slice(0, 8).map((e, i) =>
    `<div class="alb-entry">
      <span class="alb-r">#${i + 1}</span>
      <span class="alb-n">${e.n}</span>
      <span class="alb-t">${fmt(e.t)}</span>
      <span class="alb-lv">${e.m} err</span>
    </div>`
  ).join('') || '<div style="color:var(--muted);text-align:center;font-size:.75rem;padding:8px;">No results yet</div>';
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
updateLB();
updateArcadeLB();
