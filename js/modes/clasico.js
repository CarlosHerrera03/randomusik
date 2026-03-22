// ========== MODO CLÁSICO — STATE ==========
let clsTurn = 0;        // index of player with current turn
let clsChosen = -1;     // index of chosen player this round
let clsPrevChosen = -1; // blocked player (no-vale-chicle)
let clsEvents = [];     // round events for memorable moments
let clsRound = 0;       // round counter

// ========== INIT ==========
function initClasico() {
  clsTurn = 0;
  clsChosen = -1;
  clsPrevChosen = -1;
  clsEvents = [];
  clsRound = 0;
}

// ========== GAME SCREEN ==========
function renderClasicGameScreen() {
  const sb = document.getElementById('scoreboard');
  const p = players[clsTurn];
  sb.innerHTML = `
    <div class="cls-turn-card">
      <div class="cls-turn-label">Turno de</div>
      <div class="cls-turn-name">
        <span style="background:${AVATAR_COLORS[p.avatar % AVATAR_COLORS.length]}" class="cls-turn-avatar">${AVATARS[p.avatar % AVATARS.length]}</span>
        ${p.name}
      </div>
    </div>
  `;
  document.getElementById('endClasicBtn').classList.remove('hidden');
}

// ========== SPIN END (called from wheel.js) ==========
function onSpinEndClasico(winningIdx) {
  currentCat = wheelSegments[winningIdx];
  const track = getTrackFromCatalog(currentCat);
  if (!track) {
    showToast('No se encontró canción');
    spinning = false;
    document.getElementById('spinBtn').disabled = false;
    return;
  }
  currentSong = track;
  loadPlayingScreen(track, currentCat);
  goTo('playing');
  showClasicChooser();
  spinning = false;
  document.getElementById('spinBtn').disabled = false;
}

// ========== CHOOSER ==========
function showClasicChooser() {
  const chooser = document.getElementById('chooserSection');
  const btns = document.getElementById('chooserBtns');
  btns.innerHTML = '';

  players.forEach((p, i) => {
    if (i === clsTurn) return;
    const btn = document.createElement('button');
    const isBlocked = (i === clsPrevChosen);
    btn.className = 'player-pick-btn' + (isBlocked ? ' disabled-pick' : '');
    btn.innerHTML = `${AVATARS[p.avatar % AVATARS.length]} ${p.name}${isBlocked ? ' <span class="no-chicle">no vale</span>' : ''}`;
    if (isBlocked) {
      btn.disabled = true;
    } else {
      btn.onclick = () => choosePlayer(i);
    }
    btns.appendChild(btn);
  });

  chooser.classList.remove('hidden');
}

function choosePlayer(idx) {
  clsChosen = idx;
  document.getElementById('chooserSection').classList.add('hidden');
  showLoading(`${currentCat.emoji} ${currentCat.name}`);
  playTrack(currentSong.uri, () => {
    hideLoading();
    startTimer();
  });
}

// ========== CONSEQUENCES ==========
function renderClasicConsequences() {
  const div = document.getElementById('pointBtns');
  const chosenName = players[clsChosen].name;
  const senderName = players[clsTurn].name;

  div.innerHTML = `
    <div class="pts-label">¿Qué pasó con <b>${chosenName}</b>?</div>

    <div class="cons-row">
      <button class="cons-btn cons-one" onclick="applyConsequence('one')">
        <span class="cons-icon">🎵</span>
        <span class="cons-main">Solo uno</span>
        <span class="cons-sub">él manda consecuencia</span>
      </button>
      <button class="cons-btn cons-both" onclick="applyConsequence('both')">
        <span class="cons-icon">🎵🎤</span>
        <span class="cons-main">Los dos</span>
        <span class="cons-sub">¡todos pagan!</span>
      </button>
    </div>

    <button class="cons-btn cons-none" onclick="applyConsequence('none')">
      <span class="cons-icon">🚫</span>
      <span class="cons-main">No adivinó nada</span>
      <span class="cons-sub">${chosenName} paga</span>
    </button>

    <div class="cons-divider">¿Tampoco nadie más?</div>

    <button class="cons-btn cons-edge" onclick="applyConsequence('sender')">
      🤷 Ni ${senderName} sabe — ${senderName} paga
    </button>
    <button class="cons-btn cons-edge" onclick="applyConsequence('host')">
      🤷‍♂️ Ni el host sabe — el host paga
    </button>
  `;
}

function applyConsequence(type) {
  clsRound++;

  const chosenName = players[clsChosen].name;
  const senderName = players[clsTurn].name;

  clsEvents.push({
    round: clsRound,
    sender: clsTurn,
    chosen: clsChosen,
    type,
    songName: currentSong ? currentSong.name : '?',
    artist: currentSong ? (currentSong.artist || '') : '',
    category: currentCat ? currentCat.name : ''
  });

  const messages = {
    one:    `🎵 ¡${chosenName} adivino uno!<br>Él/ella elige quién paga`,
    both:   `🎵🎤 ¡${chosenName} lo adivino todo!<br>TODOS pagan`,
    none:   `🚫 ${chosenName} no adivinó<br>${chosenName} paga`,
    sender: `🤷 Nadie supo<br>${senderName} paga`,
    host:   `🤷‍♂️ Ni el host sabe<br>El host paga`,
  };

  const ann = document.getElementById('consequenceAnnouncement');
  ann.innerHTML = messages[type];
  ann.classList.remove('hidden');

  document.getElementById('pointBtns').classList.add('hidden');
  document.getElementById('nextBtn').classList.remove('hidden');
  document.getElementById('nextBtn').textContent = 'Siguiente ronda →';
  document.getElementById('nextBtn').onclick = nextRoundClasico;
}

// ========== NEXT ROUND ==========
function nextRoundClasico() {
  const prevTurn = clsTurn;
  clsTurn = clsChosen;
  clsPrevChosen = prevTurn;
  clsChosen = -1;

  stopPlayback();
  clearInterval(timerInterval);
  round++;
  document.getElementById('roundNum').textContent = round;
  goTo('game');
}

// ========== END GAME ==========
function endClasicGame() {
  stopPlayback();
  clearInterval(timerInterval);

  const moments = generateMemorables();
  const list = document.getElementById('clsMemorableList');
  list.innerHTML = '';

  document.getElementById('clsRoundCount').textContent = clsRound;

  if (moments.length === 0) {
    const li = document.createElement('li');
    li.className = 'cls-moment';
    li.textContent = `Jugaron ${clsRound} ronda${clsRound !== 1 ? 's' : ''} épicas 🎉`;
    list.appendChild(li);
  } else {
    moments.forEach(m => {
      const li = document.createElement('li');
      li.className = 'cls-moment';
      li.innerHTML = m;
      list.appendChild(li);
    });
  }

  goTo('clasico-end');
}

// ========== MEMORABLE MOMENTS ==========
function generateMemorables() {
  const results = [];
  if (clsEvents.length === 0) return results;

  // Counters
  const sendCount = {};  // player sent consequence (type='one', chosen = they chose who pays)
  const paidCount = {};  // player paid (none → chosen, sender → sender)
  const allPaidSongs = []; // songs where type='both'
  let hostCount = 0;

  players.forEach((_, i) => { sendCount[i] = 0; paidCount[i] = 0; });

  // Streak: consecutive rounds where nobody guessed ('none', 'sender', 'host')
  let noGuessStreak = 0;
  let maxNoGuessStreak = 0;

  // Sender consecutive streak: same person had the turn and sent (active role)
  // We track: player who chose well (type='one') — they get to send consequence
  // "Ana mandó consecuencia X veces" = Ana was chosen and got type='one' X times
  const sendStreaks = {};
  players.forEach((_, i) => { sendStreaks[i] = 0; });
  let maxSendStreak = 0;
  let maxSendStreakPlayer = -1;
  let curSendStreakPlayer = -1;
  let curSendStreak = 0;

  clsEvents.forEach((ev) => {
    if (ev.type === 'one') {
      sendCount[ev.chosen]++;
      if (curSendStreakPlayer === ev.chosen) {
        curSendStreak++;
      } else {
        curSendStreakPlayer = ev.chosen;
        curSendStreak = 1;
      }
      if (curSendStreak > maxSendStreak) {
        maxSendStreak = curSendStreak;
        maxSendStreakPlayer = ev.chosen;
      }
    } else {
      curSendStreakPlayer = -1;
      curSendStreak = 0;
    }

    if (ev.type === 'none') paidCount[ev.chosen]++;
    if (ev.type === 'sender') paidCount[ev.sender]++;
    if (ev.type === 'both') allPaidSongs.push(ev.songName);
    if (ev.type === 'host') hostCount++;

    // No-guess streak
    if (ev.type === 'none' || ev.type === 'sender' || ev.type === 'host') {
      noGuessStreak++;
      if (noGuessStreak > maxNoGuessStreak) maxNoGuessStreak = noGuessStreak;
    } else {
      noGuessStreak = 0;
    }
  });

  // Build narratives
  if (maxNoGuessStreak >= 3) {
    results.push(`😶 Nadie supo <b>${maxNoGuessStreak} canciones seguidas</b>`);
  }

  if (maxSendStreak >= 3 && maxSendStreakPlayer >= 0) {
    results.push(`😈 <b>${players[maxSendStreakPlayer].name}</b> mandó consecuencia ${maxSendStreak} veces seguidas`);
  } else {
    const maxSender = players.reduce((best, _, i) =>
      sendCount[i] > sendCount[best] ? i : best, 0);
    if (sendCount[maxSender] >= 3) {
      results.push(`😈 <b>${players[maxSender].name}</b> mandó consecuencias ${sendCount[maxSender]} veces`);
    }
  }

  const maxPaidIdx = players.reduce((best, _, i) =>
    paidCount[i] > paidCount[best] ? i : best, 0);
  if (paidCount[maxPaidIdx] >= 3) {
    results.push(`💸 <b>${players[maxPaidIdx].name}</b> pagó ${paidCount[maxPaidIdx]} veces`);
  }

  if (allPaidSongs.length >= 2) {
    results.push(`🎵🎤 ${allPaidSongs.length} canciones donde <b>todos pagaron</b>`);
  } else if (allPaidSongs.length === 1) {
    results.push(`🎵🎤 En <b>"${allPaidSongs[0]}"</b> todos pagaron`);
  }

  if (hostCount >= 2) {
    results.push(`🤷‍♂️ Ni el host supo <b>${hostCount} canciones</b>`);
  } else if (hostCount === 1) {
    results.push(`🤷‍♂️ Ni el host supo una canción`);
  }

  return results.slice(0, 4);
}
