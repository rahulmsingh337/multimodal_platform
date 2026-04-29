import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.models import Job

router = APIRouter()

@router.get("/{job_id}")
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    return {
        "id": str(job.id),
        "type": job.job_type,
        "status": job.status,
        "input": job.input_payload,
        "output": job.output_payload,
        "error": job.error,
        "created_at": job.created_at.isoformat(),
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    }

@router.get("/")
async def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(Job).order_by(Job.created_at.desc()).offset(offset).limit(limit)
    )
    jobs = result.scalars().all()
    return {
        "page": page,
        "limit": limit,
        "jobs": [{"id": str(j.id), "type": j.job_type, "status": j.status, "created_at": j.created_at.isoformat()} for j in jobs],
    }

@router.delete("/{job_id}")
async def cancel_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.status != "queued":
        raise HTTPException(400, f"Cannot cancel job with status '{job.status}'")
    job.status = "cancelled"
    await db.commit()
    return {"cancelled": True}
