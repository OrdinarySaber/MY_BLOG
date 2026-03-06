// ============================================
// 博客核心功能脚本
// ============================================

const API_BASE = 'http://localhost:5096/api';

class AnimeBlog {
    constructor() {
        this.config = CONFIG;
        this.currentCategory = 'all';
        this.documents = [];
        this.currentDocId = null;
        this.isEditMode = false;
        this.isServerAvailable = false;
        this.currentUser = null;
        this.authToken = localStorage.getItem('authToken');
        this.init();
    }

    async init() {
        await this.checkServerStatus();
        if (this.authToken) {
            await this.validateSession();
        }
        this.setupCursor();
        await this.loadDocumentsFromApi();
        this.renderHeader();
        this.renderHero();
        this.renderCategoryFilter();
        this.renderDocuments();
        this.renderSocialLinks();
        this.setupModal();
        this.setupKeyboardShortcuts();
    }

    async validateSession() {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data;
                console.log('已登录用户:', data.username);
            } else {
                this.authToken = null;
                localStorage.removeItem('authToken');
            }
        } catch (e) {
            console.log('会话验证失败:', e.message);
        }
    }

    async checkServerStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(`${API_BASE}/documents`, { 
                signal: controller.signal,
                method: 'GET'
            });
            clearTimeout(timeoutId);
            this.isServerAvailable = response.ok;
            console.log('服务器状态:', this.isServerAvailable ? '已连接' : '连接失败');
        } catch (e) {
            console.log('服务器检测失败:', e.message);
            this.isServerAvailable = false;
        }
        this.updateServerStatusUI();
    }

    updateServerStatusUI() {
        let statusEl = document.getElementById('server-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'server-status';
            statusEl.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 10002;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusEl);
        }
        
        let html = '';
        if (this.currentUser) {
            html = `
                <span style="color: #4ade80;">●</span>
                <span>${this.currentUser.username}</span>
                ${this.currentUser.isAdmin ? '<span style="color: #c44dff;">[管理员]</span>' : ''}
                <button id="logout-btn" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 4px 10px; border-radius: 10px; cursor: pointer; font-size: 11px;">登出</button>
                ${this.currentUser.isAdmin ? '<button id="admin-btn" style="background: transparent; border: 1px solid #c44dff; color: #c44dff; padding: 4px 10px; border-radius: 10px; cursor: pointer; font-size: 11px;">管理</button>' : ''}
            `;
            statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
            statusEl.style.border = '1px solid rgba(74, 222, 128, 0.3)';
            statusEl.style.color = '#4ade80';
        } else if (this.isServerAvailable) {
            html = `
                <span style="color: #4ade80;">●</span> 服务器已连接
                <button id="login-btn" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 4px 10px; border-radius: 10px; cursor: pointer; font-size: 11px;">登录</button>
            `;
            statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
            statusEl.style.border = '1px solid rgba(74, 222, 128, 0.3)';
            statusEl.style.color = '#4ade80';
        } else {
            html = `<span style="color: #fbbf24;">●</span> 离线模式`;
            statusEl.style.background = 'rgba(251, 191, 36, 0.1)';
            statusEl.style.border = '1px solid rgba(251, 191, 36, 0.3)';
            statusEl.style.color = '#fbbf24';
        }
        
        statusEl.innerHTML = html;
        
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => this.showAdminPanel());
        }
    }

    showLoginModal() {
        const existingModal = document.getElementById('login-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'login-modal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <button class="auth-close">&times;</button>
                <div class="auth-modal-icon">
                    <span>🔐</span>
                </div>
                <h3>欢迎回来</h3>
                <p class="auth-subtitle">请登录您的账户</p>
                <div class="auth-modal-body">
                    <div class="auth-field">
                        <label>用户名</label>
                        <input type="text" id="login-username" placeholder="请输入用户名">
                    </div>
                    <div class="auth-field">
                        <label>密码</label>
                        <input type="password" id="login-password" placeholder="请输入密码">
                    </div>
                    <div id="login-error" class="auth-error"></div>
                    <button id="login-submit" class="auth-submit">登 录</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.auth-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        
        const submitBtn = modal.querySelector('#login-submit');
        const handleLogin = () => this.login();
        submitBtn.addEventListener('click', handleLogin);
        
        modal.querySelector('#login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        
        setTimeout(() => modal.querySelector('#login-username').focus(), 100);
    }

    async login() {
        const modal = document.getElementById('login-modal');
        const username = modal.querySelector('#login-username').value.trim();
        const password = modal.querySelector('#login-password').value;
        const errorEl = modal.querySelector('#login-error');
        
        errorEl.classList.remove('show');
        
        if (!username || !password) {
            errorEl.textContent = '请填写用户名和密码';
            errorEl.classList.add('show');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', data.token);
                modal.remove();
                this.updateServerStatusUI();
            } else {
                errorEl.textContent = '用户名或密码错误';
                errorEl.classList.add('show');
            }
        } catch (e) {
            errorEl.textContent = '登录失败，请检查网络连接';
            errorEl.classList.add('show');
        }
    }

    async logout() {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
        } catch (e) {}
        
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        this.updateServerStatusUI();
        
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) adminPanel.remove();
    }

    async showAdminPanel() {
        const existingPanel = document.getElementById('admin-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }
        
        const panel = document.createElement('div');
        panel.id = 'admin-panel';
        panel.className = 'admin-panel';
        panel.innerHTML = `
            <div class="admin-panel-header">
                <h3>管理面板</h3>
                <button class="admin-panel-close">&times;</button>
            </div>
            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="users">用户管理</button>
                <button class="admin-tab" data-tab="password">修改密码</button>
            </div>
            <div class="admin-panel-body">
                <div id="tab-users" class="admin-tab-content active">
                    <div class="admin-section">
                        <h4>添加新用户</h4>
                        <div class="admin-form">
                            <input type="text" id="new-username" placeholder="用户名">
                            <input type="password" id="new-password" placeholder="密码">
                            <label class="admin-checkbox"><input type="checkbox" id="new-is-admin"> 管理员权限</label>
                            <button id="create-user-btn">创建用户</button>
                        </div>
                    </div>
                    <div class="admin-section">
                        <h4>用户列表</h4>
                        <div id="users-list" class="users-list">加载中...</div>
                    </div>
                </div>
                <div id="tab-password" class="admin-tab-content">
                    <div class="admin-section">
                        <h4>修改密码</h4>
                        <div class="admin-form">
                            <input type="password" id="old-password" placeholder="原密码">
                            <input type="password" id="new-password-change" placeholder="新密码">
                            <input type="password" id="confirm-password" placeholder="确认新密码">
                            <button id="change-password-btn">修改密码</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        
        setTimeout(() => panel.classList.add('open'), 10);
        
        panel.querySelector('.admin-panel-close').addEventListener('click', () => {
            panel.classList.remove('open');
            setTimeout(() => panel.remove(), 300);
        });
        
        panel.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                panel.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                panel.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            });
        });
        
        panel.querySelector('#create-user-btn').addEventListener('click', () => this.createUser());
        panel.querySelector('#change-password-btn').addEventListener('click', () => this.changePassword());
        
        this.loadUsers();
    }

    async loadUsers() {
        const listEl = document.getElementById('users-list');
        if (!listEl) return;
        
        try {
            const response = await fetch(`${API_BASE}/users`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            if (response.ok) {
                const users = await response.json();
                listEl.innerHTML = users.map(u => `
                    <div class="user-item">
                        <span class="user-name">${u.username}</span>
                        <span class="user-role ${u.isAdmin ? 'admin' : ''}">${u.isAdmin ? '管理员' : '普通用户'}</span>
                        <div class="user-actions">
                            ${u.id !== this.currentUser.id ? `
                                <button class="user-action-btn" onclick="blog.toggleUserAdmin(${u.id}, ${!u.isAdmin})" title="${u.isAdmin ? '移除管理员' : '设为管理员'}">
                                    ${u.isAdmin ? '👤' : '👑'}
                                </button>
                                <button class="user-action-btn delete" onclick="blog.deleteUser(${u.id})" title="删除用户">🗑️</button>
                            ` : '<span style="color: var(--muted); font-size: 12px;">当前用户</span>'}
                        </div>
                    </div>
                `).join('');
            } else {
                listEl.innerHTML = '<p style="color: var(--muted);">加载失败</p>';
            }
        } catch (e) {
            listEl.innerHTML = '<p style="color: var(--muted);">加载失败</p>';
        }
    }

    async createUser() {
        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value;
        const isAdmin = document.getElementById('new-is-admin').checked;
        
        if (!username || !password) {
            alert('请填写用户名和密码');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ username, password, isAdmin })
            });
            
            if (response.ok) {
                document.getElementById('new-username').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('new-is-admin').checked = false;
                this.loadUsers();
                alert('用户创建成功！');
            } else {
                const data = await response.json();
                alert(data.error || '创建失败');
            }
        } catch (e) {
            alert('创建失败');
        }
    }

    async deleteUser(userId) {
        if (!confirm('确定要删除这个用户吗？')) return;
        
        try {
            const response = await fetch(`${API_BASE}/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            if (response.ok) {
                this.loadUsers();
                alert('用户已删除');
            } else {
                const data = await response.json();
                alert(data.error || '删除失败');
            }
        } catch (e) {
            alert('删除失败');
        }
    }

    async toggleUserAdmin(userId, makeAdmin) {
        try {
            const response = await fetch(`${API_BASE}/users/${userId}/admin`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ isAdmin: makeAdmin })
            });
            
            if (response.ok) {
                this.loadUsers();
                alert(makeAdmin ? '已设为管理员' : '已移除管理员权限');
            } else {
                const data = await response.json();
                alert(data.error || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    }

    async changePassword() {
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password-change').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!oldPassword || !newPassword || !confirmPassword) {
            alert('请填写所有字段');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('两次输入的新密码不一致');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/auth/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            
            if (response.ok) {
                document.getElementById('old-password').value = '';
                document.getElementById('new-password-change').value = '';
                document.getElementById('confirm-password').value = '';
                alert('密码修改成功！');
            } else {
                const data = await response.json();
                alert(data.error || '修改失败');
            }
        } catch (e) {
            alert('修改失败');
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                if (this.currentDocId) {
                    const doc = this.documents.find(d => d.id === this.currentDocId);
                    if (doc && !doc.file.endsWith('.pdf')) {
                        this.toggleEditMode();
                    }
                }
            }
        });
    }

    async loadDocumentsFromApi() {  
        // 始终使用本地配置，因为更可靠
        // API 主要用于文档编辑和评论功能
        console.log('使用本地配置');
        this.documents = this.config.documents.map((doc, index) => ({
            ...doc,
            id: doc.id || index + 1
        }));
    }

    setupCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        const cursorGlow = document.createElement('div');
        cursorGlow.className = 'cursor-glow';
        document.body.appendChild(cursorGlow);

        let cursorX = 0, cursorY = 0;
        let currentX = 0, currentY = 0;

        document.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
        });

        function animate() {
            currentX += (cursorX - currentX) * 0.15;
            currentY += (cursorY - currentY) * 0.15;
            cursor.style.left = currentX + 'px';
            cursor.style.top = currentY + 'px';
            requestAnimationFrame(animate);
        }
        animate();

        document.querySelectorAll('a, button, .doc-card').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        });
    }

    loadDocuments() {
        this.documents = this.config.documents.map((doc, index) => ({
            ...doc,
            id: doc.id || index + 1
        }));
    }

    renderHeader() {
        const header = document.querySelector('header');
        const { blog, social } = this.config;
        
        header.innerHTML = `
            <div class="logo">
                <img src="${blog.avatar}" alt="${blog.author}" class="logo-avatar">
                <div class="logo-text">
                    <h1>${blog.title}</h1>
                    <p>${blog.subtitle}</p>
                </div>
            </div>
            <nav>
                <a href="#" class="active" data-page="home">🏠 首页</a>
                <a href="#" data-page="docs">📄 文档</a>
                <a href="#" data-page="about">👤 关于</a>
            </nav>
        `;

        header.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                header.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                this.navigateToPage(page);
            });
        });
    }

    navigateToPage(page) {
        const hero = document.querySelector('.hero');
        const categoryFilter = document.querySelector('.category-filter');
        const docGrid = document.querySelector('.doc-grid');
        
        if (page === 'home') {
            hero.style.display = 'block';
            categoryFilter.style.display = 'flex';
            docGrid.style.display = 'grid';
            this.currentCategory = 'all';
            categoryFilter.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            categoryFilter.querySelector('[data-category="all"]').classList.add('active');
            this.renderDocuments();
        } else if (page === 'docs') {
            hero.style.display = 'none';
            categoryFilter.style.display = 'flex';
            docGrid.style.display = 'grid';
            this.currentCategory = 'all';
            this.renderDocuments();
        } else if (page === 'about') {
            hero.style.display = 'block';
            hero.innerHTML = `
                <h2>关于 <span class="highlight">我</span></h2>
                <p>${this.config.blog.description}</p>
                <div style="margin-top: 40px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                    <div style="background: var(--card-bg); padding: 30px; border-radius: 20px; border: 1px solid var(--border);">
                        <h3 style="color: var(--primary); margin-bottom: 20px;">🎯 个人简介</h3>
                        <p style="color: var(--muted); line-height: 1.8;">
                            你好！我是 ${this.config.blog.author}。<br>
                            这是一个基于二次元风格的个人博客系统。<br>
                            用于分享我的学习笔记、项目经验和个人想法。
                        </p>
                        <h3 style="color: var(--secondary); margin: 25px 0 20px;">🔧 技术栈</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            <span style="background: rgba(255,107,157,0.2); color: var(--primary); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem;">Unity</span>
                            <span style="background: rgba(196,77,255,0.2); color: var(--secondary); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem;">C#</span>
                            <span style="background: rgba(77,255,255,0.2); color: var(--tertiary); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem;">JavaScript</span>
                            <span style="background: rgba(255,204,0,0.2); color: var(--accent); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem;">TypeScript</span>
                        </div>
                        <h3 style="color: var(--tertiary); margin: 25px 0 20px;">📬 联系我</h3>
                        <p style="color: var(--muted);">
                            Email: <a href="mailto:${this.config.blog.email || ''}" style="color: var(--primary);">${this.config.blog.email || '未设置'}</a>
                        </p>
                    </div>
                </div>
            `;
            categoryFilter.style.display = 'none';
            docGrid.style.display = 'none';
        }
    }

    renderHero() {
        const hero = document.querySelector('.hero');
        const { blog } = this.config;
        
        hero.innerHTML = `
            <h2>欢迎来到 <span class="highlight">${blog.author}</span> 的世界</h2>
            <p>${blog.description}</p>
        `;
    }

    renderCategoryFilter() {
        const container = document.querySelector('.category-filter');
        const categories = this.config.categories;
        
        const countByCategory = {};
        this.documents.forEach(doc => {
            countByCategory[doc.category] = (countByCategory[doc.category] || 0) + 1;
        });

        let html = `
            <button class="filter-btn active" data-category="all">
                🌟 全部 <span class="count">${this.documents.length}</span>
            </button>
        `;

        categories.forEach(cat => {
            const count = countByCategory[cat.id] || 0;
            if (count > 0) {
                html += `
                    <button class="filter-btn" data-category="${cat.id}" style="--cat-color: ${cat.color}">
                        ${cat.icon} ${cat.name} <span class="count">${count}</span>
                    </button>
                `;
            }
        });

        container.innerHTML = html;

        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.renderDocuments();
            });
        });
    }

    renderDocuments() {
        const container = document.querySelector('.doc-grid');
        const filteredDocs = this.currentCategory === 'all' 
            ? this.documents 
            : this.documents.filter(doc => doc.category === this.currentCategory);

        if (filteredDocs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <h3>暂无文档</h3>
                    <p>该分类下还没有文章哦~</p>
                </div>
            `;
            return;
        }

        const categoryMap = {};
        this.config.categories.forEach(cat => {
            categoryMap[cat.id] = cat;
        });

        container.innerHTML = filteredDocs.map(doc => {
            const cat = categoryMap[doc.category] || { name: '未分类', color: '#999', icon: '📁' };
            const isPDF = doc.file && doc.file.endsWith('.pdf');
            const icon = isPDF ? '📄' : '📝';
            
            return `
                <div class="doc-card" data-doc-id="${doc.id}">
                    <div class="doc-card-header">
                        <span class="doc-category" style="background: ${cat.color}20; color: ${cat.color}; border: 1px solid ${cat.color}40;">
                            ${cat.icon} ${cat.name}
                        </span>
                        <span class="doc-date">${doc.date || ''}</span>
                    </div>
                    <h3>${doc.title}</h3>
                    <p>${doc.description || ''}</p>
                    <div class="doc-tags">
                        ${doc.tags ? doc.tags.map(tag => `<span class="doc-tag">${tag}</span>`).join('') : ''}
                    </div>
                    <div class="doc-icon">${icon}</div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.doc-card').forEach(card => {
            card.addEventListener('click', () => {
                const docId = parseInt(card.dataset.docId);
                console.log('点击了文档卡片, docId:', docId);
                const doc = this.documents.find(d => d.id === docId);
                console.log('找到的文档:', doc);
                if (doc) {
                    this.openDocument(doc);
                }
            });
        });
    }

    renderSocialLinks() {
        const container = document.querySelector('.social-links');
        const social = this.config.social;
        
        const links = [
            { key: 'github', icon: '𝔊', name: 'GitHub', url: social.github, color: '#fff' },
            { key: 'bilibili', icon: '📺', name: 'B站', url: social.bilibili, color: '#00a1d6' },
            { key: 'email', icon: '✉️', name: 'Email', url: social.email, color: '#ff6b9d' },
            { key: 'twitter', icon: '𝕏', name: 'Twitter', url: social.twitter, color: '#1da1f2' },
            { key: 'instagram', icon: '📷', name: 'Instagram', url: social.instagram, color: '#e4405f' },
            { key: 'youtube', icon: '▶️', name: 'YouTube', url: social.youtube, color: '#ff0000' },
            { key: 'telegram', icon: '✈️', name: 'Telegram', url: social.telegram, color: '#0088cc' },
            { key: 'csdn', icon: 'C', name: 'CSDN', url: social.csdn, color: '#fc5531' },
            { key: 'juejin', icon: '⛏️', name: '掘金', url: social.juejin, color: '#007fff' },
            { key: 'zhihu', icon: '知', name: '知乎', url: social.zhihu, color: '#0084ff' }
        ];

        const activeLinks = links.filter(link => link.url);
        
        container.innerHTML = activeLinks.map(link => `
            <a href="${link.url}" class="social-link" target="_blank" title="${link.name}" style="--link-color: ${link.color}">
                <span>${link.icon}</span>
            </a>
        `).join('');
    }

    async openDocument(doc) {
        console.log('打开文档:', doc.title, doc.id);
        const modal = document.querySelector('.modal-overlay');
        const modalTitle = modal.querySelector('.modal-header h2');
        const modalBody = modal.querySelector('.modal-body');

        this.currentDocId = doc.id;
        modalTitle.textContent = doc.title;
        
        const isPDF = doc.file && doc.file.endsWith('.pdf');
        
        if (isPDF) {
            modalBody.innerHTML = `
                <iframe src="${doc.file}" class="pdf-viewer" title="${doc.title}"></iframe>
            `;
            this.updateEditButton(false);
            this.renderComments();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            // 优先尝试从本地文件加载
            try {
                const response = await fetch(doc.file);
                if (response.ok) {
                    const content = await response.text();
                    this.currentDocContent = content;
                    this.currentDocFile = doc.file;
                    modalBody.innerHTML = `<div class="markdown-body">${this.parseMarkdown(content)}</div>`;
                    this.updateEditButton(true, doc.file);
                    this.renderComments();
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    return;
                }
            } catch (e) {
                console.log('本地文件加载失败，尝试API');
            }
            
            // 如果本地文件失败，尝试 API
            try {
                const response = await fetch(`${API_BASE}/documents/${doc.id}`);
                if (response.ok) {
                    const docData = await response.json();
                    this.currentDocContent = docData.content || '';
                    this.currentDocFile = doc.file;
                    modalBody.innerHTML = `<div class="markdown-body">${this.parseMarkdown(this.currentDocContent)}</div>`;
                    this.updateEditButton(true, doc.file);
                    this.renderComments();
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                } else {
                    throw new Error('API请求失败');
                }
            } catch (error) {
                modalBody.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">😢</div>
                        <h3>无法加载文档</h3>
                        <p>请确保文档路径正确: ${doc.file}</p>
                    </div>
                `;
                this.updateEditButton(false);
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    }

    updateEditButton(show, filePath = '') {
        const modal = document.querySelector('.modal-overlay');
        const header = modal.querySelector('.modal-header');
        let editBtn = header.querySelector('.edit-btn');
        
        if (!show) {
            if (editBtn) editBtn.remove();
            return;
        }

        if (!this.currentUser || !this.currentUser.isAdmin) {
            if (editBtn) editBtn.remove();
            return;
        }
        
        if (!editBtn) {
            editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.innerHTML = '✏️ 编辑';
            header.appendChild(editBtn);
            
            editBtn.addEventListener('click', () => this.toggleEditMode());
        }
    }

    async toggleEditMode() {
        const modal = document.querySelector('.modal-overlay');
        const modalBody = modal.querySelector('.modal-body');
        const editBtn = modal.querySelector('.edit-btn');
        
        if (this.isEditMode) {
            const textarea = modalBody.querySelector('textarea');
            if (textarea) {
                const newContent = textarea.value;
                this.currentDocContent = newContent;
                
                try {
                    const headers = { 'Content-Type': 'application/json' };
                    if (this.authToken) {
                        headers['Authorization'] = `Bearer ${this.authToken}`;
                    }
                    
                    const response = await fetch(`${API_BASE}/documents/${this.currentDocId}`, {
                        method: 'PUT',
                        headers: headers,
                        body: JSON.stringify({ content: newContent })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        alert('文档已保存到服务器！');
                    } else if (response.status === 401) {
                        alert('请先登录管理员账户');
                    } else {
                        this.saveDocumentLocal();
                        alert('服务器保存失败，已下载文件到本地');
                    }
                } catch (e) {
                    this.saveDocumentLocal();
                    alert('无法连接到服务器，已下载文件到本地');
                }
                
                modalBody.innerHTML = `<div class="markdown-body">${this.parseMarkdown(newContent)}</div>`;
                editBtn.innerHTML = '✏️ 编辑';
                this.isEditMode = false;
            }
        } else {
            modalBody.innerHTML = `
                <textarea class="md-editor">${this.currentDocContent}</textarea>
            `;
            editBtn.innerHTML = '💾 保存';
            this.isEditMode = true;
            
            const textarea = modalBody.querySelector('textarea');
            textarea.style.cssText = `
                width: 100%;
                height: 70vh;
                background: #1a1a24;
                color: #e0e0e0;
                border: 1px solid #ff6b9d40;
                border-radius: 8px;
                padding: 15px;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 14px;
                line-height: 1.6;
                resize: vertical;
            `;
        }
    }

    saveDocumentLocal() {
        const blob = new Blob([this.currentDocContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = this.currentDocFile ? this.currentDocFile.split('/').pop() : 'document.md';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async renderComments() {
        const modal = document.querySelector('.modal-overlay');
        let commentsSection = modal.querySelector('.comments-section');
        
        if (!commentsSection) {
            const modalBody = modal.querySelector('.modal-body');
            commentsSection = document.createElement('div');
            commentsSection.className = 'comments-section';
            commentsSection.innerHTML = `
                <div class="comments-header">
                    <h4>💬 评论</h4>
                </div>
                <div class="comments-list"></div>
                <div class="comment-form">
                    <input type="text" class="comment-author" placeholder="你的昵称">
                    <textarea class="comment-content" placeholder="写下你的评论..."></textarea>
                    <button class="submit-comment">提交评论</button>
                </div>
            `;
            modalBody.appendChild(commentsSection);
            
            commentsSection.querySelector('.submit-comment').addEventListener('click', () => this.submitComment());
        }
        
        try {
            const response = await fetch(`${API_BASE}/comments/${this.currentDocId}`);
            if (response.ok) {
                const comments = await response.json();
                const listEl = commentsSection.querySelector('.comments-list');
                if (comments.length === 0) {
                    listEl.innerHTML = '<p class="no-comments">暂无评论，快来抢沙发~</p>';
                } else {
                    listEl.innerHTML = comments.map(c => `
                        <div class="comment-item">
                            <div class="comment-header">
                                <span class="comment-author-name">${c.author}</span>
                                <span class="comment-date">${new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <div class="comment-text">${c.content}</div>
                        </div>
                    `).join('');
                }
            }
        } catch (e) {
            console.log('无法加载评论');
        }
    }

    async submitComment() {
        const modal = document.querySelector('.modal-overlay');
        const commentsSection = modal.querySelector('.comments-section');
        const author = commentsSection.querySelector('.comment-author').value.trim();
        const content = commentsSection.querySelector('.comment-content').value.trim();
        
        if (!author || !content) {
            alert('请填写昵称和评论内容');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: this.currentDocId,
                    author: author,
                    content: content
                })
            });
            
            if (response.ok) {
                commentsSection.querySelector('.comment-content').value = '';
                this.renderComments();
            } else {
                alert('评论提交失败');
            }
        } catch (e) {
            alert('无法连接到服务器');
        }
    }

    parseMarkdown(md) {
        let html = md;

        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
        
        return html;
    }

    setupModal() {
        const modal = document.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');

        closeBtn.addEventListener('click', () => this.closeModal());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentDocId = null;
        this.isEditMode = false;
    }
}

class BackgroundAnimation {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        this.initParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initParticles() {
        const count = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                hue: Math.random() * 60 + 280,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    animate() {
        this.ctx.fillStyle = 'rgba(5, 5, 8, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
                p.x = Math.random() * this.canvas.width;
                p.y = Math.random() * this.canvas.height;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.opacity})`;
            this.ctx.fill();
        });

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(196, 77, 255, ${0.08 * (1 - dist / 120)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AnimeBlog();
    new BackgroundAnimation();
});
