# Agile Poker

A real-time planning poker app. Create a room, share the 4-letter code, pick
Fibonacci cards face-down, and let the host flip them to reveal the average.

## Stack

- **Server** — NestJS + socket.io gateway, in-memory room store (`server/`)
- **Client** — Vite + React + Tailwind CSS v4 + lucide-react icons (`client/`)
- **Shared** — event protocol and types used by both (`shared/types.ts`)

## Run it

```bash
# one-time
npm install
npm install --prefix server
npm install --prefix client

# start both (server :3000, client :5173)
npm run dev
```

Open http://localhost:5173, create a room, then join from other tabs or
devices with the room code. Identity is per browser tab (sessionStorage), so
two tabs act as two participants.

## Features

- Create / join rooms with a 4-letter code — no accounts
- Pick a display name and a name color on one screen
- Fibonacci deck (0–89); picks show face-down to everyone else
- Host flips all cards, sees the average, and cards group by value
- Host starts new rounds; past rounds are kept in the round log sidebar
  (slide-over drawer on mobile)
- Refreshing rejoins your seat with your pick intact; if the host drops,
  the longest-present user is promoted

## Tests

```bash
npm test --prefix server   # room state logic unit tests
```
