export function playBeep(frequency = 880, durationMs = 180, type: OscillatorType = 'sine') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = 0.06;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, durationMs);
  } catch {
    // noop
  }
}

export function playPhaseChange(phase: 'work' | 'rest' | 'idle' | 'finished') {
  if (phase === 'work') {
    playBeep(1046, 120, 'square');
    setTimeout(() => playBeep(1318, 160, 'square'), 130);
  } else if (phase === 'rest') {
    playBeep(659, 160, 'triangle');
  } else if (phase === 'finished') {
    playBeep(784, 150, 'sine');
    setTimeout(() => playBeep(880, 180, 'sine'), 170);
    setTimeout(() => playBeep(988, 220, 'sine'), 360);
  }
}

export function playCountdown321() {
  // 3 bips identiques, espacés ~700ms
  const freq = 800;
  playBeep(freq, 120, 'sine');
  setTimeout(() => playBeep(freq, 120, 'sine'), 700);
  setTimeout(() => playBeep(freq, 120, 'sine'), 1400);
}

export function playClap10sRemaining() {
  // 4 claps successifs à 10s restantes
  const base = 500;
  playBeep(base, 90, 'square');
  setTimeout(() => playBeep(base, 90, 'square'), 140);
  setTimeout(() => playBeep(base, 90, 'square'), 280);
  setTimeout(() => playBeep(base, 90, 'square'), 420);
}

export function playBellAtZero() {
  // son de cloche simple à 0:00
  playBeep(587, 160, 'sine');
  setTimeout(() => playBeep(523, 240, 'sine'), 180);
}


