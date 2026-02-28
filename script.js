const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');
let loadProgress = 0;

const loadInterval = setInterval(() => {
    loadProgress += Math.random() * 15;
    if (loadProgress >= 100) {
        loadProgress = 100;
        clearInterval(loadInterval);
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }
    loadingProgress.style.width = loadProgress + '%';
}, 100);

const cursor = document.getElementById('cursor');
const cursorGlow = document.getElementById('cursorGlow');
let cursorX = 0, cursorY = 0;
let currentX = 0, currentY = 0;

document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});

function animateCursor() {
    currentX += (cursorX - currentX) * 0.15;
    currentY += (cursorY - currentY) * 0.15;
    cursor.style.left = currentX + 'px';
    cursor.style.top = currentY + 'px';
    requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button, .character-card, .gallery-item, .skill-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(2)';
        cursor.style.borderColor = 'var(--tertiary)';
    });
    el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.borderColor = 'var(--primary)';
    });
});

const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let bgWidth, bgHeight;
let bgParticles = [];

function resizeBgCanvas() {
    bgWidth = bgCanvas.width = window.innerWidth;
    bgHeight = bgCanvas.height = window.innerHeight;
}

class BgParticle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * bgWidth;
        this.y = Math.random() * bgHeight;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.hue = Math.random() * 60 + 280;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > bgWidth || this.y < 0 || this.y > bgHeight) {
            this.reset();
        }
    }

    draw() {
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        bgCtx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${this.opacity})`;
        bgCtx.fill();
    }
}

function initBgParticles() {
    bgParticles = [];
    const count = Math.floor((bgWidth * bgHeight) / 12000);
    for (let i = 0; i < count; i++) {
        bgParticles.push(new BgParticle());
    }
}

function drawBgConnections() {
    for (let i = 0; i < bgParticles.length; i++) {
        for (let j = i + 1; j < bgParticles.length; j++) {
            const dx = bgParticles[i].x - bgParticles[j].x;
            const dy = bgParticles[i].y - bgParticles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                bgCtx.beginPath();
                bgCtx.strokeStyle = `rgba(196, 77, 255, ${0.1 * (1 - dist / 100)})`;
                bgCtx.lineWidth = 0.5;
                bgCtx.moveTo(bgParticles[i].x, bgParticles[i].y);
                bgCtx.lineTo(bgParticles[j].x, bgParticles[j].y);
                bgCtx.stroke();
            }
        }
    }
}

function animateBg() {
    bgCtx.fillStyle = 'rgba(5, 5, 8, 0.1)';
    bgCtx.fillRect(0, 0, bgWidth, bgHeight);

    bgParticles.forEach(p => {
        p.update();
        p.draw();
    });

    drawBgConnections();
    requestAnimationFrame(animateBg);
}

resizeBgCanvas();
initBgParticles();
animateBg();

const sakuraCanvas = document.getElementById('sakura-canvas');
const sakuraCtx = sakuraCanvas.getContext('2d');
let sakuraWidth, sakuraHeight;
let sakuraPetals = [];

function resizeSakuraCanvas() {
    sakuraWidth = sakuraCanvas.width = window.innerWidth;
    sakuraHeight = sakuraCanvas.height = window.innerHeight;
}

class SakuraPetal {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * sakuraWidth;
        this.y = -20;
        this.size = Math.random() * 12 + 8;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 + 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
        this.opacity = Math.random() * 0.6 + 0.4;
        this.hue = Math.random() * 30 + 330;
    }

    update() {
        this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.y > sakuraHeight + 20) {
            this.reset();
        }
    }

    draw() {
        sakuraCtx.save();
        sakuraCtx.translate(this.x, this.y);
        sakuraCtx.rotate(this.rotation * Math.PI / 180);
        sakuraCtx.globalAlpha = this.opacity;

        sakuraCtx.beginPath();
        sakuraCtx.moveTo(0, -this.size / 2);
        sakuraCtx.bezierCurveTo(
            this.size / 2, -this.size / 2,
            this.size / 2, this.size / 2,
            0, this.size / 2
        );
        sakuraCtx.bezierCurveTo(
            -this.size / 2, this.size / 2,
            -this.size / 2, -this.size / 2,
            0, -this.size / 2
        );
        sakuraCtx.fillStyle = `hsla(${this.hue}, 100%, 85%, 1)`;
        sakuraCtx.fill();

        sakuraCtx.restore();
    }
}

function initSakura() {
    sakuraPetals = [];
    for (let i = 0; i < 50; i++) {
        const petal = new SakuraPetal();
        petal.y = Math.random() * sakuraHeight;
        sakuraPetals.push(petal);
    }
}

function animateSakura() {
    sakuraCtx.clearRect(0, 0, sakuraWidth, sakuraHeight);
    sakuraPetals.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateSakura);
}

resizeSakuraCanvas();
initSakura();
animateSakura();

const parallaxStars = document.getElementById('parallaxStars');
for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.width = Math.random() * 3 + 1 + 'px';
    star.style.height = star.style.width;
    star.style.animationDelay = Math.random() * 2 + 's';
    parallaxStars.appendChild(star);
}

for (let i = 0; i < 3; i++) {
    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting-star';
    shootingStar.style.left = Math.random() * 50 + '%';
    shootingStar.style.top = Math.random() * 50 + '%';
    shootingStar.style.animationDelay = (i * 5 + Math.random() * 5) + 's';
    parallaxStars.appendChild(shootingStar);
}

const floatingEmojis = document.getElementById('floatingEmojis');
const emojis = ['✨', '🌸', '⭐', '💫', '🌙', '💜', '🎀', '🎵', '💖', '🌟'];
for (let i = 0; i < 15; i++) {
    const emoji = document.createElement('div');
    emoji.className = 'float-emoji';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = Math.random() * 100 + '%';
    emoji.style.animationDelay = Math.random() * 15 + 's';
    emoji.style.animationDuration = (15 + Math.random() * 10) + 's';
    floatingEmojis.appendChild(emoji);
}

const progressBar = document.getElementById('progressBar');
window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    progressBar.style.width = progress + '%';
});

const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('active');
            }, index * 100);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

const galleryItems = document.querySelectorAll('.gallery-item');
const modal = document.getElementById('galleryModal');
const modalInner = document.getElementById('modalInner');
const modalClose = document.getElementById('modalClose');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        const bg = item.querySelector('.gallery-bg');
        modalInner.style.background = bg.style.background;
        modalInner.innerHTML = bg.innerHTML;
        modal.classList.add('active');
    });
});

modalClose.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.remove('active');
});

const visualizer = document.getElementById('visualizer');
for (let i = 0; i < 20; i++) {
    const bar = document.createElement('div');
    bar.className = 'viz-bar';
    bar.style.setProperty('--viz-height', (Math.random() * 60 + 20) + 'px');
    bar.style.animationDelay = Math.random() * 0.5 + 's';
    visualizer.appendChild(bar);
}

const musicVisualBg = document.getElementById('musicVisualBg');
for (let i = 0; i < 50; i++) {
    const bar = document.createElement('div');
    bar.className = 'music-bar-bg';
    bar.style.animationDelay = Math.random() * 0.5 + 's';
    musicVisualBg.appendChild(bar);
}

const magneticBtns = document.querySelectorAll('.magnetic-btn');
magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
    });
});

const submitBtn = document.querySelector('.submit-btn');
submitBtn.addEventListener('click', function(e) {
    e.preventDefault();
    this.innerHTML = 'Sent! ✨';
    this.style.background = 'linear-gradient(135deg, #4facfe, #00f2fe)';
    setTimeout(() => {
        this.innerHTML = 'Send Message ✨';
        this.style.background = '';
        document.querySelectorAll('.form-input').forEach(input => input.value = '');
    }, 2000);
});

window.addEventListener('resize', () => {
    resizeBgCanvas();
    initBgParticles();
    resizeSakuraCanvas();
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

let lastScrollY = 0;
window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, i) => {
        const speed = (i % 3 + 1) * 0.1;
        star.style.transform = `translateY(${(currentScrollY - lastScrollY) * speed}px)`;
    });
    lastScrollY = currentScrollY;
});

class MusicPlayer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.analyser = null;
        this.isPlaying = false;
        this.currentSongIndex = 0;
        this.songDuration = 242;
        this.currentTime = 84;
        this.volume = 0.3;
        this.oscillators = [];
        this.currentNoteIndex = 0;
        this.noteInterval = null;

        this.playlist = [
            { name: 'Neon Dreams', duration: '4:02', tempo: 140, key: 'C' },
            { name: 'Cyber Heart', duration: '3:45', tempo: 120, key: 'Am' },
            { name: 'Sakura Bloom', duration: '5:12', tempo: 90, key: 'F' },
            { name: 'Digital Love', duration: '3:58', tempo: 128, key: 'G' }
        ];

        this.melodies = {
            'C': [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
            'Am': [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
            'F': [174.61, 196.00, 220.00, 233.08, 261.63, 293.66, 329.63, 349.23],
            'G': [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99, 392.00]
        };

        this.elements = {
            playBtn: document.querySelector('.control-btn.play-btn'),
            prevBtn: document.querySelector('.control-btn:nth-child(1)'),
            nextBtn: document.querySelector('.control-btn:nth-child(3)'),
            progressTrack: document.querySelector('.progress-track'),
            progressFill: document.querySelector('.progress-fill'),
            currentTimeEl: document.querySelector('.time-display span:first-child'),
            totalTimeEl: document.querySelector('.time-display span:last-child'),
            songTitle: document.querySelector('.song-title'),
            discContainer: document.querySelector('.disc-container'),
            volumeSlider: document.querySelector('.volume-slider')
        };

        this.initElements();
        this.bindEvents();
        this.updatePlaylistUI();
    }

    initElements() {
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'playlist';
        playlistContainer.innerHTML = `
            <h4>♫ PLAYLIST</h4>
            <div class="playlist-items"></div>
        `;

        const musicPlayer = document.querySelector('.music-player');
        musicPlayer.appendChild(playlistContainer);

        this.playlistItems = playlistContainer.querySelector('.playlist-items');

        const volumeControl = document.createElement('div');
        volumeControl.className = 'volume-control';
        volumeControl.innerHTML = `
            <span class="volume-icon">🔊</span>
            <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.3">
        `;
        musicPlayer.querySelector('.music-controls').parentNode.insertBefore(
            volumeControl,
            musicPlayer.querySelector('.visualizer')
        );

        this.elements.volumeSlider = volumeControl.querySelector('.volume-slider');
    }

    bindEvents() {
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn.addEventListener('click', () => this.prevSong());
        this.elements.nextBtn.addEventListener('click', () => this.nextSong());

        this.elements.progressTrack.addEventListener('click', (e) => this.seek(e));

        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.volume = parseFloat(e.target.value);
            if (this.masterGain) {
                this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            }
            this.updateVolumeIcon();
        });
    }

    initAudio() {
        if (this.audioContext) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    playNote(frequency, duration = 0.3, type = 'sine') {
        if (!this.audioContext || !this.isPlaying) return;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + duration);
        
        this.oscillators.push(osc);
    }

    playChord(frequencies, duration = 0.5) {
        frequencies.forEach(freq => this.playNote(freq, duration, 'triangle'));
    }

    playMelody() {
        const song = this.playlist[this.currentSongIndex];
        const melody = this.melodies[song.key];
        const noteInterval = 60000 / song.tempo / 2;

        const playNextNote = () => {
            if (!this.isPlaying) return;

            const noteIndex = this.currentNoteIndex % melody.length;
            const baseFreq = melody[noteIndex];
            
            const pattern = Math.floor(this.currentNoteIndex / 8) % 4;
            
            switch(pattern) {
                case 0:
                    this.playNote(baseFreq, 0.2, 'sine');
                    break;
                case 1:
                    this.playNote(baseFreq, 0.3, 'triangle');
                    this.playNote(baseFreq * 1.5, 0.15, 'sine');
                    break;
                case 2:
                    this.playChord([baseFreq, baseFreq * 1.25, baseFreq * 1.5], 0.4);
                    break;
                case 3:
                    this.playNote(baseFreq, 0.1, 'square');
                    this.playNote(baseFreq * 0.5, 0.3, 'sine');
                    break;
            }
            
            this.currentNoteIndex++;
        };

        playNextNote();
        this.noteInterval = setInterval(playNextNote, noteInterval);

        this.bassInterval = setInterval(() => {
            if (!this.isPlaying) return;
            const bassFreq = melody[Math.floor(this.currentNoteIndex / 4) % melody.length] * 0.25;
            this.playNote(bassFreq, 0.8, 'sine');
        }, noteInterval * 4);
    }

    stopMelody() {
        if (this.noteInterval) {
            clearInterval(this.noteInterval);
            this.noteInterval = null;
        }
        if (this.bassInterval) {
            clearInterval(this.bassInterval);
            this.bassInterval = null;
        }
        this.oscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.oscillators = [];
        this.currentNoteIndex = 0;
    }

    togglePlay() {
        this.initAudio();

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {
            this.elements.playBtn.textContent = '⏸';
            this.elements.discContainer.classList.add('playing');
            this.startProgressSimulation();
            this.playMelody();
        } else {
            this.elements.playBtn.textContent = '▶';
            this.elements.discContainer.classList.remove('playing');
            this.stopProgressSimulation();
            this.stopMelody();
        }
    }

    startProgressSimulation() {
        this.progressInterval = setInterval(() => {
            if (this.currentTime < this.songDuration) {
                this.currentTime += 1;
                this.updateProgressUI();
            } else {
                this.nextSong();
            }
        }, 1000);
    }

    stopProgressSimulation() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }

    seek(e) {
        const rect = this.elements.progressTrack.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.currentTime = Math.floor(percent * this.songDuration);
        this.updateProgressUI();
    }

    updateProgressUI() {
        const progress = (this.currentTime / this.songDuration) * 100;
        this.elements.progressFill.style.width = progress + '%';

        this.elements.currentTimeEl.textContent = this.formatTime(this.currentTime);
        this.elements.totalTimeEl.textContent = this.formatTime(this.songDuration);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    prevSong() {
        this.stopMelody();
        this.currentSongIndex = (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadSong();
        if (this.isPlaying) {
            this.playMelody();
        }
    }

    nextSong() {
        this.stopMelody();
        this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.length;
        this.loadSong();
        if (this.isPlaying) {
            this.playMelody();
        }
    }

    loadSong() {
        const song = this.playlist[this.currentSongIndex];
        this.elements.songTitle.textContent = song.name;
        this.currentTime = 0;
        this.songDuration = parseInt(song.duration.split(':')[0]) * 60 + parseInt(song.duration.split(':')[1]);

        this.updateProgressUI();
        this.updatePlaylistUI();

        if (this.isPlaying) {
            this.currentTime = 0;
            this.updateProgressUI();
        }
    }

    updatePlaylistUI() {
        this.playlistItems.innerHTML = this.playlist.map((song, index) => `
            <div class="playlist-item ${index === this.currentSongIndex ? 'active' : ''}" data-index="${index}">
                <span class="song-name">${index + 1}. ${song.name}</span>
                <span class="song-duration">${song.duration}</span>
            </div>
        `).join('');

        this.playlistItems.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                if (index !== this.currentSongIndex) {
                    this.stopMelody();
                }
                this.currentSongIndex = index;
                this.loadSong();
                if (!this.isPlaying) {
                    this.togglePlay();
                }
            });
        });
    }

    updateVolumeIcon() {
        const icon = document.querySelector('.volume-icon');
        if (this.volume === 0) {
            icon.textContent = '🔇';
        } else if (this.volume < 0.5) {
            icon.textContent = '🔉';
        } else {
            icon.textContent = '🔊';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});
