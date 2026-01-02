# Air Poker

A small multiplayer poker demo using React + Three (client) and Socket.IO (server).

---

## 🚀 Quick start (exact commands)

Prerequisites:
- Node.js v18+ (includes npm)
- Git

Clone the repo:
```bash
git clone <repo-url>
cd AirPoker
```

Install dependencies (server & client):
```bash
# Server
cd server
npm install

# Client (in a second terminal or after server install)
cd ../client
npm install
```

Run in development (open two terminals):
```bash
# Terminal 1: start server (listens on port 3001)
cd server
npm run dev

# Terminal 2: start client (Vite dev server, usually port 5173)
cd client
npm run dev
```
Open http://localhost:5173 in your browser.

Tip: run both with one command using npx concurrently (optional):
```bash
npx concurrently "npm run dev --prefix server" "npm run dev --prefix client"
```

---

## 🔧 Environment variables (recommended)

To avoid hardcoding the socket URL, create a `.env` file in `client/` with:
```
VITE_SOCKET_URL="http://localhost:3001"
```

Then update `client/src/socket.ts` to use it (example):
```ts
const URL = (import.meta.env.VITE_SOCKET_URL as string) ?? 'http://localhost:3001';
```

If you use TypeScript and want typings for `import.meta.env`, add `client/env.d.ts`:
```ts
declare global {
  interface ImportMetaEnv { VITE_SOCKET_URL?: string }
  interface ImportMeta { readonly env: ImportMetaEnv }
}
```

---

## 🧩 Build & Preview

Client:
```bash
cd client
npm run build
npm run preview  # serve built client for a quick check
```

Server (quick run with tsx):
```bash
cd server
npx tsx src/index.ts
```

For production, compile server TypeScript to JS and run with a process manager (PM2, Docker, etc.).

---

## ⚠️ Troubleshooting

1) Socket connection issues
- Verify the server is running on the address/port used by the client (`client/src/socket.ts` or `VITE_SOCKET_URL`).
- If CORS errors appear, confirm the server allows your origin (the server currently sets cors: { origin: "*" }).

2) TypeScript / case-sensitive filename error (Windows-specific message):
> Already included file name '.../Card3D.tsx' differs from file name '.../Card3d.tsx' only in casing.

If you encounter that error:
- Ensure the import matches the filename exactly (case-sensitive): e.g. `import { Card3D } from './components/Game/Card3D';`
- If Git tracked a file with the wrong casing, rename it in two steps (Windows-safe):
```bash
# from repo root
git mv client/src/components/Game/Card3d.tsx client/src/components/Game/Card3D.tmp.tsx
git mv client/src/components/Game/Card3D.tmp.tsx client/src/components/Game/Card3D.tsx
git commit -m "Normalize filename casing for Card3D"
```
- Search for other imports using the wrong filename case and fix them.

3) Already-tracked files that should now be ignored
If you updated `.gitignore` and need to remove previously tracked files from the index without deleting working files:
```bash
git add .gitignore
git commit -m "Add .gitignore"
# Remove tracked files that are ignored now
git rm -r --cached .
git add .
git commit -m "Remove ignored files from index"
```

4) Ports in use
- Change `PORT` in `server/src/index.ts` and `VITE_SOCKET_URL` accordingly if 3001 is unavailable.

---

## 📌 Notes & Tips

- Client default dev server: Vite on port 5173.
- Server default: Node/ts + Socket.IO on port 3001 (see `server/src/index.ts`).
- The client currently uses a hardcoded URL in `client/src/socket.ts` — consider switching to `VITE_SOCKET_URL`.
- Consider adding a root `package.json` script that runs both server and client concurrently for convenience.

---

## ✅ Summary
This README contains exact commands to clone, install, run, build, and troubleshoot the project on another machine (Windows, macOS, Linux). If you'd like, I can:
- Add `VITE_SOCKET_URL` support and update the code,
- Add a one-command `dev` script at the repo root to start both processes,
- Or create a short CONTRIBUTING / SETUP doc for CI/deploy steps.

Tell me which improvement you'd like me to implement next. 🔧
