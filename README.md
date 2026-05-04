# MultiModal AI Platform

Full-stack AI generation platform for avatar animation, text-to-video, voice synthesis, and image generation. Built and deployed entirely on free-tier infrastructure.

**Live:**
- Frontend → https://multimodal-platform-eight.vercel.app
- Backend API → https://multimodal-plat.vercel.app
- API Docs → https://multimodal-plat.vercel.app/docs

---

## What it does

| Feature | Engine | Cost |
|---------|--------|------|
| Avatar Studio | Upload + LoRA training simulation | Free |
| Text → Speech | Browser Web Speech API | Free |
| Image Generation | Hugging Face FLUX.1-schnell | Free (HF_TOKEN) |
| Avatar Animation | SadTalker via Replicate | Paid (REPLICATE_API_TOKEN) |
| Text → Video | SDXL + SVD-XT via Replicate | Paid (REPLICATE_API_TOKEN) |
| NLP Engine | Client-side prompt refinement | Free |
| Google Auth | NextAuth.js + Google OAuth | Free |
| Job Queue | FastAPI + in-memory / Vercel Postgres | Free |

---

## Architecture

```
Browser
  └── Next.js 14 Frontend (Vercel)
        ├── Google OAuth (NextAuth.js)
        └── /api/v1/* → FastAPI Backend (Vercel serverless)
                          ├── Vercel Postgres (avatars, jobs)
                          ├── HF FLUX.1-schnell (image gen)
                          ├── Browser Web Speech API (TTS)
                          ├── Replicate (SadTalker, SVD — optional)
                          └── GitHub Actions CI/CD (4 agents)
```

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14.2.35 · React · Tailwind CSS · Zustand |
| Auth | NextAuth.js 4 · Google OAuth 2.0 |
| Backend | FastAPI · Python 3.12 · Vercel serverless |
| Database | Vercel Postgres (Neon) — free tier |
| Image AI | Hugging Face FLUX.1-schnell — free tier |
| TTS | Browser Web Speech API — built-in, zero cost |
| Video AI | Replicate SVD-XT — optional, pay-per-use |
| Avatar AI | Replicate SadTalker — optional, pay-per-use |
| CI/CD | GitHub Actions — 4 automated agents |

---

## Setup (100% free)

### 1. Clone and install

```bash
git clone https://github.com/rahulmsingh337/multimodal_platform.git
cd multimodal_platform/frontend && npm install
cd ../backend-vercel && pip install -r requirements.txt
```

### 2. Frontend env vars (Vercel → multimodal-platform → Settings → Env Vars)

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
NEXTAUTH_SECRET=IqMrdCdMA8hRwxsjSIO+zsdQgbzgHFa6YRL5geiINO0=
NEXTAUTH_URL=https://multimodal-platform-eight.vercel.app
```

### 3. Backend env vars (Vercel → multimodal-plat → Settings → Env Vars)

```env
# Free — connect via Vercel dashboard Storage tab
POSTGRES_URL=postgresql://...    # Vercel Postgres (auto-injected)

# Free — get from huggingface.co/settings/tokens
HF_TOKEN=hf_xxx

# Optional — pay-per-use for real generation
REPLICATE_API_TOKEN=r8_xxx
ELEVENLABS_API_KEY=xxx
OPENAI_API_KEY=sk-xxx
```

### 4. Connect Vercel Postgres (free, 3 clicks)

1. Vercel Dashboard → **Storage** tab → **Create** → **Neon Serverless Postgres**
2. Name: `multimodal-db` → **Create**
3. **Connect to Project** → select `multimodal-plat` → **Connect**

`POSTGRES_URL` is auto-injected. No copy-paste needed.

### 5. Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth Client ID → Web application
3. Authorized redirect URI: `https://multimodal-platform-eight.vercel.app/api/auth/callback/google`
4. Copy Client ID + Secret → add to Vercel env vars

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health + storage status |
| GET | `/docs` | Swagger UI |
| GET | `/api/v1/avatars` | List all avatars |
| POST | `/api/v1/avatars/` | Create avatar + queue LoRA job |
| GET | `/api/v1/avatars/{id}` | Get avatar by ID |
| DELETE | `/api/v1/avatars/{id}` | Delete avatar |
| POST | `/api/v1/avatars/{id}/animate` | Animate avatar with text |
| POST | `/api/v1/generate/prompt-refine` | NLP prompt enhancement |
| POST | `/api/v1/generate/text2video` | Queue text-to-video job |
| POST | `/api/v1/generate/text2speech` | Queue TTS job |
| POST | `/api/v1/generate/image` | Generate image (HF FLUX) |
| GET | `/api/v1/jobs/` | List all jobs |
| GET | `/api/v1/jobs/{id}` | Get job status |
| DELETE | `/api/v1/jobs/{id}` | Cancel job |
| GET | `/api/v1/storage/status` | Storage backend status |

---

## GitHub Actions (CI/CD)

4 automated agents run on every push and PR:

| Agent | Trigger | What it does |
|-------|---------|--------------|
| 🤖 CI Agent | Push + PR | Build frontend, lint backend, comment on PRs |
| 🔧 Auto-Fix | Manual only | Auto-fix lint/format issues and commit back |
| 🔒 Security | Weekly + dep changes | npm audit, pip-audit, open issues report |
| 🔍 PR Validator | Every PR | Check title format, scan for secrets, post diff summary |

---

## Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000

# Backend
cd backend-vercel
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000   # http://localhost:8000
```

---

## Project Structure

```
multimodal_platform/
├── frontend/                   # Next.js 14 app
│   ├── app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── generate/           # Generation pipeline
│   │   ├── avatar/create/      # Avatar studio
│   │   ├── jobs/               # Job queue
│   │   └── auth/signin/        # Google sign-in
│   └── components/
│       ├── Sidebar.tsx         # Nav + user profile
│       ├── AuthGuard.tsx       # Mandatory auth gate
│       └── AuthProvider.tsx    # NextAuth session
│
├── backend-vercel/             # FastAPI (Vercel serverless)
│   └── api/index.py            # All endpoints
│
├── backend/                    # Full FastAPI (for Render/Railway)
│   ├── engines/                # NLP, Image, Animation, Video
│   ├── pipeline/               # Celery tasks
│   ├── storage/                # S3 client
│   └── integrations/           # OpenAI, ElevenLabs, Replicate
│
├── .github/workflows/          # 4 CI/CD agents
├── .claude/skills/             # GitHub agent skill
├── SETUP.md                    # Detailed setup guide
└── render.yaml                 # Render deployment config
```

---

## License

MIT
