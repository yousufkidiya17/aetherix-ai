# Aetherix AI

A chat app to order food, book rides, and hire workers. It also checks weather, searches the web, and looks up Wikipedia, all from one chat.

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

## License

Apache 2.0. See LICENSE.
