from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional
import uuid, os, json

app = FastAPI(title="Multimodal AI Platform API", version="1.0.0", docs_url="/docs")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Storage: Neon Postgres (if set) or in-memory fallback ────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", "")

def get_db_conn():
    if not DATABASE_URL:
        return None
    try:
        import psycopg2
        return psycopg2.connect(DATABASE_URL, sslmode="require")
    except Exception:
        return None

def init_db():
    conn = get_db_conn()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS avatars (
                id TEXT PRIMARY KEY, name TEXT, status TEXT DEFAULT 'ready',
                lora_ready BOOLEAN DEFAULT TRUE, image_url TEXT,
                voice_id TEXT DEFAULT 'rachel', created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY, type TEXT, status TEXT DEFAULT 'queued',
                avatar_id TEXT, prompt TEXT, output JSONB,
                error TEXT, created_at TIMESTAMP DEFAULT NOW(), completed_at TIMESTAMP
            );
        """)
        # Seed demo avatars
        cur.execute("""
            INSERT INTO avatars (id, name, status, lora_ready) VALUES
                ('av1','Priya','ready',true),('av2','Marcus','ready',true),('av3','Aiko','ready',true)
            ON CONFLICT (id) DO NOTHING;
        """)
        conn.commit()
        cur.close()
    except Exception as e:
        print(f"DB init error: {e}")
    finally:
        conn.close()

# In-memory fallback (no DB)
_mem_avatars: dict = {
    "av1": {"id":"av1","name":"Priya","status":"ready","lora_ready":True,"voice_id":"rachel","created_at":"2026-01-01T00:00:00"},
    "av2": {"id":"av2","name":"Marcus","status":"ready","lora_ready":True,"voice_id":"adam","created_at":"2026-01-01T00:00:00"},
    "av3": {"id":"av3","name":"Aiko","status":"ready","lora_ready":True,"voice_id":"bella","created_at":"2026-01-01T00:00:00"},
}
_mem_jobs: dict = {}

# Init DB on startup
try: init_db()
except: pass

# ── Redis / Upstash (if set) ─────────────────────────────────────────────────
REDIS_URL = os.environ.get("REDIS_URL") or os.environ.get("KV_URL", "")

def get_redis():
    if not REDIS_URL: return None
    try:
        import redis
        return redis.from_url(REDIS_URL, decode_responses=True)
    except: return None

# ── Helpers ──────────────────────────────────────────────────────────────────
def db_get_avatars():
    conn = get_db_conn()
    if not conn: return list(_mem_avatars.values())
    try:
        cur = conn.cursor()
        cur.execute("SELECT id,name,status,lora_ready,voice_id,created_at FROM avatars ORDER BY created_at DESC")
        rows = cur.fetchall()
        return [{"id":r[0],"name":r[1],"status":r[2],"lora_ready":r[3],"voice_id":r[4],"created_at":str(r[5])} for r in rows]
    except: return list(_mem_avatars.values())
    finally: conn.close()

def db_get_avatar(av_id):
    conn = get_db_conn()
    if not conn: return _mem_avatars.get(av_id)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id,name,status,lora_ready,voice_id,created_at FROM avatars WHERE id=%s", (av_id,))
        r = cur.fetchone()
        return {"id":r[0],"name":r[1],"status":r[2],"lora_ready":r[3],"voice_id":r[4],"created_at":str(r[5])} if r else None
    except: return _mem_avatars.get(av_id)
    finally: conn.close()

def db_create_avatar(av_id, name, voice_id="rachel"):
    conn = get_db_conn()
    av = {"id":av_id,"name":name,"status":"training","lora_ready":False,"voice_id":voice_id,"created_at":datetime.utcnow().isoformat()}
    if not conn: _mem_avatars[av_id] = av; return av
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO avatars (id,name,status,lora_ready,voice_id) VALUES (%s,%s,'training',false,%s)", (av_id,name,voice_id))
        conn.commit()
    except: _mem_avatars[av_id] = av
    finally: conn.close()
    return av

def db_create_job(job_id, job_type, avatar_id=None, prompt=None, status="queued", output=None):
    conn = get_db_conn()
    job = {"id":job_id,"type":job_type,"status":status,"avatar_id":avatar_id,"prompt":prompt,"output":output,"error":None,"created_at":datetime.utcnow().isoformat()}
    if not conn: _mem_jobs[job_id] = job; return job
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO jobs (id,type,status,avatar_id,prompt,output) VALUES (%s,%s,%s,%s,%s,%s)",
            (job_id,job_type,status,avatar_id,prompt,json.dumps(output) if output else None))
        conn.commit()
    except: _mem_jobs[job_id] = job
    finally: conn.close()
    return job

def db_get_jobs(limit=20):
    conn = get_db_conn()
    if not conn: return list(_mem_jobs.values())[-limit:]
    try:
        cur = conn.cursor()
        cur.execute("SELECT id,type,status,avatar_id,prompt,output,error,created_at FROM jobs ORDER BY created_at DESC LIMIT %s", (limit,))
        rows = cur.fetchall()
        return [{"id":r[0],"type":r[1],"status":r[2],"avatar_id":r[3],"prompt":r[4],"output":r[5],"error":r[6],"created_at":str(r[7])} for r in rows]
    except: return list(_mem_jobs.values())
    finally: conn.close()

def db_get_job(job_id):
    conn = get_db_conn()
    if not conn: return _mem_jobs.get(job_id)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id,type,status,avatar_id,prompt,output,error,created_at FROM jobs WHERE id=%s",(job_id,))
        r = cur.fetchone()
        return {"id":r[0],"type":r[1],"status":r[2],"avatar_id":r[3],"prompt":r[4],"output":r[5],"error":r[6],"created_at":str(r[7])} if r else None
    except: return _mem_jobs.get(job_id)
    finally: conn.close()

# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    db_ok   = bool(get_db_conn())
    redis_ok = bool(get_redis())
    return {
        "status": "ok", "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "neon-postgres" if db_ok else "in-memory",
        "cache": "upstash-redis" if redis_ok else "none",
        "storage": "vercel-blob" if os.environ.get("BLOB_READ_WRITE_TOKEN") else "local",
    }

@app.get("/")
async def root():
    return {"message": "Multimodal AI Platform API", "docs": "/docs", "status": "online"}

# Avatars
@app.get("/api/v1/avatars")
async def list_avatars():
    avatars = db_get_avatars()
    return {"avatars": avatars, "total": len(avatars)}

@app.get("/api/v1/avatars/{avatar_id}")
async def get_avatar(avatar_id: str):
    av = db_get_avatar(avatar_id)
    if not av: raise HTTPException(404, "Avatar not found")
    return av

@app.post("/api/v1/avatars/")
async def create_avatar(name: str = "New Avatar", voice_id: str = "rachel"):
    av_id  = "av_" + str(uuid.uuid4())[:8]
    job_id = "job_" + str(uuid.uuid4())[:8]
    av  = db_create_avatar(av_id, name, voice_id)
    job = db_create_job(job_id, "lora_train", avatar_id=av_id, prompt=f"LoRA training: {name}")
    return {"avatar_id": av_id, "job_id": job_id, "status": "queued"}

@app.delete("/api/v1/avatars/{avatar_id}")
async def delete_avatar(avatar_id: str):
    if avatar_id in _mem_avatars: del _mem_avatars[avatar_id]
    conn = get_db_conn()
    if conn:
        try:
            cur = conn.cursor(); cur.execute("DELETE FROM avatars WHERE id=%s",(avatar_id,)); conn.commit()
        finally: conn.close()
    return {"deleted": True}

@app.post("/api/v1/avatars/{avatar_id}/animate")
async def animate_avatar(avatar_id: str, text: str = "Hello world", voice_id: str = "rachel"):
    job_id = "job_" + str(uuid.uuid4())[:8]
    output = {
        "video_url": "https://www.w3schools.com/html/mov_bbb.mp4",
        "audio_url": "https://www.w3schools.com/html/horse.mp3",
        "duration_s": 12.4
    }
    job = db_create_job(job_id, "avatar_animate", avatar_id=avatar_id, prompt=text, status="done", output=output)
    return {"job_id": job_id, "status": "done", "output": output}

# Generation
@app.post("/api/v1/generate/prompt-refine")
async def refine_prompt(body: dict):
    raw     = body.get("raw_prompt", "")
    context = body.get("context", {})
    gen_type = context.get("type", "avatar_animate")
    return {
        "refined_prompt": f"Cinematic, ultra-realistic {raw}, 8K resolution, shallow depth of field, professional studio lighting, editorial quality",
        "negative_prompt": "blurry, watermark, extra limbs, deformed, low quality, cartoon, oversaturated, jpeg artifacts",
        "style_tags": ["cinematic","photorealistic","studio-lit","editorial","8K"],
        "detected_intent": gen_type,
        "tts_text": raw if gen_type in ("avatar_animate","text2speech") and len(raw) < 300 else None
    }

@app.post("/api/v1/generate/text2video")
async def text_to_video(body: dict):
    job_id = "job_" + str(uuid.uuid4())[:8]
    output = {"video_url":"https://www.w3schools.com/html/mov_bbb.mp4","duration_s":10.0}
    job = db_create_job(job_id,"text2video",prompt=body.get("raw_prompt",""),status="done",output=output)
    return {"job_id":job_id,"status":"done","output":output}

@app.post("/api/v1/generate/text2speech")
async def text_to_speech(body: dict):
    job_id = "job_" + str(uuid.uuid4())[:8]
    output = {"audio_url":"https://www.w3schools.com/html/horse.mp3","voice_id":body.get("voice_id","rachel")}
    job = db_create_job(job_id,"text2speech",prompt=body.get("text",""),status="done",output=output)
    return {"job_id":job_id,"status":"done","output":output}

# Jobs
@app.get("/api/v1/jobs/")
async def list_jobs(page: int = 1, limit: int = 20):
    jobs = db_get_jobs(limit)
    return {"page":page,"limit":limit,"total":len(jobs),"jobs":jobs}

@app.get("/api/v1/jobs/{job_id}")
async def get_job(job_id: str):
    job = db_get_job(job_id)
    if not job: raise HTTPException(404,"Job not found")
    return job

@app.delete("/api/v1/jobs/{job_id}")
async def cancel_job(job_id: str):
    if job_id in _mem_jobs: _mem_jobs[job_id]["status"] = "cancelled"
    conn = get_db_conn()
    if conn:
        try:
            cur = conn.cursor(); cur.execute("UPDATE jobs SET status='cancelled' WHERE id=%s",(job_id,)); conn.commit()
        finally: conn.close()
    return {"cancelled":True}

# Storage health
@app.get("/api/v1/storage/status")
async def storage_status():
    return {
        "postgres": {"connected": bool(get_db_conn()), "provider": "Neon (serverless)"},
        "redis":    {"connected": bool(get_redis()),   "provider": "Upstash (serverless)"},
        "blob":     {"connected": bool(os.environ.get("BLOB_READ_WRITE_TOKEN")), "provider": "Vercel Blob"},
    }
