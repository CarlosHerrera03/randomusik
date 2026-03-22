// ========== WHEEL STATE ==========
let wheelAngle = 0;
let wheelSegments = [];
let spinning = false;

// ========== WHEEL ==========
function buildWheel() {
  wheelSegments = selectedCats.map(i => CATEGORIES[i]);
  drawWheel(wheelAngle);
}

function drawWheel(angle) {
  const canvas = document.getElementById('wheel');
  const ctx = canvas.getContext('2d');
  const cx = 150, cy = 150, r = 145;
  const n = wheelSegments.length;
  const arc = (2 * Math.PI) / n;
  ctx.clearRect(0, 0, 300, 300);
  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = 'rgba(147,51,234,0.5)';
  wheelSegments.forEach((seg, i) => {
    const start = angle + i * arc - Math.PI / 2;
    const end = start + arc;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
    ctx.fillStyle = seg.color + 'cc'; ctx.fill();
    ctx.strokeStyle = '#0a0a0f'; ctx.lineWidth = 2; ctx.stroke();
  });
  ctx.restore();
  // Center
  ctx.beginPath(); ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
  grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🎵', cx, cy);
  // Labels
  wheelSegments.forEach((seg, i) => {
    const mid = angle + i * arc - Math.PI / 2 + arc / 2;
    const lx = cx + r * 0.62 * Math.cos(mid);
    const ly = cy + r * 0.62 * Math.sin(mid);
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(mid + Math.PI / 2);
    ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    const words = seg.name.split(' ');
    if (words.length > 1 && seg.name.length > 10) {
      ctx.font = 'bold 10px Nunito,sans-serif'; ctx.fillText(seg.emoji, 0, -9);
      ctx.font = 'bold 9px Nunito,sans-serif'; ctx.fillText(words[0], 0, 2);
      ctx.fillText(words.slice(1).join(' '), 0, 12);
    } else {
      ctx.font = 'bold 10px Nunito,sans-serif'; ctx.fillText(seg.emoji, 0, -7);
      ctx.font = 'bold 9px Nunito,sans-serif'; ctx.fillText(seg.name, 0, 5);
    }
    ctx.restore();
  });
}

function spinWheel() {
  if (spinning) return;
  spinning = true;
  document.getElementById('spinBtn').disabled = true;

  const n = wheelSegments.length;
  const arc = (2 * Math.PI) / n;
  const winningIdx = Math.floor(Math.random() * n);
  const desiredAngle = ((-winningIdx * arc - arc / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const currentNorm = ((wheelAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  let delta = desiredAngle - currentNorm;
  if (delta <= 0.01) delta += 2 * Math.PI;
  const extraSpins = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
  const targetAngle = wheelAngle + delta + extraSpins;

  const duration = 3500 + Math.random() * 1000;
  const startAngle = wheelAngle;
  const startTime = performance.now();
  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    wheelAngle = startAngle + (targetAngle - startAngle) * easeOut(progress);
    drawWheel(wheelAngle);
    if (progress < 1) { requestAnimationFrame(animate); }
    else { wheelAngle = desiredAngle; drawWheel(wheelAngle); onSpinEnd(winningIdx); }
  }
  requestAnimationFrame(animate);
}

function onSpinEnd(winningIdx) {
  currentCat = wheelSegments[winningIdx];
  showLoading(`${currentCat.emoji} ${currentCat.name}`);

  const track = getTrackFromCatalog(currentCat);
  if (!track) { hideLoading(); showToast('No se encontró canción'); spinning = false; document.getElementById('spinBtn').disabled = false; return; }
  currentSong = track;
  loadPlayingScreen(track, currentCat);

  // Start Spotify playback
  playTrack(track.uri);

  // Small delay to let embed load, then show playing screen + start timer
  setTimeout(() => {
    hideLoading();
    goTo('playing');
    startTimer();
    spinning = false;
    document.getElementById('spinBtn').disabled = false;
  }, 800);
}
