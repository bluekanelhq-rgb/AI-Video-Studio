# AI Video Automation Dashboard

A modern SaaS dashboard for automating video content creation and distribution across social media platforms.

## Features

- 📊 Dashboard with analytics and activity overview
- 📺 YouTube channel monitoring
- 🔗 Video link repurposing (YouTube & Riverside FM)
- 📋 Clips queue management
- 🔌 Social media connections (TikTok, Instagram, YouTube Shorts, Facebook, X)
- ✂️ Clip editor with caption and aspect ratio customization
- ⚙️ Posting settings and automation

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **Framer Motion** for animations
- **Recharts** for data visualization

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Dashboard
│   ├── channels/          # YouTube channels management
│   ├── repurpose/         # Video link repurposing
│   ├── queue/             # Clips queue
│   ├── connections/       # Social media connections
│   ├── editor/            # Clip editor
│   ├── settings/          # Posting settings
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── sidebar.tsx        # Navigation sidebar
│   └── theme-provider.tsx # Theme management
└── lib/
    └── utils.ts           # Utility functions
```

## Theme

The dashboard features a beautiful purple and green color scheme with full dark/light mode support:

- **Primary**: Purple (#8B5CF6)
- **Accent**: Green (#16A34A)
- **Background**: Dynamic based on theme
- **Smooth animations** with Framer Motion

## Pages

1. **Dashboard** - Overview with stats, charts, and recent activity
2. **Channels** - Add and monitor YouTube channels
3. **Repurpose** - Generate clips from video links
4. **Queue** - Manage clips waiting to be posted
5. **Connections** - Connect social media accounts
6. **Editor** - Edit clips with captions and aspect ratios
7. **Settings** - Configure posting automation

## Build

```bash
npm run build
npm start
```

## License

MIT
