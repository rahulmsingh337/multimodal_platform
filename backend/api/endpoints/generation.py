from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from database import get_db
from models.models import Job
from engines.nlp_engine import NLPEngine
from integrations.openai_client import get_openai_client
from pipeline.tasks import run_text2video, run_tts

router = APIRouter()

class Text2VideoRequest(BaseModel):
    raw_prompt: str
    motion_bucket_id: int = 127
    duration_s: float = 4.0

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"

class PromptRefineRequest(BaseModel):
    raw_prompt: str
    context: dict = {}

@router.post("/text2video")
async def text_to_video(req: Text2VideoRequest, db: AsyncSession = Depends(get_db)):
    user_id = uuid.uuid4()
    job = Job(
        user_id=user_id,
        job_type="text2video",
        input_payload=req.model_dump(),
    )
    db.add(job)
    await db.commit()
    run_text2video.delay(str(job.id))
    return {"job_id": str(job.id), "status": "queued"}

@router.post("/text2speech")
async def text_to_speech(req: TTSRequest, db: AsyncSession = Depends(get_db)):
    user_id = uuid.uuid4()
    job = Job(
        user_id=user_id,
        job_type="text2speech",
        input_payload=req.model_dump(),
    )
    db.add(job)
    await db.commit()
    run_tts.delay(str(job.id))
    return {"job_id": str(job.id), "status": "queued"}

@router.post("/prompt-refine")
async def refine_prompt(req: PromptRefineRequest):
    client = get_openai_client()
    engine = NLPEngine(client)
    result = await engine.parse(req.raw_prompt, req.context)
    return result.model_dump()
