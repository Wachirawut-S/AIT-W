from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid, os

from ..utils.security import require_role
from ..database import get_session
from ..models.assignment import Assignment
from ..utils.images import process_upload, ImageValidationError
from ..schemas.assignment import AssignmentCreate, AssignmentRead
from ..models.assignment_details import AssignmentItemBase, MCQItem, WritingItem
from ..schemas.assignment_v2 import AssignmentReadV2, MCQItemRead, WritingItemRead

UPLOAD_DIR = "uploaded"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/assignments", tags=["assignments"], dependencies=[Depends(require_role(1))])

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    data = await file.read()
    try:
        processed = process_upload(data)
    except ImageValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    name = f"{uuid.uuid4().hex}.webp"
    path = os.path.join(UPLOAD_DIR, name)
    with open(path, "wb") as f:
        f.write(processed)
    return {"path": f"/static/{name}"}

@router.post("/", response_model=AssignmentRead)
async def create_assignment(payload: AssignmentCreate, current=Depends(require_role(1)), session: AsyncSession = Depends(get_session)):
    ass = Assignment(topic=payload.topic, title=payload.title, qtype=payload.qtype, properties=payload.properties, created_by=current.id)
    session.add(ass)
    await session.flush()
    for i, item in enumerate(payload.items):
        base = AssignmentItemBase(
            assignment_id=ass.id,
            order_index=i,
            prompt=item.prompt,
            image_path=item.image_path,
        )
        session.add(base)
        await session.flush()
        if payload.qtype == "multiple_choice":
            session.add(
                MCQItem(
                    id=base.id,
                    choices=[c.model_dump() for c in item.choices],
                    answer_key=int(item.answer_key) if item.answer_key is not None else None,
                )
            )
        else:  # writing
            session.add(WritingItem(id=base.id, answer_key=item.answer_key, manual_review=payload.properties.get("manualReview", False) if payload.properties else False))
    await session.commit()
    await session.refresh(ass)
    return ass

# ---------------------------------------------------------------------------
# Query assignments
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[AssignmentRead])
async def list_assignments(topic: int | None = None, session: AsyncSession = Depends(get_session)):
    stmt = select(Assignment).order_by(Assignment.created_at.desc())
    if topic:
        stmt = stmt.filter(Assignment.topic == topic)
    result = await session.execute(stmt)
    return result.scalars().all()

# delete assignment
@router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Assignment).filter(Assignment.id == assignment_id))
    ass = result.scalar_one_or_none()
    if not ass:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await session.delete(ass)
    await session.commit()
    return {"status": "deleted"}

# --------- V2 read using detail tables ----------

@router.get("/v2/{assignment_id}", response_model=AssignmentReadV2)
async def get_assignment_v2(assignment_id: int, session: AsyncSession = Depends(get_session)):
    stmt = (
        select(Assignment)
        .options(
            selectinload(Assignment.items_detail),
            selectinload(Assignment.items_detail).selectinload(AssignmentItemBase.mcq),
            selectinload(Assignment.items_detail).selectinload(AssignmentItemBase.writing),
        )
        .filter(Assignment.id == assignment_id)
    )
    result = await session.execute(stmt)
    ass = result.scalar_one_or_none()
    if not ass:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # build union items list
    items_out = []
    for base in ass.items_detail:  # type: ignore[attr-defined]
        if base.mcq:
            items_out.append(
                MCQItemRead(
                    id=base.id,
                    prompt=base.prompt,
                    image_path=base.image_path,
                    choices=base.mcq.choices,
                    answer_key=base.mcq.answer_key,
                )
            )
        elif base.writing:
            items_out.append(
                WritingItemRead(
                    id=base.id,
                    prompt=base.prompt,
                    image_path=base.image_path,
                    answer_key=base.writing.answer_key,
                    manual_review=base.writing.manual_review,
                )
            )

    return AssignmentReadV2(
        id=ass.id,
        topic=ass.topic,
        title=ass.title,
        qtype=ass.qtype,
        properties=ass.properties,
        items=items_out,
    )

# ---------------------------------------------------------------------------
# Update assignment
# ---------------------------------------------------------------------------

@router.put("/{assignment_id}", response_model=AssignmentRead)
async def update_assignment(assignment_id: int, payload: AssignmentCreate, current=Depends(require_role(1)), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Assignment).options(selectinload(Assignment.items_detail)).filter(Assignment.id == assignment_id))
    ass = result.scalar_one_or_none()
    if not ass:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Update top-level fields
    ass.topic = payload.topic
    ass.title = payload.title
    ass.qtype = payload.qtype
    ass.properties = payload.properties

    # Clear existing typed items
    for base in ass.items_detail:  # type: ignore[attr-defined]
        await session.delete(base)
    await session.flush()

    # Recreate items with new data
    for i, item in enumerate(payload.items):
        base = AssignmentItemBase(
            assignment_id=ass.id,
            order_index=i,
            prompt=item.prompt,
            image_path=item.image_path,
        )
        session.add(base)
        await session.flush()
        if payload.qtype == "multiple_choice":
            session.add(
                MCQItem(
                    id=base.id,
                    choices=[c.model_dump() for c in item.choices],
                    answer_key=int(item.answer_key) if item.answer_key is not None else None,
                )
            )
        else:  # writing
            session.add(WritingItem(id=base.id, answer_key=item.answer_key, manual_review=payload.properties.get("manualReview", False) if payload.properties else False))

    await session.commit()

    # Return refreshed model
    await session.refresh(ass)
    return ass 