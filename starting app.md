```
Starting Again (Every Time)
Step 1 — Open VS Code
File → Open Folder → B:\neuralcafe-mvp
Step 2 — Open two terminals (Ctrl+`)
Step 3 — Terminal 1 (Backend):
cmdB:
cd neuralcafe-mvp\backend
.\start.ps1
Step 4 — Terminal 2 (Frontend):
cmdB:
cd neuralcafe-mvp\frontend
npm run dev
Step 5 — Open browser:
Local app → http://localhost:5173
Live app → https://neuralcafe-mvp.vercel.app
```

```
Pushing Code Changes
cmdcd B:\neuralcafe-mvp
git add .
git commit -m "describe your change"
git push
Vercel and Render auto-update within 2 minutes after push.
```

```
Important URLs
WhatURLLive appneuralcafe-mvp.vercel.appBackendneuralcafe-
mvp.onrender.comDatabasesupabase.comBackend logsrender.com → your service →
LogsFrontend logsvercel.com → your projectGroq API keysconsole.groq.comGitHub
repogithub.com/NandanDivate/neuralcafe-mvp
```

# `If Something Breaks` 

```
ProblemFixBackend not startingCheck .\start.ps1 has correct Groq keyAI not
respondingCheck Groq key at console.groq.comDatabase errorCheck supabase.com →
project is activeLive site not updatingWait 2 min after git pushRender
sleepingOpen backend URL once to wake it up
```

```
Summary 1
```

```
I'm building NeuralCafe — a pay-per-session AI platform (like a cyber café but
for AI).
```

```
## Live URLs
- Frontend: https://neuralcafe-mvp.vercel.app
- Backend: https://neuralcafe-mvp.onrender.com
- GitHub: https://github.com/NandanDivate/neuralcafe-mvp
```

```
## Tech Stack
- Frontend: React + Vite (Vercel)
- Backend: Node.js + Express (Render)
- Database: Supabase (PostgreSQL)
- AI: Groq API — OpenAI GPT-OSS 120B (Smart) & Qwen 3.8 27B (Fast)
- Auth: Firebase Google login
- Project location: B:\neuralcafe-mvp
```

```
## Supabase
- URL: https://kdviazumpgooatuolmdl.supabase.co
```

- `Tables: users, wallets, sessions` 

```
## Features Built
```

- `Landing page (dark theme) - Google login (Firebase) - Email-based user identification` 

- `Wallet top-up system (fake payment — Razorpay next) - Session plans: 15min 5 / 30min 10 / 1hr 18 ₹ ₹ ₹ - Real AI chat with token tracking - Session timer with countdown - Persistent wallet balance via Supabase` 

```
## How to Run Locally
Terminal 1 (backend):
B:
cd neuralcafe-mvp\backend
.\start.ps1
Terminal 2 (frontend):
B:
cd neuralcafe-mvp\frontend
npm run dev
```

```
Local app: http://localhost:5173
```

```
## start.ps1 contents
$env:GROQ_API_KEY="your_groq_key"
$env:SUPABASE_URL="https://kdviazumpgooatuolmdl.supabase.co"
$env:SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmF
zZSIsInJlZiI6ImtkdmlhenVtcGdvb2F0dW9sbWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjI
zNjYsImV4cCI6MjA5MjY5ODM2Nn0.3ukX_fIFXsSd6hqbGekTgBffl-OrL7Y0g7FNvTC0UN8"
$env:PORT="3001"
node server.js
```

```
## Pushing Changes
cd B:\neuralcafe-mvp
git add .
git commit -m "your message"
git push
Vercel and Render auto-update in 2 minutes.
```

```
## Next Steps (in order)
```

```
1. Razorpay — real UPI payments
```

`2. UI polish — logout on all screens, avatar, back button, expired session screen` 

`3. Google Analytics or Posthog` 

`4. Add GPT-4o or Claude when API credits available` 

# `## Known Issues` 

- `dotenvx interferes with .env locally — solved via start.ps1` 

- `Render free tier sleeps after 15min — first request takes 30s to wake up` 

- `Supabase credentials hardcoded in server.js (safe — anon key is public)` 

- `Groq key hardcoded in server.js (move to env variable later)` 

# `summary 2:` 

```
I'm building NeuralCafe — a pay-per-session AI platform (like a cyber café but
for AI).
```

# `## Live URLs` 

```
- Frontend: https://neuralcafe-mvp.vercel.app
- Backend: https://neuralcafe-mvp.onrender.com
- GitHub: https://github.com/NandanDivate/neuralcafe-mvp
```

```
## Tech Stack
- Frontend: React + Vite (Vercel)
- Backend: Node.js + Express (Render)
- Database: Supabase (PostgreSQL)
- AI: Groq API — OpenAI GPT-OSS 120B (Smart) & Qwen 3.8 27B (Fast)
- Auth: Firebase Google login (works on mobile + desktop)
- Project location: B:\neuralcafe-mvp
```

```
## Supabase
- URL: https://kdviazumpgooatuolmdl.supabase.co
- Tables: users, wallets, sessions
```

```
## Firebase
- Project: neuralcafe
- Auth: Google OAuth (signInWithPopup for desktop, signInWithRedirect for
mobile)
- authDomain: neuralcafe-mvp.vercel.app
- Authorized domains: localhost, neuralcafe-mvp.vercel.app,
neuralcafe.firebaseapp.com
```

```
## Features Built
- Dark landing page
- Google login (Firebase) — desktop + mobile working
- Persistent wallet balance via Supabase
- Session plans: 15min ₹5 / 30min ₹10 / 1hr ₹18
- Real AI chat with GPT-OSS 120B & Qwen 3.8 27B on Groq
- Token tracking per session
- Session timer with countdown
- 8 active users
## How to Run Locally
Terminal 1 (backend):
B:
cd neuralcafe-mvp\backend
.\start.ps1
```

```
Terminal 2 (frontend):
B:
cd neuralcafe-mvp\frontend
npm run dev
Local app: http://localhost:5173
```

```
## start.ps1 contents
$env:GROQ_API_KEY="your_new_groq_key"
$env:SUPABASE_URL="https://kdviazumpgooatuolmdl.supabase.co"
$env:SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmF
zZSIsInJlZiI6ImtkdmlhenVtcGdvb2F0dW9sbWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjI
zNjYsImV4cCI6MjA5MjY5ODM2Nn0.3ukX_fIFXsSd6hqbGekTgBffl-OrL7Y0g7FNvTC0UN8"
$env:PORT="3001"
node server.js
```

```
## Pushing Changes
cd B:\neuralcafe-mvp
git add .
git commit -m "your message"
git push
Vercel and Render auto-update in 2 minutes.
```

```
## Known Issues
- dotenvx interferes with .env locally — solved via start.ps1
```

- `Render free tier sleeps after 15min — first request takes 30s to wake up - Supabase anon key hardcoded in server.js (safe — it's a public key)` 

- `Groq key hardcoded in server.js (move to env variable later)` 

# `## Security` 

- `.env removed from GitHub tracking` 

- `Old exposed Groq key revoked` 

- `New Groq key only in start.ps1 (gitignored) and Render Variables` 

# `## Next Steps (in order)` 

`1. Razorpay — real UPI payments` 

`2. UI polish — logout on all screens, back button, session expired screen, copy button` 

`3. Fix Render sleep — ping server every 10 mins or upgrade plan` 

`4. Add GPT-4o or Claude when API credits available` 

`5. Posthog analytics — see what users do inside the app` 

# `## Resume Line` 

```
"Built and deployed NeuralCafe — a full stack pay-per-session AI SaaS platform
with Google OAuth, persistent wallet system, real-time AI chat, and 8 active
users. Stack: React, Node.js, Supabase, Firebase, Groq API, Vercel, Render."
```

