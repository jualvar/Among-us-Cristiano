// Bible Us - Motor de Sonido y Pista en Piano de "Sublime Gracia"
// Pista acústica auténtica de piano + Efectos procedurales para cada acción del Arca

class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.pianoAudio = null;
        this.sfxGain = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.40;
            this.sfxGain.connect(this.ctx.destination);

            this.isInitialized = true;
            this.startPianoMusic();
        } catch (e) {
            console.warn('Audio waiting for interaction', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- REPRODUCCIÓN DE LA PISTA EN PIANO DE SUBLIME GRACIA ---
    startPianoMusic() {
        if (!this.pianoAudio) {
            this.pianoAudio = document.getElementById('pianoAudio');
            if (!this.pianoAudio) {
                this.pianoAudio = new Audio('/sublime_gracia_piano.ogg');
                this.pianoAudio.loop = true;
            }
            this.pianoAudio.volume = 0.40;
        }

        if (!this.isMuted) {
            this.pianoAudio.play().catch(() => {
                // Desbloqueo en el primer toque de usuario
                const unlock = () => {
                    if (!this.isMuted && this.pianoAudio) {
                        this.pianoAudio.play().catch(() => {});
                    }
                };
                window.addEventListener('click', unlock, { once: true });
                window.addEventListener('touchstart', unlock, { once: true });
            });
        }
    }

    // --- EFECTOS DE SONIDO PROCEDURALES BÍBLICOS (CERO LATENCIA) ---

    // Click / Toque táctil
    playClick() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // Pasos sobre tablones de madera del Arca
    playFootstep() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const pitch = 85 + Math.random() * 25;
        osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    }

    // Conducto de ventilación (Túnel subterráneo)
    playVent() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

        filter.type = 'lowpass';
        filter.frequency.value = 500;

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    // Cuerno Shofar / Alerta de Emergencia
    playEmergency() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        [0, 0.45, 0.9].forEach(delay => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(350, now + delay);
            osc.frequency.linearRampToValueAtTime(466.16, now + delay + 0.12);
            osc.frequency.linearRampToValueAtTime(350, now + delay + 0.38);

            gain.gain.setValueAtTime(0.32, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.42);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1100;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + delay);
            osc.stop(now + delay + 0.42);
        });
    }

    // Trueno distante para la tormenta
    playThunder() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 1.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.5));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, now);
        filter.frequency.exponentialRampToValueAtTime(45, now + 1.4);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
    }

    // Tarea Bíblica Completada (Campanas Celestiales de Victoria)
    playTaskComplete() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const arpeggio = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do agudo
        arpeggio.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const t = now + idx * 0.09;
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(t);
            osc.stop(t + 0.6);
        });
    }

    // Sonido de sellado con brea caliente
    playSizzle() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Sabotaje de Judas
    playKill() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    // Campana de inicio de reunión de oración y consejo
    playMeetingBell() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;
        [587.33, 880].forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 1.2);
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.pianoAudio) {
            if (this.isMuted) {
                this.pianoAudio.pause();
            } else {
                this.pianoAudio.play().catch(() => {});
            }
        }
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.isMuted ? 0 : 0.40;
        }
        return this.isMuted;
    }
}

window.gameAudio = new AudioManager();
