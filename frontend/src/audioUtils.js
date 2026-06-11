let audioCtx = null;
let masterGain = null;
let sfxVolume = 1.0;

export const setSfxVolume = (vol) => {
    sfxVolume = Math.max(0, Math.min(1, vol));
    if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(sfxVolume, audioCtx.currentTime, 0.05);
    }
}

export const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = sfxVolume;
        masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

const playTone = (freq, type, duration, vol = 0.1, slideTo = null, delay = 0) => {
    initAudio();
    if (!audioCtx || sfxVolume === 0) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    const startTime = audioCtx.currentTime + delay;
    const endTime = startTime + duration;

    osc.frequency.setValueAtTime(freq, startTime);
    if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, endTime);
    }
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(startTime);
    osc.stop(endTime + 0.1);
}

const playNoise = (duration, vol = 0.1, filterFreq = null, delay = 0) => {
    initAudio();
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
    const endTime = startTime + duration;

    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);
    
    let lastNode = noise;
    if (filterFreq) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        lastNode.connect(filter);
        lastNode = filter;
    }
    
    lastNode.connect(gain);
    gain.connect(masterGain);
    
    noise.start(startTime);
    noise.stop(endTime + 0.1);
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