// ========== TIMER STATE ==========
let timerInterval = null;
let timeLeft = 30;
let isPaused = false;
const ROUND_SECONDS = 30;

// ========== SPOTIFY EMBED ==========
let embedController = null;
let spotifyReady = false;
let currentPositionMs = 0;
let waitingForPlayback = false;
let onPlaybackStartedCb = null;
let playbackFallbackTimer = null;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  const el = document.getElementById('embed-iframe');
  const options = { width: '100%', height: '152', uri: 'spotify:track:1uvyZBs4IZYRebHIB1747m' };
  IFrameAPI.createController(el, options, (controller) => {
    embedController = controller;
    spotifyReady = true;
    console.log('[Randomusik] Spotify Embed ready');

    controller.addListener('playback_update', (e) => {
      if (!e.data.isPaused) {
        currentPositionMs = e.data.position;
      }
      if (waitingForPlayback && !e.data.isPaused && e.data.position > 0) {
        waitingForPlayback = false;
        clearTimeout(playbackFallbackTimer);
        fadeIn(300);
        if (onPlaybackStartedCb) {
          const cb = onPlaybackStartedCb;
          onPlaybackStartedCb = null;
          cb();
        }
      }
    });
  });
};

// ========== VOLUME FADES ==========
function fadeIn(duration) {
  if (!embedController) return;
  let vol = 0;
  try { embedController.setVolume(0); } catch(e) {}
  const steps = 8;
  const interval = duration / steps;
  const tick = setInterval(() => {
    vol = Math.min(1, vol + 1 / steps);
    try { embedController.setVolume(vol); } catch(e) {}
    if (vol >= 1) clearInterval(tick);
  }, interval);
}

function fadeOut(duration, onDone) {
  if (!embedController) { if (onDone) onDone(); return; }
  let vol = 1;
  const steps = 8;
  const interval = duration / steps;
  const tick = setInterval(() => {
    vol = Math.max(0, vol - 1 / steps);
    try { embedController.setVolume(vol); } catch(e) {}
    if (vol <= 0) {
      clearInterval(tick);
      if (onDone) onDone();
    }
  }, interval);
}

function playTrack(uri, onStarted) {
  if (!embedController) { console.warn('Embed not ready'); return; }
  waitingForPlayback = true;
  currentPositionMs = 0;
  onPlaybackStartedCb = onStarted || null;
  try { embedController.setVolume(0); } catch(e) {}
  embedController.loadUri(uri);
  setTimeout(() => embedController.play(), 400);

  // Fallback: if playback hasn't started in 8s, proceed anyway
  clearTimeout(playbackFallbackTimer);
  if (onStarted) {
    playbackFallbackTimer = setTimeout(() => {
      if (waitingForPlayback) {
        waitingForPlayback = false;
        onPlaybackStartedCb = null;
        fadeIn(300);
        onStarted();
      }
    }, 8000);
  }
}

function stopPlayback() {
  if (embedController) { try { embedController.pause(); } catch(e) {} }
}

// ========== TIMER ==========
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = ROUND_SECONDS;
  isPaused = false;
  updateTimerUI();
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) { pauseBtn.textContent = '⏸'; pauseBtn.classList.remove('paused'); }

  timerInterval = setInterval(() => {
    if (isPaused) return;
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerUI();
      clearInterval(timerInterval);
      fadeOut(300, () => {
        stopPlayback();
        try { embedController.setVolume(1); } catch(e) {}
        showReplayOption();
      });
      return;
    }
    updateTimerUI();
  }, 1000);
}

function updateTimerUI() {
  const circle = document.getElementById('timerCircle');
  const display = document.getElementById('timerValue');
  if (!circle || !display) return;
  const circumference = 2 * Math.PI * 18.5; // 116.24
  const progress = timeLeft / ROUND_SECONDS;
  circle.style.strokeDashoffset = circumference * (1 - progress);

  circle.classList.remove('warning', 'danger');
  display.classList.remove('warning', 'danger');
  if (timeLeft <= 5) { circle.classList.add('danger'); display.classList.add('danger'); }
  else if (timeLeft <= 10) { circle.classList.add('warning'); display.classList.add('warning'); }

  display.textContent = timeLeft;
}

function togglePause() {
  const btn = document.getElementById('pauseBtn');
  if (isPaused) {
    isPaused = false;
    if (btn) { btn.textContent = '⏸'; btn.classList.remove('paused'); }
    document.querySelectorAll('.wave-bar').forEach(b => b.style.animationPlayState = 'running');
    document.querySelectorAll('.disco-ball, .mystery-rays').forEach(el => el.style.animationPlayState = 'running');
    if (embedController) {
      try {
        embedController.seek(currentPositionMs / 1000);
        embedController.play();
      } catch(e) {}
    }
  } else {
    isPaused = true;
    if (btn) { btn.textContent = '▶'; btn.classList.add('paused'); }
    document.querySelectorAll('.wave-bar').forEach(b => b.style.animationPlayState = 'paused');
    document.querySelectorAll('.disco-ball, .mystery-rays').forEach(el => el.style.animationPlayState = 'paused');
    if (embedController) { try { embedController.pause(); } catch(e) {} }
  }
}
