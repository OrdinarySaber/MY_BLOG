// ============================================
// 博客核心功能脚本
// ============================================

class AnimeBlog {
    constructor() {
        this.config = CONFIG;
        this.currentCategory = 'all';
        this.documents = [];
        this.init();
    }

    async init() {
        this.setupCursor();
        this.loadDocuments();
        this.renderHeader();
        this.renderHero();
        this.renderCategoryFilter();
        this.renderDocuments();
        this.renderSocialLinks();
        this.setupModal();
    }

    // 自定义光标
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

    // 加载文档列表
    loadDocuments() {
        this.documents = this.config.documents.map((doc, index) => ({
            ...doc,
            id: doc.id || index + 1
        }));
    }

    // 渲染头部
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
                header.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    // 渲染 Hero 区域
    renderHero() {
        const hero = document.querySelector('.hero');
        const { blog } = this.config;
        
        hero.innerHTML = `
            <h2>欢迎来到 <span class="highlight">${blog.author}</span> 的世界</h2>
            <p>${blog.description}</p>
        `;
    }

    // 渲染分类筛选
    renderCategoryFilter() {
        const container = document.querySelector('.category-filter');
        const categories = this.config.categories;
        
        // 计算每个分类的文档数量
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

    // 渲染文档列表
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
            const isPDF = doc.file.endsWith('.pdf');
            const icon = isPDF ? '📄' : '📝';
            
            return `
                <div class="doc-card" data-doc-id="${doc.id}">
                    <div class="doc-card-header">
                        <span class="doc-category" style="background: ${cat.color}20; color: ${cat.color}; border: 1px solid ${cat.color}40;">
                            ${cat.icon} ${cat.name}
                        </span>
                        <span class="doc-date">${doc.date}</span>
                    </div>
                    <h3>${doc.title}</h3>
                    <p>${doc.description}</p>
                    <div class="doc-tags">
                        ${doc.tags ? doc.tags.map(tag => `<span class="doc-tag">${tag}</span>`).join('') : ''}
                    </div>
                    <div class="doc-icon">${icon}</div>
                </div>
            `;
        }).join('');

        // 添加点击事件
        container.querySelectorAll('.doc-card').forEach(card => {
            card.addEventListener('click', () => {
                const docId = parseInt(card.dataset.docId);
                const doc = this.documents.find(d => d.id === docId);
                if (doc) {
                    this.openDocument(doc);
                }
            });
        });
    }

    // 渲染社交链接
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

    // 打开文档
    async openDocument(doc) {
        const modal = document.querySelector('.modal-overlay');
        const modalTitle = modal.querySelector('.modal-header h2');
        const modalBody = modal.querySelector('.modal-body');

        modalTitle.textContent = doc.title;
        
        const isPDF = doc.file.endsWith('.pdf');
        
        if (isPDF) {
            modalBody.innerHTML = `
                <iframe src="${doc.file}" class="pdf-viewer" title="${doc.title}"></iframe>
            `;
        } else {
            // 尝试加载 Markdown 文件
            try {
                const response = await fetch(doc.file);
                const content = await response.text();
                modalBody.innerHTML = `<div class="markdown-body">${this.parseMarkdown(content)}</div>`;
            } catch (error) {
                modalBody.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">😢</div>
                        <h3>无法加载文档</h3>
                        <p>请确保文档路径正确: ${doc.file}</p>
                    </div>
                `;
            }
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 简单的 Markdown 解析器
    parseMarkdown(md) {
        let html = md;

        // 代码块
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
        
        // 行内代码
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 标题
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // 粗体和斜体
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // 链接
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // 图片
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
        
        // 引用
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // 无序列表
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // 有序列表
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        
        // 水平线
        html = html.replace(/^---$/gm, '<hr>');
        
        // 段落
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // 清理空段落
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

    // 设置模态框
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
    }
}

// 背景 Canvas 动画
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

        // 绘制连接线
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new AnimeBlog();
    new BackgroundAnimation();
});
