from celery import Celery
from config import settings

celery_app = Celery(
    "multimodal",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["pipeline.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "pipeline.tasks.run_lora_training": {"queue": "gpu"},
        "pipeline.tasks.run_animation": {"queue": "gpu"},
        "pipeline.tasks.run_text2video": {"queue": "gpu"},
        "pipeline.tasks.run_tts": {"queue": "default"},
    },
)
