// ========== STATE ==========
let players = [{ name: "Jugador 1", avatar: 0 }, { name: "Jugador 2", avatar: 1 }];
let selectedCats = [0, 1, 2, 3, 4];
let difficulty = "easy";
let scores = {};
let round = 1;
let currentCat = null;
let currentSong = null;
const MAX_ROUNDS = 10;
let roundScored = false;

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
  document.getElementById('replayBtn').classList.add('hidden');
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

function showReplayOption() {
  document.getElementById('timerSection').style.display = 'none';
  document.getElementById('soundWaves').style.display = 'none';
  document.getElementById('replayBtn').classList.remove('hidden');
}

function replayTrack() {
  if (!currentSong) return;
  document.getElementById('replayBtn').classList.add('hidden');
  document.getElementById('timerSection').style.display = '';
  document.getElementById('soundWaves').style.display = '';
  document.querySelectorAll('.wave-bar').forEach(b => b.style.animationPlayState = 'running');
  document.querySelectorAll('.disco-ball, .mystery-rays').forEach(el => el.style.animationPlayState = 'running');
  playTrack(currentSong.uri, () => { startTimer(); });
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
  // nextBtn hidden — aparece solo después de registrar el resultado
  document.getElementById('nextBtn').classList.add('hidden');

  // Show the Spotify embed (now reveals the track visually)
  document.getElementById('embedContainer').classList.add('visible');

  renderPointBtns();
}

// ========== SCORING — MODO COMPETITIVO ==========
function renderPointBtns() {
  roundScored = false;
  const div = document.getElementById('pointBtns');
  div.innerHTML = '<div class="pts-label">¿Quién respondió primero?</div>';

  players.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'player-pick-btn';
    btn.innerHTML = `${AVATARS[p.avatar % AVATARS.length]} ${p.name}`;
    btn.onclick = () => showAnswerOptions(p.name);
    div.appendChild(btn);
  });

  const noneBtn = document.createElement('button');
  noneBtn.className = 'player-pick-btn nobody-btn';
  noneBtn.textContent = '😶 Nadie adivinó  (−1 a todos)';
  noneBtn.onclick = applyNobodyGuessed;
  div.appendChild(noneBtn);
}

function showAnswerOptions(playerName) {
  const div = document.getElementById('pointBtns');
  div.innerHTML = `<div class="pts-label">¿Qué acertó <b>${playerName}</b>?</div>`;

  const b2 = document.createElement('button');
  b2.className = 'player-pick-btn';
  b2.innerHTML = '🎵🎤 Canción + Artista &nbsp;<b>+2</b>';
  b2.onclick = () => applyScore(playerName, 2);
  div.appendChild(b2);

  const b1 = document.createElement('button');
  b1.className = 'player-pick-btn';
  b1.innerHTML = '🎵 Solo uno &nbsp;<b>+1</b>';
  b1.onclick = () => applyScore(playerName, 1);
  div.appendChild(b1);

  const back = document.createElement('button');
  back.className = 'player-pick-btn back-pick-btn';
  back.textContent = '← Volver';
  back.onclick = renderPointBtns;
  div.appendChild(back);
}

function applyScore(playerName, delta) {
  scores[playerName] = Math.max(0, (scores[playerName] || 0) + delta);
  afterScoreApplied();
}

function applyNobodyGuessed() {
  players.forEach(p => {
    scores[p.name] = Math.max(0, (scores[p.name] || 0) - 1);
  });
  afterScoreApplied();
}

function afterScoreApplied() {
  roundScored = true;
  renderScoreboard();
  document.getElementById('pointBtns').classList.add('hidden');
  checkWinCondition();
  document.getElementById('nextBtn').classList.remove('hidden');
}

function checkWinCondition() {
  if (round >= MAX_ROUNDS || Object.values(scores).some(s => s >= 10)) {
    document.getElementById('nextBtn').textContent = '🏆 Ver Ganador';
    document.getElementById('nextBtn').onclick = showWinner;
  } else {
    document.getElementById('nextBtn').textContent = 'Siguiente ronda →';
    document.getElementById('nextBtn').onclick = nextRound;
  }
}

function nextRound() {
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
    const dots = Array.from({ length: 10 }, (_, i) =>
      `<span class="ladder-dot${i < pts ? ' filled' : ''}"></span>`
    ).join('');
    card.innerHTML = `
      <div class="score-avatar" style="background:${AVATAR_COLORS[p.avatar % AVATAR_COLORS.length]}">${AVATARS[p.avatar % AVATARS.length]}</div>
      <div class="score-name">${p.name}</div>
      <div class="ladder-dots">${dots}</div>
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
  scores = {}; round = 1; roundScored = false;
  clearInterval(timerInterval);
  players.forEach(p => scores[p.name] = 0);
  usedTrackIds.clear();
  lastArtistName = null;
  goTo('home');
}

function startGame() {
  if (selectedCats.length < 3) { showToast('Selecciona al menos 3 categorías'); return; }
  scores = {}; round = 1; roundScored = false;
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
