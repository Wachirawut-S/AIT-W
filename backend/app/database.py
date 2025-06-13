from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from .core.config import settings
from .models import Base

engine = create_async_engine(settings.database_url, echo=False, future=True)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session 

# Helper to create tables in development environments (not for production migrations)
async def init_models() -> None:
    """Create database tables based on SQLAlchemy models.

    In production you should use Alembic migrations instead, but for quick
    prototypes this ensures the schema is up to date after the container
    starts.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) 