import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

def _async_url(url: str) -> str:
    url = url.replace("postgres://", "postgresql://")
    if "postgresql+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    return url

def _sync_url(url: str) -> str:
    url = url.replace("postgres://", "postgresql://")
    return url.replace("postgresql+asyncpg://", "postgresql://")

_RAW = os.environ.get("DATABASE_URL", "postgresql://user:password@localhost:5432/multimodal_db")
engine      = create_async_engine(_async_url(_RAW), echo=False, pool_pre_ping=True)
sync_engine = create_engine(_sync_url(_RAW), pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

def get_sync_db() -> Session:
    with Session(sync_engine) as session:
        return session
