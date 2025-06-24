from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

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
        # Create tables that don't exist yet
        await conn.run_sync(Base.metadata.create_all)

        # -----------------------------------------------------------------
        # Quick-fix migrations for dev environments ------------------------
        # Add generic columns to assignment_items_base if missing so that
        # the new typed-table schema aligns with an older database.
        # In production use Alembic instead.
        # -----------------------------------------------------------------
        await conn.execute(
            text(
                """
                ALTER TABLE assignment_items_base
                ADD COLUMN IF NOT EXISTS prompt TEXT;
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE assignment_items_base
                ADD COLUMN IF NOT EXISTS image_path TEXT;
                """
            )
        )

        # Allow multiple attempts per patient/assignment by dropping the unique
        # constraint that previously enforced one record only.
        await conn.execute(
            text(
                """
                ALTER TABLE assignment_record
                DROP CONSTRAINT IF EXISTS assignment_record_assignment_id_patient_id_key;
                """
            )
        )

        # Ensure a (non-unique) index exists for efficient look-ups.
        await conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS idx_assignment_record_assignment_patient
                ON assignment_record (assignment_id, patient_id);
                """
            )
        )

        # Ensure writing_answer.item_id points to assignment_items_base with
        # ON DELETE CASCADE so that answers are removed when an admin deletes
        # or replaces items while editing an assignment.
        await conn.execute(
            text(
                """
                -- Remove legacy FK that points to writing_items and blocks
                -- deletion of items that already have answers.
                ALTER TABLE writing_answer
                DROP CONSTRAINT IF EXISTS writing_answer_item_id_fkey;
                """
            )
        )

        await conn.execute(
            text(
                """
                ALTER TABLE writing_answer
                ADD CONSTRAINT writing_answer_item_id_fkey
                FOREIGN KEY (item_id)
                REFERENCES assignment_items_base(id)
                ON DELETE CASCADE;
                """
            )
        ) 