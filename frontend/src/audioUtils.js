let audioCtx = null;
let sfxVolume = 1.0; // Global multiplier for SFX

export const setSfxVolume = (vol) => {
    sfxVolume = Math.max(0, Math.min(1, vol));
}

export const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Helper to play simple oscillator tones
const playTone = (freq, type, duration, vol = 0.1, slideTo = null, delay = 0) => {
    if (!audioCtx || sfxVolume === 0) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    
    const startTime = audioCtx.currentTime + delay;
    osc.frequency.setValueAtTime(freq, startTime);
    if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, startTime + duration);
    }
    
    const finalVol = vol * sfxVolume;
    gain.gain.setValueAtTime(finalVol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
}

// Helper to play white noise (for hits, fire, grass)
const playNoise = (duration, vol = 0.1, filterFreq = null, delay = 0) => {
    if (!audioCtx || sfxVolume === 0) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = audioCtx.createGain();
    const startTime = audioCtx.currentTime + delay;
    const finalVol = vol * sfxVolume;
    gain.gain.setValueAtTime(finalVol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    if (filterFreq) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        noise.connect(filter);
        filter.connect(gain);
    } else {
        noise.connect(gain);
    }
    
    gain.connect(audioCtx.destination);
    noise.start(startTime);
}

// UI Sounds
export const playMenuClick = () => { initAudio(); playTone(600, 'square', 0.1, 0.05); }
export const playMenuHover = () => { initAudio(); playTone(800, 'sine', 0.05, 0.02); }
export const playMenuCancel = () => { initAudio(); playTone(300, 'square', 0.15, 0.05); }
export const playStartGame = () => { initAudio(); playTone(440, 'square', 0.1, 0.05, 880); }

// Battle Event Sounds
export const playDamage = () => {
    initAudio();
    if (!audioCtx) return;
    playNoise(0.2, 0.1);
}

export const playSuperEffective = () => {
    initAudio();
    if (!audioCtx) return;
    playTone(800, 'square', 0.1, 0.1, 1200);
    playNoise(0.3, 0.15);
}

export const playFaint = () => {
    initAudio();
    if (!audioCtx) return;
    playTone(300, 'sawtooth', 0.8, 0.1, 50);
}

// Elemental Attack Sounds
export const playAttackSound = (elementType, isHeal) => {
    initAudio();
    if (isHeal) {
        // Ascending magical arpeggio
        playTone(400, 'sine', 0.1, 0.1, 600, 0);
        playTone(500, 'sine', 0.1, 0.1, 700, 0.1);
        playTone(600, 'sine', 0.2, 0.1, 800, 0.2);
        return;
    }

    switch(elementType) {
        case 'Electric':
            // Zap: fast frequency modulation square waves
            playTone(800, 'square', 0.1, 0.05, 200, 0);
            playTone(900, 'square', 0.1, 0.05, 300, 0.05);
            playTone(700, 'square', 0.1, 0.05, 100, 0.1);
            break;
        case 'Fire':
            // Whoosh: Filtered noise that sweeps up then down
            playNoise(0.4, 0.3, 800);
            playTone(100, 'sawtooth', 0.3, 0.05, 50);
            break;
        case 'Water':
            // Bloop bloop: descending sine waves
            playTone(400, 'sine', 0.15, 0.2, 200, 0);
            playTone(300, 'sine', 0.15, 0.2, 100, 0.15);
            break;
        case 'Grass':
            // Rustle / Slice: High frequency noise bursts
            playNoise(0.15, 0.2, 3000, 0);
            playNoise(0.15, 0.2, 2500, 0.2);
            break;
        case 'Ground':
            // Rumble: Deep square/saw wave + low frequency noise
            playTone(80, 'square', 0.5, 0.2, 30);
            playNoise(0.5, 0.3, 300);
            break;
        default:
            // Normal hit: simple thud
            playTone(300, 'square', 0.2, 0.1, 100);
    }
}