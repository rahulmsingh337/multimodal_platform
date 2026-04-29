from fastapi import APIRouter
from api.endpoints import avatars, generation, jobs

router = APIRouter()
router.include_router(avatars.router, prefix="/avatars", tags=["avatars"])
router.include_router(generation.router, prefix="/generate", tags=["generation"])
router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
