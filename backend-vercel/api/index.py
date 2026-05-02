from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid, os, json

app = FastAPI(title="Multimodal AI Platform API", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store (resets per cold start — replace with Vercel Postgres for persistence)
_jobs: dict = {}
_avatars: dict = {
    "av1": {"id": "av1", "name": "Priya",  "status": "ready", "lora_ready": True,  "created_at": "2024-01-01T00:00:00"},
    "av2": {"id": "av2", "name": "Marcus", "status": "ready", "lora_ready": True,  "created_at": "2024-01-01T00:00:00"},
    "av3": {"id": "av3", "name": "Aiko",   "status": "ready", "lora_ready": True,  "created_at": "2024-01-01T00:00:00"},
}

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat()}

@app.get("/")
async def root():
    return {"message": "Multimodal AI Platform API", "docs": "/docs", "status": "online"}

# ── Avatars ──────────────────────────────────────────────────────────────────

@app.get("/api/v1/avatars")
async def list_avatars():
    return {"avatars": list(_avatars.values()), "total": len(_avatars)}

@app.get("/api/v1/avatars/{avatar_id}")
async def get_avatar(avatar_id: str):
    av = _avatars.get(avatar_id)
    if not av:
        from fastapi import HTTPException
        raise HTTPException(404, "Avatar not found")
    return av

@app.post("/api/v1/avatars/")
async def create_avatar(name: str = "New Avatar"):
    av_id = "av_" + str(uuid.uuid4())[:8]
    job_id = "job_" + str(uuid.uuid4())[:8]
    _avatars[av_id] = {
        "id": av_id, "name": name, "status": "training",
        "lora_ready": False, "created_at": datetime.utcnow().isoformat()
    }
    _jobs[job_id] = {
        "id": job_id, "type": "lora_train", "status": "queued",
        "avatar_id": av_id, "created_at": datetime.utcnow().isoformat(),
        "output": None, "error": None
    }
    return {"avatar_id": av_id, "job_id": job_id, "status": "queued"}

@app.post("/api/v1/avatars/{avatar_id}/animate")
async def animate_avatar(avatar_id: str, text: str = "Hello world", voice_id: str = "rachel"):
    job_id = "job_" + str(uuid.uuid4())[:8]
    _jobs[job_id] = {
        "id": job_id, "type": "avatar_animate", "status": "done",
        "avatar_id": avatar_id, "created_at": datetime.utcnow().isoformat(),
        "output": {
            "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            "duration_s": 12.4
        }, "error": None
    }
    return {"job_id": job_id, "status": "done", "output": _jobs[job_id]["output"]}

# ── Generation ────────────────────────────────────────────────────────────────

@app.post("/api/v1/generate/prompt-refine")
async def refine_prompt(body: dict):
    raw = body.get("raw_prompt", "")
    return {
        "refined_prompt": f"Cinematic, ultra-realistic {raw}, 8K resolution, shallow depth of field, professional studio lighting",
        "negative_prompt": "blurry, watermark, extra limbs, deformed, low quality, cartoon, oversaturated",
        "style_tags": ["cinematic", "photorealistic", "studio-lit", "editorial", "8K"],
        "detected_intent": body.get("context", {}).get("type", "avatar_animate"),
        "tts_text": raw if len(raw) < 200 else raw[:200]
    }

@app.post("/api/v1/generate/text2video")
async def text_to_video(body: dict):
    job_id = "job_" + str(uuid.uuid4())[:8]
    _jobs[job_id] = {
        "id": job_id, "type": "text2video", "status": "done",
        "created_at": datetime.utcnow().isoformat(),
        "output": {
            "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration_s": 60.0
        }, "error": None
    }
    return {"job_id": job_id, "status": "done", "output": _jobs[job_id]["output"]}

@app.post("/api/v1/generate/text2speech")
async def text_to_speech(body: dict):
    job_id = "job_" + str(uuid.uuid4())[:8]
    _jobs[job_id] = {
        "id": job_id, "type": "text2speech", "status": "done",
        "created_at": datetime.utcnow().isoformat(),
        "output": {
            "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            "voice_id": body.get("voice_id", "rachel")
        }, "error": None
    }
    return {"job_id": job_id, "status": "done", "output": _jobs[job_id]["output"]}

# ── Jobs ──────────────────────────────────────────────────────────────────────

@app.get("/api/v1/jobs/")
async def list_jobs(page: int = 1, limit: int = 20):
    jobs = list(_jobs.values())
    return {"page": page, "limit": limit, "total": len(jobs), "jobs": jobs[-limit:]}

@app.get("/api/v1/jobs/{job_id}")
async def get_job(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        from fastapi import HTTPException
        raise HTTPException(404, "Job not found")
    return job

@app.delete("/api/v1/jobs/{job_id}")
async def cancel_job(job_id: str):
    job = _jobs.get(job_id)
    if job:
        job["status"] = "cancelled"
    return {"cancelled": True}
