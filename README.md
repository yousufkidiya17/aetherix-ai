<div align="center">

# ⚡ AETHERIX AI

### _The Next-Gen AI-Powered Service Marketplace_

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d0d0d,50:1a1a2e,100:0d0d0d&height=120&section=header" width="100%"/>

**Aetherix** is an intelligent, conversational AI marketplace that lets you **order food**, **book rides**, **hire workers**, **check weather**, **search the web**, and **look up Wikipedia** — all through a single, beautiful chat interface powered by Mistral AI.

[🚀 **Live Demo**](https://aetherix-v2.onrender.com) · [📖 **Documentation**](#-architecture) · [🐛 **Report Bug**](https://github.com/yousufkidiya17/aetherix-ai/issues) · [✨ **Request Feature**](https://github.com/yousufkidiya17/aetherix-ai/issues)

</div>

---

## 🎯 Overview

> _"One chat to rule them all."_

Aetherix isn't just another chatbot — it's a **full-stack AI-powered service platform** that understands Hinglish, detects user intent in real-time, and routes requests to specialized **MCP (Model Context Protocol) service handlers**. Think of it as having your own personal AI assistant that can do _everything_.

<div align="center">

| 🍕 Food Ordering | 🚕 Ride Booking | 👷 Worker Hiring |
|:---:|:---:|:---:|
| Search restaurants, browse menus, place orders | Estimate fares, compare ride types, book instantly | Find electricians, plumbers, carpenters & more |

| 🌤️ Live Weather | 🔍 Web Search | 📚 Wikipedia |
|:---:|:---:|:---:|
| Real-time forecasts via Open-Meteo API | DuckDuckGo + Wikipedia powered search | Instant factual summaries & deep dives |

</div>

---

## ✨ Features

### 🤖 AI-Powered Conversational Interface
- **Mistral AI** backend with structured JSON responses
- **Hinglish-first** — the AI mirrors your conversational style
- Real-time **intent detection** across 8 categories
- Dynamic **date & time awareness** (IST)
- Smart **fallback responses** when AI is unavailable

### 🎨 Premium UI/UX
- **Dark void aesthetic** with glassmorphism elements
- **Holographic sphere** with white breathing glow animation
- **Interactive particle background** — cursor-reactive floating dots
- **White breathing borders** on all chat elements
- **Voice input** via Web Speech API (Hindi/English)
- **Responsive design** — pixel-perfect on mobile & desktop

### 🔌 MCP Service Architecture
- **6 integrated service handlers** (3 mock + 3 live APIs)
- **Direct Web Search API** — bypasses AI for guaranteed results
- Centralized **MCP Router** for clean service orchestration
- Extensible architecture — add new services in minutes

### 👷 Worker Onboarding
- Premium registration form with validation
- 7 service categories
- Hourly rate configuration
- Partner terms & instant verification

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    AETHERIX V2                       │
├─────────────────┬───────────────────────────────────┤
│   Frontend      │         Backend                   │
│                 │                                   │
│  React + Vite   │    Express + Node.js              │
│  Tailwind CSS   │                                   │
│  Lucide Icons   │  ┌─────────────┐                  │
│  Web Speech API │  │ Mistral AI  │ ← Intent Detection│
│                 │  └──────┬──────┘                  │
│  Components:    │         │                         │
│  ├ Dashboard    │  ┌──────▼──────┐                  │
│  ├ Chat UI      │  │ MCP Router  │                  │
│  ├ Particles    │  └──────┬──────┘                  │
│  ├ Sphere       │         │                         │
│  └ Worker Form  │  ┌──────▼──────────────────┐      │
│                 │  │   Service Handlers       │      │
│                 │  │  ├ 🍕 Food (Mock)        │      │
│                 │  │  ├ 🚕 Rides (Mock)       │      │
│                 │  │  ├ 👷 Workers (Mock)     │      │
│                 │  │  ├ 🌤️ Weather (Live API) │      │
│                 │  │  ├ 🔍 Search (Live API)  │      │
│                 │  │  └ 📚 Wiki (Live API)    │      │
│                 │  └─────────────────────────┘      │
└─────────────────┴───────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- **Mistral AI API Key** ([Get one free](https://console.mistral.ai/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yousufkidiya17/aetherix-ai.git
cd aetherix-ai

# Install dependencies
npm install

# Set up environment variables
echo "MISTRAL_API_KEY=your_api_key_here" > .env

# Start development server
npm run dev
```

The app will be running at `http://localhost:5000` 🎉

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MISTRAL_API_KEY` | ✅ Yes | Your Mistral AI API key |
| `PORT` | ❌ No | Server port (default: `3000`) |

> **Note:** Weather, Web Search, and Wikipedia APIs are **completely free** — no API keys needed! 🎉

---

## 📁 Project Structure

```
aetherix-ai/
├── client/                    # Frontend (React + Vite)
│   ├── index.html             # Entry HTML with meta tags
│   ├── src/
│   │   ├── components/
│   │   │   ├── AethericLogo.tsx       # Dotted sphere SVG logo
│   │   │   ├── ParticleBackground.tsx # Cursor-reactive particles
│   │   │   └── ui/                    # Shadcn UI components
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Main dashboard + chat
│   │   │   └── BecomeWorker.tsx      # Worker onboarding
│   │   ├── App.tsx                   # Router setup
│   │   └── main.tsx                  # App entry point
│   └── public/
│       └── logo.svg                  # Favicon
├── server/
│   └── index.ts               # Express server + MCP handlers
├── shared/                    # Shared types
├── package.json
├── vite.config.ts
├── tsconfig.json
├── render.yaml                # Render deployment config
└── LICENSE                    # Apache 2.0
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Main AI chat (Mistral-powered) |
| `POST` | `/api/search` | Direct web search (bypasses AI) |
| `POST` | `/api/worker/register` | Worker registration |
| `GET` | `/api/test/weather/:city` | Test weather handler |
| `GET` | `/api/test/search/:query` | Test search handler |
| `GET` | `/api/test/wiki/:topic` | Test Wikipedia handler |
| `GET` | `/api/health` | Health check |

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite 5, TypeScript | SPA with hot reload |
| **Styling** | Tailwind CSS 3, Lucide Icons | Utility-first dark theme |
| **Backend** | Express.js, Node.js 18 | REST API server |
| **AI** | Mistral AI (`mistral-small-latest`) | Intent detection & conversation |
| **Voice** | Web Speech API | Browser-native voice input |
| **Weather** | Open-Meteo API | Free, no API key |
| **Search** | DuckDuckGo + Wikipedia | Free, no API key |
| **Deploy** | Render | Auto-deploy from GitHub |

</div>

---

## 🎨 Design Philosophy

> **"Luminous Void"** — A design language where content emerges from darkness.

- **Deep blacks** (`#0d0d0d`, `#111111`) as the canvas
- **White-only accents** — no color noise, pure monochrome
- **Glassmorphism** borders with breathing animations
- **Particle fields** that respond to cursor movement
- **Intentional asymmetry** in layout and spacing
- **Micro-animations** on every interactive element

---

## 🗺️ Roadmap

- [x] Core AI chat with Mistral
- [x] Food, Rides, Workers (Mock MCP)
- [x] Weather, Search, Wikipedia (Live MCP)
- [x] Voice input (Web Speech API)
- [x] Responsive mobile design
- [x] Direct web search API
- [x] White monochrome theme
- [ ] User authentication & sessions
- [ ] Persistent chat history (MongoDB)
- [ ] Real food delivery API (Zomato/Swiggy)
- [ ] Real ride booking API (Ola/Uber)
- [ ] Payment gateway integration
- [ ] PWA support & offline mode
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are what make the open source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **Apache License 2.0**. See [`LICENSE`](LICENSE) for more information.

```
Copyright 2026 Aetherix AI

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 👨‍💻 Author

**Yousuf Kidiya**

[![GitHub](https://img.shields.io/badge/GitHub-yousufkidiya17-181717?style=for-the-badge&logo=github)](https://github.com/yousufkidiya17)

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d0d0d,50:1a1a2e,100:0d0d0d&height=100&section=footer" width="100%"/>

**Made with 🤍 by Aetherix AI Team**

_If you found this project useful, please consider giving it a ⭐!_

</div>
