# Hi AI Chat - AI镜像站

一个支持GPT模型的AI对话平台，包含写作专家模式。

## 功能特性

- 🤖 支持GPT-3.5、GPT-4等模型
- 💬 流式响应，实时显示AI回复
- 📝 对话历史保存和管理
- ✍️ 写作专家模式，支持小说创作
- 📱 移动端优先的响应式设计

## 快速开始

### 1. 配置环境变量

复制 `.env.local.example` 为 `.env.local`，并填入你的sub2api配置：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件：

```env
NEXT_PUBLIC_API_ENDPOINT=your_sub2api_endpoint
NEXT_PUBLIC_API_KEY=your_api_key
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3001 开始使用。

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   ├── (main)/            # 主要页面
│   └── layout.tsx         # 根布局
├── components/            # React组件
│   ├── chat/             # 聊天组件
│   ├── sidebar/          # 侧边栏组件
│   └── writing/          # 写作专家组件
├── lib/                  # 工具库
├── stores/               # 状态管理
└── types/                # TypeScript类型
```

## 使用说明

### 对话模式

1. 点击"新对话"创建对话
2. 在输入框输入消息
3. 按Enter或点击发送按钮

### 写作专家模式

1. 创建新对话时选择"写作"模式
2. 选择写作类型（小说、短篇故事等）
3. 输入写作主题
4. 点击"开始写作"

### 模型选择

在侧边栏中可以选择不同的GPT模型：
- GPT-3.5 Turbo：快速且经济实惠
- GPT-4：更强大的模型
- GPT-4 Turbo：最新版本

## 部署

### Vercel部署

1. 推送代码到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署

### 其他平台

```bash
npm run build
npm start
```

### PM2 部署

```bash
npm install
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

常用命令：

```bash
pm2 status
pm2 logs hi-ai-chat
pm2 restart hi-ai-chat
pm2 stop hi-ai-chat
```

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (状态管理)

## 许可证

MIT
