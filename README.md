# AI Video Studio

A comprehensive AI-powered video automation platform for repurposing long-form content into engaging short-form clips for social media.

## 🚀 Features

- **Video Repurposing**: Convert YouTube videos into multiple short clips
- **AI-Powered Captions**: Automatic transcription and subtitle generation
- **Video Styling**: Apply cinematic filters and effects
- **Social Media Integration**: Post directly to Instagram and Facebook
- **Queue Management**: Schedule and manage your content pipeline
- **User Authentication**: Secure JWT-based authentication
- **Real-time Dashboard**: Monitor your content performance

## 📁 Project Structure

```
AI-Video-Studio/
├── backend/          # Node.js/TypeScript backend with Fastify
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   ├── workers/  # Background job processors
│   │   ├── database/ # PostgreSQL schema and migrations
│   │   └── queues/   # BullMQ job queues
│   └── Procfile      # Railway deployment config
│
└── frontend/         # Next.js 14 frontend with App Router
    ├── app/          # Pages and layouts
    ├── components/   # Reusable UI components
    └── lib/          # Utilities and API client
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL
- **Cache/Queue**: Redis + BullMQ
- **Video Processing**: FFmpeg
- **Transcription**: Whisper.cpp
- **AI**: OpenAI API (optional)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **State Management**: React Context

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- FFmpeg
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/ai_video_automation
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-key (optional)
```

5. Run database migrations:
```bash
npm run migrate
```

6. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. Start development server:
```bash
npm run dev
```

5. Open browser at `http://localhost:3000`

## 🙏 Acknowledgments

- FFmpeg for video processing
- Whisper.cpp for transcription
- shadcn/ui for beautiful components
- Railway for easy deployment

---

Built with ❤️ by the AI Video Studio Team
