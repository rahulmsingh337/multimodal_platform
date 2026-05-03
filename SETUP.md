# 🚀 Full Stack Setup Guide

## What's Running Right Now

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://multimodal-platform-eight.vercel.app | ✅ Live |
| Backend API | https://multimodal-plat.vercel.app | ✅ Live |
| Swagger Docs | https://multimodal-plat.vercel.app/docs | ✅ Live |
| Health Check | https://multimodal-plat.vercel.app/health | ✅ Live |

---

## Step 1: Free Database — Neon Postgres (5 min)

1. Go to **[neon.tech](https://neon.tech)** → Sign in with GitHub
2. Click **New Project** → name it `multimodal` → region: `US East`
3. Go to **Dashboard → Connection Details**
4. Copy the **Connection string** (pooled):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Add to **Vercel → multimodal-plat → Settings → Environment Variables**:
   ```
   DATABASE_URL = postgresql://user:password@...neon.tech/neondb?sslmode=require
   ```

---

## Step 2: Free Redis — Upstash (3 min)

1. Go to **[upstash.com](https://upstash.com)** → Sign in with GitHub
2. Click **Create Database** → name: `multimodal` → region: `us-east-1` → **Create**
3. Click on your database → **Details** tab
4. Copy the **Redis URL**:
   ```
   redis://default:xxxxx@global-xxx.upstash.io:6379
   ```
5. Add to **Vercel → multimodal-plat → Settings → Environment Variables**:
   ```
   REDIS_URL = redis://default:xxxxx@global-xxx.upstash.io:6379
   ```

---

## Step 3: Redeploy Backend

After adding both env vars:
- Vercel → `multimodal-plat` → **Deployments** → click `⋯` on latest → **Redeploy**

Verify at: `https://multimodal-plat.vercel.app/health`
```json
{
  "status": "ok",
  "database": "neon-postgres",   ← ✅ connected
  "cache": "upstash-redis",      ← ✅ connected
  "storage": "local"
}
```

---

## Step 4: API Keys (for real generation)

Add to **Vercel → multimodal-plat → Settings → Environment Variables**:

| Key | Where to get | Cost |
|-----|-------------|------|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Pay per use |
| `REPLICATE_API_TOKEN` | [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) | Pay per use |
| `ELEVENLABS_API_KEY` | [elevenlabs.io/settings/api-keys](https://elevenlabs.io/settings/api-keys) | Free tier |
| `AWS_ACCESS_KEY_ID` | AWS IAM → create user with S3 access | Free tier |
| `AWS_SECRET_ACCESS_KEY` | Same as above | Free tier |
| `S3_BUCKET` | Your S3 bucket name | Free tier |
| `CLOUDFRONT_DOMAIN` | CloudFront distribution URL | Free tier |

---

## Step 5: Google Auth (for real login)

Already configured. Just ensure these are in **Vercel → multimodal-platform**:
```
GOOGLE_CLIENT_ID     = xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-xxx
NEXTAUTH_SECRET      = IqMrdCdMA8hRwxsjSIO+zsdQgbzgHFa6YRL5geiINO0=
NEXTAUTH_URL         = https://multimodal-platform-eight.vercel.app
```

---

## Architecture Summary

```
Browser
  └── Next.js Frontend (Vercel)
        └── /api/v1/* → FastAPI Backend (Vercel)
                          ├── Neon PostgreSQL (avatars, jobs, assets)
                          ├── Upstash Redis (job queue, caching)
                          ├── OpenAI GPT-4o (NLP engine)
                          ├── Replicate (SDXL, SadTalker, SVD)
                          ├── ElevenLabs (TTS, voice cloning)
                          └── AWS S3 + CloudFront (asset CDN)
```

---

## Quick Test Commands

```bash
# Health check
curl https://multimodal-plat.vercel.app/health

# List avatars
curl https://multimodal-plat.vercel.app/api/v1/avatars

# Refine a prompt
curl -X POST https://multimodal-plat.vercel.app/api/v1/generate/prompt-refine \
  -H "Content-Type: application/json" \
  -d '{"raw_prompt": "A woman speaking about AI", "context": {"type": "avatar_animate"}}'

# Check storage status
curl https://multimodal-plat.vercel.app/api/v1/storage/status
```
