import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.models import Avatar, Job
from storage.s3 import S3Client
from pipeline.tasks import run_lora_training, run_animation

router = APIRouter()

@router.post("/")
async def create_avatar(
    name: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    s3 = S3Client()
    user_id = uuid.uuid4()  # Replace with real auth
    s3_key = f"users/{user_id}/source/{uuid.uuid4()}.jpg"
    image_url = await s3.upload_file(await file.read(), s3_key, file.content_type or "image/jpeg")

    avatar = Avatar(user_id=user_id, name=name, source_image_url=s3_key)
    db.add(avatar)
    await db.flush()

    job = Job(
        user_id=user_id,
        avatar_id=avatar.id,
        job_type="lora_train",
        input_payload={"source_image_url": image_url, "avatar_id": str(avatar.id)},
    )
    db.add(job)
    await db.commit()

    run_lora_training.delay(str(job.id))
    return {"avatar_id": str(avatar.id), "job_id": str(job.id), "status": "queued"}


@router.get("/{avatar_id}")
async def get_avatar(avatar_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Avatar).where(Avatar.id == avatar_id))
    avatar = result.scalar_one_or_none()
    if not avatar:
        raise HTTPException(404, "Avatar not found")
    return {
        "id": str(avatar.id),
        "name": avatar.name,
        "lora_ready": avatar.lora_weights_url is not None,
        "created_at": avatar.created_at.isoformat(),
    }


@router.delete("/{avatar_id}")
async def delete_avatar(avatar_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Avatar).where(Avatar.id == avatar_id))
    avatar = result.scalar_one_or_none()
    if not avatar:
        raise HTTPException(404, "Avatar not found")
    await db.delete(avatar)
    await db.commit()
    return {"deleted": True}


@router.post("/{avatar_id}/animate")
async def animate_avatar(
    avatar_id: uuid.UUID,
    text: str,
    voice_id: str = "21m00Tcm4TlvDq8ikWAM",
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Avatar).where(Avatar.id == avatar_id))
    avatar = result.scalar_one_or_none()
    if not avatar:
        raise HTTPException(404, "Avatar not found")
    if not avatar.lora_weights_url:
        raise HTTPException(400, "LoRA training not complete")

    user_id = avatar.user_id
    job = Job(
        user_id=user_id,
        avatar_id=avatar.id,
        job_type="avatar_animate",
        input_payload={
            "text": text,
            "voice_id": voice_id,
            "avatar_image_url": avatar.source_image_url,
            "lora_weights_url": avatar.lora_weights_url,
        },
    )
    db.add(job)
    await db.commit()
    run_animation.delay(str(job.id))
    return {"job_id": str(job.id), "status": "queued"}
