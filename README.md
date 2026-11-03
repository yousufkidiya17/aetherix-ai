# Aetherix AI

A chat app to order food, book rides, and hire workers. It also checks weather, searches the web, and looks up Wikipedia, all from one chat.

Live app: [https://aetherixai.qzz.io](https://aetherixai.qzz.io) (currently down, M12 off)

Demo preview (static, works without backend): [https://yousufkidiya17.github.io/aetherix-ai/demo.html](https://yousufkidiya17.github.io/aetherix-ai/demo.html)

## What it does

- Order Food
- Book Rides
- Hire Workers — 27 workers, 5 blue-collar and 22 white-collar
- Weather — live forecast
- Web Search
- Wikipedia lookup
- Voice input in the browser

The chat answers in English by default. If you type in Devanagari, it answers in Hindi.

## How it works

- Frontend: React 19, Vite, TypeScript, Tailwind CSS
- Backend: Express, Node.js
- AI: OpenCode / LongCat, model longcat-2.5-preview-free
- Provider switch: `AI_PROVIDER` env var, `opencode` (default) or `longcat`

## Run locally

```bash
git clone https://github.com/yousufkidiya17/aetherix-ai.git
cd aetherix-ai
npm install
npm run dev
```

## Project layout

```
client/   # React frontend
server/   # Express backend
shared/   # Shared types
```

## Note

This README describes the Oct 2026 production setup at aetherixai.qzz.io. The repo code snapshot is from Sep 2026.

## License

Apache 2.0. See LICENSE.
