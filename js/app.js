// ========== STATE ==========
let players = [{ name: "Jugador 1", avatar: 0 }, { name: "Jugador 2", avatar: 1 }];
let selectedCats = [0, 1, 2, 3, 4];
let difficulty = "easy";
let scores = {};
let round = 1;
let currentCat = null;
let currentSong = null;
const MAX_ROUNDS = 10;
let roundDeltas = {};

// ========== NAVIGATION ==========
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);

  if (id === 'game') {
    renderScoreboard();
    document.getElementById('roundNum').textContent = round;
  }
}

// ========== FLOATING NOTES ==========
function spawnNotes() {
  const container = document.getElementById('notesBg');
  const notes = ['♪','♫','♬','♩','🎵','🎶'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('div');
    el.className = 'note';
    el.textContent = notes[i % notes.length];
    el.style.left = Math.random() * 100 + '%';
    el.style.top = (30 + Math.random() * 60) + '%';
    el.style.animationDelay = (Math.random() * 8) + 's';
    el.style.fontSize = (1 + Math.random()) + 'rem';
    container.appendChild(el);
  }
}

// ========== TOAST ==========
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function showLoading(msg) { document.getElementById('loadingText').textContent = msg || 'Cargando...'; document.getElementById('loadingOverlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.add('hidden'); }

// ========== PLAYERS ==========
function renderPlayers() {
  const list = document.getElementById('playersList');
  list.innerHTML = '';
  players.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `
      <div class="player-avatar" style="background:${AVATAR_COLORS[p.avatar % AVATAR_COLORS.length]}">${AVATARS[p.avatar % AVATARS.length]}</div>
      <input class="player-name-input" value="${p.name}" placeholder="Nombre" maxlength="15" oninput="players[${i}].name=this.value">
      ${players.length > 1 ? `<button class="remove-player" onclick="removePlayer(${i})">✕</button>` : ''}
    `;
    list.appendChild(row);
  });
}

function addPlayer() {
  if (players.length >= 8) { showToast('Máximo 8 jugadores'); return; }
  players.push({ name: `Jugador ${players.length + 1}`, avatar: players.length });
  renderPlayers();
}

function removePlayer(i) {
  players.splice(i, 1);
  renderPlayers();
}

// ========== CATEGORIES ==========
function renderCats() {
  const grid = document.getElementById('catsGrid');
  grid.innerHTML = '';
  CATEGORIES.forEach((cat, i) => {
    const chip = document.createElement('div');
    chip.className = 'cat-chip' + (selectedCats.includes(i) ? ' selected' : '');
    chip.style.color = selectedCats.includes(i) ? cat.color : '';
    chip.innerHTML = `${cat.emoji} ${cat.name} <span class="cat-check">✓</span>`;
    chip.onclick = () => toggleCat(i, chip, cat);
    grid.appendChild(chip);
  });
}

function toggleCat(i, chip, cat) {
  const idx = selectedCats.indexOf(i);
  if (idx >= 0) { selectedCats.splice(idx, 1); chip.classList.remove('selected'); chip.style.color = ''; }
  else { selectedCats.push(i); chip.classList.add('selected'); chip.style.color = cat.color; }
}

function setDiff(btn) {
  difficulty = btn.dataset.diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ========== PLAYING SCREEN ==========
function loadPlayingScreen(track, cat) {
  // Reset state
  document.getElementById('mysteryWrap').style.display = '';
  document.getElementById('soundWaves').style.display = '';
  document.getElementById('songReveal').classList.add('hidden');
  document.getElementById('revealBtn').classList.remove('hidden');
  document.getElementById('pointBtns').classList.add('hidden');
  document.getElementById('nextBtn').classList.add('hidden');
  document.getElementById('nextBtn').textContent = 'Siguiente ronda →';
  document.getElementById('nextBtn').onclick = nextRound;
  document.getElementById('embedContainer').classList.remove('visible');
  document.getElementById('timerSection').style.display = '';
  // Reset animation states from potential pause
  document.querySelectorAll('.wave-bar').forEach(b => b.style.animationPlayState = 'running');
  document.querySelectorAll('.disco-ball, .mystery-rays').forEach(el => el.style.animationPlayState = 'running');

  // Category tag
  const tag = document.getElementById('playingCat');
  tag.textContent = cat.emoji + ' ' + cat.name;
  tag.style.color = cat.color;
  tag.style.borderColor = cat.color + '40';

  // Song info
  document.getElementById('songName').textContent = track.name;
  document.getElementById('artistName').textContent = track.artist || '';
}

function revealSong() {
  // Stop timer
  clearInterval(timerInterval);
  isPaused = false;

  // Hide mystery, show song info
  document.getElementById('mysteryWrap').style.display = 'none';
  document.getElementById('soundWaves').style.display = 'none';
  document.getElementById('timerSection').style.display = 'none';
  document.getElementById('songReveal').classList.remove('hidden');
  document.getElementById('revealBtn').classList.add('hidden');
  document.getElementById('pointBtns').classList.remove('hidden');
  document.getElementById('nextBtn').classList.remove('hidden');

  // Show the Spotify embed (now reveals the track visually)
  document.getElementById('embedContainer').classList.add('visible');

  renderPointBtns();
}

// ========== SCORING ==========
function renderPointBtns() {
  roundDeltas = {};
  players.forEach(p => { roundDeltas[p.name] = { song: 0, artist: 0, penalty: 0 }; });

  const div = document.getElementById('pointBtns');
  div.innerHTML = '<div style="font-size:0.7rem;font-weight:800;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:0.4rem">¿Quién adivinó?</div>';
  players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'point-player-row';
    row.innerHTML = `
      <div class="point-player-name">${AVATARS[p.avatar % AVATARS.length]} ${p.name}</div>
      <div class="point-actions">
        <button class="pa-btn plus" onclick="toggleDelta('${esc(p.name)}','song',this)">🎵+1</button>
        <button class="pa-btn plus" onclick="toggleDelta('${esc(p.name)}','artist',this)">🎤+1</button>
        <button class="pa-btn minus" onclick="toggleDelta('${esc(p.name)}','penalty',this)">❌-1</button>
      </div>
      <div class="point-score-badge" id="badge-${esc(p.name)}">${scores[p.name] || 0}</div>
    `;
    div.appendChild(row);
  });
}

function esc(s) { return s.replace(/'/g, "\\'"); }

function toggleDelta(playerName, type, btn) {
  const d = roundDeltas[playerName];
  if (type === 'penalty') {
    if (d.penalty === 0) { d.penalty = -1; btn.textContent = '❌-1'; btn.classList.add('active'); }
    else if (d.penalty === -1) { d.penalty = -2; btn.textContent = '❌-2'; }
    else { d.penalty = 0; btn.textContent = '❌-1'; btn.classList.remove('active'); }
  } else {
    if (btn.classList.contains('active')) { d[type] = 0; btn.classList.remove('active'); }
    else { d[type] = 1; btn.classList.add('active'); }
  }

  const net = d.song + d.artist + d.penalty;
  const badge = document.getElementById(`badge-${playerName}`);
  const base = scores[playerName] || 0;
  const preview = Math.max(0, base + net);
  badge.textContent = net !== 0 ? `${base} → ${preview}` : base;
  badge.style.color = net > 0 ? '#4ade80' : net < 0 ? '#f87171' : 'var(--yellow)';

  renderScoreboard();
  checkWinCondition();
}

function applyRoundScores() {
  players.forEach(p => {
    const d = roundDeltas[p.name] || { song: 0, artist: 0, penalty: 0 };
    const net = d.song + d.artist + d.penalty;
    scores[p.name] = Math.max(0, (scores[p.name] || 0) + net);
  });
}

function checkWinCondition() {
  if (round >= MAX_ROUNDS || Object.values(scores).some(s => s >= 10)) {
    document.getElementById('nextBtn').textContent = '🏆 Ver Ganador';
    document.getElementById('nextBtn').onclick = () => { applyRoundScores(); showWinner(); };
  } else {
    document.getElementById('nextBtn').textContent = 'Siguiente ronda →';
    document.getElementById('nextBtn').onclick = nextRound;
  }
}

function nextRound() {
  applyRoundScores();
  stopPlayback();
  clearInterval(timerInterval);
  round++;
  document.getElementById('roundNum').textContent = round;
  goTo('game');
}

// ========== SCOREBOARD ==========
function renderScoreboard() {
  const sb = document.getElementById('scoreboard');
  sb.innerHTML = '';
  const maxPts = Math.max(0, ...Object.values(scores));
  players.forEach(p => {
    const pts = scores[p.name] || 0;
    const card = document.createElement('div');
    card.className = 'score-card' + (pts === maxPts && pts > 0 ? ' winner-glow' : '');
    card.innerHTML = `
      <div class="score-avatar" style="background:${AVATAR_COLORS[p.avatar % AVATAR_COLORS.length]}">${AVATARS[p.avatar % AVATARS.length]}</div>
      <div class="score-name">${p.name}</div>
      <div class="score-pts">${pts}</div>
    `;
    sb.appendChild(card);
  });
}

// ========== WINNER ==========
function showWinner() {
  stopPlayback();
  clearInterval(timerInterval);
  const sorted = players.map(p => ({ ...p, pts: scores[p.name] || 0 })).sort((a, b) => b.pts - a.pts);
  const w = sorted[0];
  document.getElementById('winnerName').textContent = w.name;
  document.getElementById('winnerPts').textContent = `${w.pts} punto${w.pts !== 1 ? 's' : ''}`;
  const fs = document.getElementById('finalScores');
  fs.innerHTML = '';
  ['🥇','🥈','🥉'].forEach((medal, i) => {
    if (!sorted[i]) return;
    const row = document.createElement('div');
    row.className = 'final-row' + (i === 0 ? ' top' : '');
    row.innerHTML = `<div class="rank">${medal}</div><div class="final-name">${AVATARS[sorted[i].avatar % AVATARS.length]} ${sorted[i].name}</div><div class="final-pts">${sorted[i].pts} pts</div>`;
    fs.appendChild(row);
  });
  goTo('winner');
}

function resetGame() {
  scores = {}; round = 1;
  clearInterval(timerInterval);
  players.forEach(p => scores[p.name] = 0);
  usedTrackIds.clear();
  lastArtistName = null;
  goTo('home');
}

function startGame() {
  if (selectedCats.length < 3) { showToast('Selecciona al menos 3 categorías'); return; }
  scores = {}; round = 1;
  usedTrackIds.clear();
  lastArtistName = null;
  players.forEach(p => scores[p.name] = 0);
  buildWheel();
  renderScoreboard();
  goTo('game');
}

// ========== INIT ==========
spawnNotes();
renderPlayers();
renderCats();
