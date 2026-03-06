# 项目配置指南

## 启动命令

### 启动服务器
```bash
cd h:\TARE_Project\WEBTEST\BlogApi
dotnet run
```

服务器启动后访问: http://localhost:5096

## 默认账户

### 管理员账户
- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
WEBTEST/
├── index.html          # 主页面
├── script.js           # 前端逻辑
├── style.css           # 样式文件
├── config.js           # 博客配置
├── docs/               # 文档目录
│   ├── unity-game-notes.md
│   ├── 服务器配置指南.md
│   ├── 博客配置指南.md
│   ├── 2024-summary.md
│   └── ts-advanced.md
└── BlogApi/            # 后端API
    ├── Program.cs      # 主程序
    ├── users.json      # 用户数据
    ├── sessions.json   # 会话数据
    └── comments.json   # 评论数据
```

## API 端点

### 认证相关
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码

### 用户管理 (需要管理员权限)
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `DELETE /api/users/{id}` - 删除用户
- `PUT /api/users/{id}/admin` - 设置管理员权限

### 文档相关
- `GET /api/documents` - 获取文档列表
- `GET /api/documents/{id}` - 获取文档详情
- `PUT /api/documents/{id}` - 保存文档 (需要管理员权限)

### 评论相关
- `GET /api/comments` - 获取所有评论
- `GET /api/comments/{docId}` - 获取文档评论
- `POST /api/comments` - 发表评论
- `DELETE /api/comments/{id}` - 删除评论 (需要管理员权限)

## 功能说明

1. **编辑权限**: 只有管理员可以编辑文档
2. **评论功能**: 任何人都可以发表评论
3. **用户管理**: 管理员可以添加/删除用户、设置管理员权限
4. **音乐播放器**: 独立的音乐播放模块，支持本地音乐文件播放

## 音乐播放器

### 使用方法

1. 将音乐文件（mp3格式）放入 `music/` 目录
2. 编辑 `music-config.js` 配置播放列表
3. 刷新页面即可看到音乐播放器按钮（右下角）

### 配置说明

编辑 `music-config.js` 文件：

```javascript
const MUSIC_CONFIG = {
    enabled: true,           // 是否启用播放器
    autoPlay: false,         // 是否自动播放
    defaultVolume: 0.5,      // 默认音量 (0-1)
    showOnLoad: true,        // 页面加载时显示
    position: 'bottom-right', // 位置: bottom-right, bottom-left, top-right, top-left
    musicPath: '/music/',    // 音乐文件路径
    playlist: [
        {
            id: 1,
            title: '歌曲名称',
            artist: '艺术家',
            file: 'music1.mp3',  // 文件名
            cover: null          // 封面图片（可选）
        }
    ]
};
```

### 快捷键

- `Ctrl + Space`: 播放/暂停
- `Ctrl + Alt + ←`: 上一首
- `Ctrl + Alt + →`: 下一首

### 功能特性

- 播放列表管理
- 进度条拖动
- 音量控制
- 播放模式切换（顺序/单曲循环/随机）
- 记忆播放状态
- 响应式设计
