# Multimodal AI Generation Platform

Full-stack platform for AI-powered avatar animation, text-to-video, and voice synthesis.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 App Router · React · Zustand · tRPC · Tailwind |
| Gateway | FastAPI · PostgreSQL · Redis + Celery |
| Engines | GPT-4o · SDXL · SadTalker · SVD · ElevenLabs |
| Storage | AWS S3 · CloudFront CDN |
| Infra | Docker Compose · Nginx |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/multimodal-platform.git
cd multimodal-platform

# 2. Set env vars
cp backend/.env.example backend/.env
# Fill in your API keys

# 3. Start everything
docker compose up --build

# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

## Project Structure

```
multimodal-platform/
├── frontend/          # Next.js 14
├── backend/           # FastAPI
├── infra/             # Docker, Nginx
└── scripts/           # Pipeline demo
```

## Environment Variables

See `backend/.env.example` for all required keys:
- `OPENAI_API_KEY`
- `REPLICATE_API_TOKEN`
- `ELEVENLABS_API_KEY`
- `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`

## Architecture

```
Next.js → FastAPI Gateway → Orchestrator → [NLP · Image · Animation · Video] Engines
                ↓                                          ↓
            PostgreSQL                              S3 + CloudFront
                ↓
         Redis + Celery (async jobs)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/avatars` | Upload + enqueue LoRA training |
| GET | `/api/v1/avatars/{id}` | Avatar status |
| POST | `/api/v1/avatars/{id}/animate` | Animate with text/audio |
| POST | `/api/v1/generate/text2video` | Text-to-video pipeline |
| POST | `/api/v1/generate/text2speech` | ElevenLabs TTS |
| GET | `/api/v1/jobs/{id}` | Poll job status |

## License

MIT
