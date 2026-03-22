// ========== TIMER STATE ==========
let timerInterval = null;
let timeLeft = 30;
let isPaused = false;
const ROUND_SECONDS = 30;

// ========== SPOTIFY EMBED ==========
let embedController = null;
let spotifyReady = false;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  const el = document.getElementById('embed-iframe');
  const options = { width: '100%', height: '152', uri: 'spotify:track:1uvyZBs4IZYRebHIB1747m' };
  IFrameAPI.createController(el, options, (controller) => {
    embedController = controller;
    spotifyReady = true;
    console.log('[Randomusik] Spotify Embed ready');
  });
};

function playTrack(uri) {
  if (!embedController) { console.warn('Embed not ready'); return; }
  embedController.loadUri(uri);
  setTimeout(() => embedController.play(), 600);
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
  document.getElementById('pauseBtn').textContent = '⏸';
  document.getElementById('pauseBtn').classList.remove('paused');

  timerInterval = setInterval(() => {
    if (isPaused) return;
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 0;
      clearInterval(timerInterval);
      // Auto-reveal when time runs out
      if (!document.getElementById('songReveal').classList.contains('hidden')) return; // already revealed
      revealSong();
    }
    updateTimerUI();
  }, 1000);
}

function updateTimerUI() {
  const circle = document.getElementById('timerCircle');
  const display = document.getElementById('timerValue');
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
  const waves = document.getElementById('soundWaves');
  if (isPaused) {
    isPaused = false;
    btn.textContent = '⏸';
    btn.classList.remove('paused');
    waves.style.animationPlayState = '';
    document.querySelectorAll('.wave-bar').forEach(b => b.style.animationPlayState = 'running');
    document.querySelectorAll('.disco-ball, .mystery-rays').forEach(el => el.style.animationPlayState = 'running');
    if (embedController) { try { embedController.play(); } catch(e) {} }
  } else {
    isPaused = true;
    btn.textContent = '▶';
    btn.classList.add('paused');
    document.querySelectorAll('.wave-bar').forEach(b => b.style.animationPlayState = 'paused');
    document.querySelectorAll('.disco-ball, .mystery-rays').forEach(el => el.style.animationPlayState = 'paused');
    if (embedController) { try { embedController.pause(); } catch(e) {} }
  }
}
