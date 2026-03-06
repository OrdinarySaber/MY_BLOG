class MusicPlayer {
    constructor(config = {}) {
        this.config = { ...MUSIC_CONFIG, ...config };
        this.playlist = this.config.playlist || [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = this.config.defaultVolume;
        this.isPanelOpen = false;
        this.isPlaylistExpanded = false;
        this.audio = null;
        this.duration = 0;
        this.currentTime = 0;
        
        this.init();
    }

    init() {
        if (!this.config.enabled) return;
        
        this.applyTheme();
        this.render();
        this.bindEvents();
        this.createAudio();
        this.loadSavedState();
        
        if (this.config.showOnLoad) {
            this.show();
        }
    }

    applyTheme() {
        const root = document.documentElement;
        const theme = this.config.theme;
        root.style.setProperty('--mp-primary', theme.primary);
        root.style.setProperty('--mp-secondary', theme.secondary);
        root.style.setProperty('--mp-bg', theme.background);
        root.style.setProperty('--mp-text', theme.text);
        root.style.setProperty('--mp-muted', theme.muted);
    }

    createAudio() {
        this.audio = new Audio();
        this.audio.volume = this.volume;
        this.audio.preload = 'metadata';
        
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.updateTimeDisplay();
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.updateProgress();
        });
        
        this.audio.addEventListener('ended', () => {
            this.next();
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('音频加载错误:', e);
            this.showError('无法加载音频文件');
        });
        
        if (this.playlist.length > 0) {
            this.loadTrack(0);
        }
    }

    render() {
        const widget = document.createElement('div');
        widget.className = `music-player-widget ${this.config.position}`;
        widget.id = 'music-player-widget';
        widget.style.display = 'block';
        widget.style.visibility = 'visible';
        widget.style.opacity = '1';
        
        widget.innerHTML = `
            <button class="music-toggle-btn" id="music-toggle" title="音乐播放器">
                🎵
            </button>
            <div class="music-panel" id="music-panel">
                <div class="music-cover-container">
                    <div class="music-cover-placeholder" id="music-cover">
                        🎵
                    </div>
                </div>
                <div class="music-info">
                    <div class="music-title" id="music-title">未播放</div>
                    <div class="music-artist" id="music-artist">选择一首歌曲开始播放</div>
                </div>
                <div class="music-progress-container">
                    <div class="music-progress-bar" id="music-progress">
                        <div class="music-progress-fill" id="music-progress-fill"></div>
                    </div>
                    <div class="music-time">
                        <span id="music-current-time">0:00</span>
                        <span id="music-duration">0:00</span>
                    </div>
                </div>
                <div class="music-controls">
                    <button class="music-control-btn" id="music-prev" title="上一首">⏮</button>
                    <button class="music-control-btn play-btn" id="music-play" title="播放/暂停">▶</button>
                    <button class="music-control-btn" id="music-next" title="下一首">⏭</button>
                    <button class="music-control-btn" id="music-mode" title="顺序播放">▶️</button>
                </div>
                <div class="music-volume-container">
                    <span class="music-volume-icon" id="volume-icon">🔊</span>
                    <div class="music-volume-slider" id="music-volume">
                        <div class="music-volume-fill" id="music-volume-fill" style="width: ${this.volume * 100}%"></div>
                    </div>
                </div>
                <div class="music-playlist-toggle" id="playlist-toggle">
                    <span>播放列表 (${this.playlist.length})</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="music-playlist" id="music-playlist">
                    ${this.renderPlaylist()}
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
        this.widget = widget;
    }

    renderPlaylist() {
        if (this.playlist.length === 0) {
            return `
                <div class="music-empty-state">
                    <div class="icon">📭</div>
                    <p>播放列表为空</p>
                    <p style="font-size: 0.8rem; margin-top: 5px;">请将音乐文件放入 /music/ 目录</p>
                </div>
            `;
        }
        
        return this.playlist.map((track, index) => `
            <div class="music-playlist-item ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <div class="playlist-item-cover">
                    ${track.cover ? `<img src="${this.config.musicPath}${track.cover}" alt="${track.title}">` : '🎵'}
                </div>
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${track.title}</div>
                    <div class="playlist-item-artist">${track.artist}</div>
                </div>
            </div>
        `).join('');
    }

    bindEvents() {
        const toggleBtn = this.widget.querySelector('#music-toggle');
        const panel = this.widget.querySelector('#music-panel');
        const playBtn = this.widget.querySelector('#music-play');
        const prevBtn = this.widget.querySelector('#music-prev');
        const nextBtn = this.widget.querySelector('#music-next');
        const modeBtn = this.widget.querySelector('#music-mode');
        const progressBar = this.widget.querySelector('#music-progress');
        const volumeSlider = this.widget.querySelector('#music-volume');
        const volumeIcon = this.widget.querySelector('#volume-icon');
        const playlistToggle = this.widget.querySelector('#playlist-toggle');
        const playlist = this.widget.querySelector('#music-playlist');
        
        toggleBtn.addEventListener('click', () => this.togglePanel());
        
        playBtn.addEventListener('click', () => this.togglePlay());
        prevBtn.addEventListener('click', () => this.prev());
        nextBtn.addEventListener('click', () => this.next());
        modeBtn.addEventListener('click', () => this.toggleMode());
        
        progressBar.addEventListener('click', (e) => this.seek(e));
        volumeSlider.addEventListener('click', (e) => this.setVolume(e));
        volumeIcon.addEventListener('click', () => this.toggleMute());
        
        playlistToggle.addEventListener('click', () => {
            this.isPlaylistExpanded = !this.isPlaylistExpanded;
            playlistToggle.classList.toggle('expanded', this.isPlaylistExpanded);
            playlist.classList.toggle('expanded', this.isPlaylistExpanded);
        });
        
        playlist.addEventListener('click', (e) => {
            const item = e.target.closest('.music-playlist-item');
            if (item) {
                const index = parseInt(item.dataset.index);
                this.loadTrack(index);
                this.play();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.code) {
                case 'Space':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.togglePlay();
                    }
                    break;
                case 'ArrowLeft':
                    if (e.ctrlKey && e.altKey) {
                        e.preventDefault();
                        this.prev();
                    }
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey && e.altKey) {
                        e.preventDefault();
                        this.next();
                    }
                    break;
            }
        });
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentIndex = index;
        const track = this.playlist[index];
        
        this.audio.src = this.config.musicPath + track.file;
        this.audio.load();
        
        this.updateTrackInfo(track);
        this.updatePlaylistUI();
        this.saveState();
    }

    updateTrackInfo(track) {
        const titleEl = this.widget.querySelector('#music-title');
        const artistEl = this.widget.querySelector('#music-artist');
        const coverEl = this.widget.querySelector('#music-cover');
        
        titleEl.textContent = track.title;
        artistEl.textContent = track.artist;
        
        if (track.cover) {
            coverEl.innerHTML = `<img src="${this.config.musicPath}${track.cover}" class="music-cover ${this.isPlaying ? 'playing' : ''}" alt="${track.title}">`;
        } else {
            coverEl.innerHTML = '🎵';
            coverEl.className = `music-cover-placeholder ${this.isPlaying ? 'playing' : ''}`;
        }
    }

    updatePlaylistUI() {
        const items = this.widget.querySelectorAll('.music-playlist-item');
        items.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentIndex);
        });
    }

    play() {
        if (this.playlist.length === 0) return;
        
        const playBtn = this.widget.querySelector('#music-play');
        const coverEl = this.widget.querySelector('#music-cover');
        const toggleBtn = this.widget.querySelector('#music-toggle');
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            playBtn.innerHTML = '⏸';
            coverEl.classList.add('playing');
            toggleBtn.classList.add('playing');
            this.saveState();
        }).catch(err => {
            console.error('播放失败:', err);
        });
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        
        const playBtn = this.widget.querySelector('#music-play');
        const coverEl = this.widget.querySelector('#music-cover');
        const toggleBtn = this.widget.querySelector('#music-toggle');
        
        playBtn.innerHTML = '▶';
        coverEl.classList.remove('playing');
        toggleBtn.classList.remove('playing');
        this.saveState();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    prev() {
        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) {
            newIndex = this.playlist.length - 1;
        }
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    next() {
        let newIndex = this.currentIndex + 1;
        if (newIndex >= this.playlist.length) {
            newIndex = 0;
        }
        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    toggleMode() {
        const modes = ['顺序播放', '单曲循环', '随机播放'];
        const icons = ['▶️', '🔂', '🔀'];
        const currentMode = this.playMode || 0;
        const nextMode = (currentMode + 1) % 3;
        this.playMode = nextMode;
        
        const modeBtn = this.widget.querySelector('#music-mode');
        modeBtn.innerHTML = icons[nextMode];
        modeBtn.title = modes[nextMode];
        
        this.audio.loop = nextMode === 1;
    }

    seek(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * this.duration;
        
        this.audio.currentTime = time;
        this.currentTime = time;
        this.updateProgress();
    }

    setVolume(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.volume = Math.max(0, Math.min(1, percent));
        
        this.audio.volume = this.volume;
        this.updateVolumeUI();
        this.saveState();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        this.updateVolumeUI();
    }

    updateVolumeUI() {
        const volumeFill = this.widget.querySelector('#music-volume-fill');
        const volumeIcon = this.widget.querySelector('#volume-icon');
        
        const displayVolume = this.isMuted ? 0 : this.volume;
        volumeFill.style.width = `${displayVolume * 100}%`;
        
        if (this.isMuted || this.volume === 0) {
            volumeIcon.textContent = '🔇';
        } else if (this.volume < 0.5) {
            volumeIcon.textContent = '🔉';
        } else {
            volumeIcon.textContent = '🔊';
        }
    }

    updateProgress() {
        const progressFill = this.widget.querySelector('#music-progress-fill');
        const currentTimeEl = this.widget.querySelector('#music-current-time');
        
        if (this.duration > 0) {
            const percent = (this.currentTime / this.duration) * 100;
            progressFill.style.width = `${percent}%`;
        }
        
        currentTimeEl.textContent = this.formatTime(this.currentTime);
    }

    updateTimeDisplay() {
        const durationEl = this.widget.querySelector('#music-duration');
        durationEl.textContent = this.formatTime(this.duration);
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    togglePanel() {
        this.isPanelOpen = !this.isPanelOpen;
        const panel = this.widget.querySelector('#music-panel');
        panel.classList.toggle('active', this.isPanelOpen);
    }

    show() {
        this.widget.style.display = 'block';
        this.widget.style.visibility = 'visible';
        this.widget.style.opacity = '1';
    }

    hide() {
        this.widget.style.display = 'none';
    }

    showError(message) {
        const titleEl = this.widget.querySelector('#music-title');
        const artistEl = this.widget.querySelector('#music-artist');
        titleEl.textContent = '错误';
        artistEl.textContent = message;
    }

    saveState() {
        const state = {
            currentIndex: this.currentIndex,
            volume: this.volume,
            isPlaying: this.isPlaying,
            currentTime: this.currentTime
        };
        localStorage.setItem('musicPlayerState', JSON.stringify(state));
    }

    loadSavedState() {
        const saved = localStorage.getItem('musicPlayerState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.volume = state.volume || this.config.defaultVolume;
                this.audio.volume = this.volume;
                this.updateVolumeUI();
                
                if (state.currentIndex !== undefined && state.currentIndex < this.playlist.length) {
                    this.loadTrack(state.currentIndex);
                    if (state.currentTime) {
                        this.audio.currentTime = state.currentTime;
                    }
                }
                
                if (this.config.autoPlay && state.isPlaying) {
                    this.play();
                }
            } catch (e) {
                console.error('加载播放状态失败:', e);
            }
        }
    }

    addTrack(track) {
        this.playlist.push(track);
        this.updatePlaylist();
    }

    removeTrack(index) {
        if (index === this.currentIndex) {
            this.pause();
            if (this.playlist.length > 1) {
                this.next();
            }
        }
        this.playlist.splice(index, 1);
        if (this.currentIndex > index) {
            this.currentIndex--;
        }
        this.updatePlaylist();
    }

    updatePlaylist() {
        const playlistEl = this.widget.querySelector('#music-playlist');
        const toggleEl = this.widget.querySelector('#playlist-toggle span');
        
        playlistEl.innerHTML = this.renderPlaylist();
        toggleEl.textContent = `播放列表 (${this.playlist.length})`;
        this.updatePlaylistUI();
    }

    destroy() {
        this.pause();
        this.widget.remove();
        localStorage.removeItem('musicPlayerState');
    }
}

let musicPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof MUSIC_CONFIG !== 'undefined') {
        musicPlayer = new MusicPlayer(MUSIC_CONFIG);
    }
});
