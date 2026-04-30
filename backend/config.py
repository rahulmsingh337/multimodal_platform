import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = os.environ.get("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/multimodal_db")
    DATABASE_SYNC_URL: str = os.environ.get("DATABASE_URL", "postgresql://user:password@localhost/multimodal_db")
    REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
    REPLICATE_API_TOKEN: str = os.environ.get("REPLICATE_API_TOKEN", "")
    ELEVENLABS_API_KEY: str = os.environ.get("ELEVENLABS_API_KEY", "")

    AWS_ACCESS_KEY_ID: str = os.environ.get("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.environ.get("AWS_REGION", "us-east-1")
    S3_BUCKET: str = os.environ.get("S3_BUCKET", "multimodal-assets")
    CLOUDFRONT_DOMAIN: str = os.environ.get("CLOUDFRONT_DOMAIN", "https://cdn.example.com")

    JWT_SECRET: str = os.environ.get("JWT_SECRET", "change_me_in_production")
    JWT_ALGORITHM: str = "HS256"

settings = Settings()
