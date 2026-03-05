// ============================================
// 个人博客配置文件
// 请根据你的信息修改以下内容
// ============================================

const CONFIG = {
    // 博客基本信息
    blog: {
        title: "OrdinarySwordman's Blog",
        subtitle: "Welcome to my anime dimension ✨",
        author: "OrdinarySwordman",
        description: "梦想成为游戏客户端开发工程师！",
        avatar: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI2ZmNmI5ZCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjE1IiBmaWxsPSIjYzQ0ZGZmIi8+PHBhdGggZD0iTTQwIDM1IGM1IDUgMTAgNiAxNSA2IiBzdHJva2U9IiMzZTU5ZmYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik02MCAzNSBjLTUgNSAtMTAgNiAtMTUgNiIgc3Ryb2tlPSIjM2U1OWZmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9ibm9uZSIvPjwvc3ZnPg=="
    },

    // 社交链接（修改这里添加你的链接）
    social: {
        github: "https://github.com/OrdinarySaber",
        bilibili: "https://space.bilibili.com/你的UID",
        email: "610122595@qq.com",
        twitter: "",
        instagram: "",
        youtube: "",
        telegram: "",
        csdn: "",
        juejin: "",
        zhihu: ""
    },

    // 文档分类配置
    categories: [
        { id: "unity", name: "Unity", icon: "📚", color: "#ff6b9d" },
        { id: "cpp", name: "C++", icon: "📝", color: "#c44dff" },
        { id: "project", name: "项目", icon: "💻", color: "#66ccff" },
        { id: "thoughts", name: "随想", icon: "💭", color: "#ffcc00" },
       
        { id: "uncategorized", name: "未分类", icon: "📁", color: "#999" }
    ],

    // 文档目录（在这里添加你的文档）
    // 支持 markdown (.md) 和 PDF (.pdf)
    documents: [
        // 示例文档
        {
            id: 1,
            title: "🎮 我的第一个游戏开发笔记",
            category: "unity",
            date: "2024-01-15",
            description: "关于使用Unity开发2D游戏的入门笔记",
            tags: ["Unity", "GameDev", "入门"],
            file: "docs/unity-game-notes.md"
        },
        {
            id: 2,
            title: "📖 TypeScript 进阶教程",
            category: "cpp",
            date: "2024-01-10",
            description: "深入学习TypeScript的高级特性",
            tags: ["TypeScript", "教程", "前端"],
            file: "docs/ts-advanced.md"
        },
        {
            id: 3,
            title: "🌸 2024年度总结",
            category: "thoughts",
            date: "2024-01-01",
            description: "回顾过去一年的成长与收获",
            tags: ["年度总结", "生活"],
            file: "docs/2024-summary.md"
        },
        {
            id: 4,
            title: "📄 个人简历",
            category: "project",
            date: "2023-12-20",
            description: "我的个人简历PDF版本",
            tags: ["简历", "个人"],
            file: "docs/resume.pdf"
        },
        {
            id: 5,
            title: "📖 博客配置指南",
            category: "tutorial",
            date: "2024-01-20",
            description: "详细说明如何配置博客，包括社交链接、文档路径等",
            tags: ["配置", "教程", "文档"],
            file: "docs/配置指南.md"
        }
    ],

    // 主题设置
    theme: {
        primaryColor: "#ff6b9d",
        secondaryColor: "#c44dff",
        accentColor: "#4dffff",
        backgroundColor: "#0a0a12",
        cardColor: "#16161f",
        textColor: "#e0e0e0",
        mutedTextColor: "#888"
    }
};
