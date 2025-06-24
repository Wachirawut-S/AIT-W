from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import insert

from ..database import get_session
from ..utils.security import require_role
from ..models.user import User
from ..models.assignment import Assignment
from ..models.assignment_patient import AssignmentPatient
from ..models.assignment_record import AssignmentRecord, MCQAnswer, WritingAnswer
from ..schemas.assignment import AssignmentRead
from pydantic import BaseModel
from ..schemas.assignment_v2 import AssignmentReadV2, MCQItemRead, WritingItemRead
from ..models.assignment_details import AssignmentItemBase

router = APIRouter(prefix="/patient", tags=["patient"], dependencies=[Depends(require_role(3))])

# list doctor-assigned assignments
@router.get("/assignments", response_model=List[AssignmentRead])
async def my_assignments(topic: int | None = None, current: User = Depends(require_role(3)), session: AsyncSession = Depends(get_session)):
    sub = select(AssignmentPatient.assignment_id).filter(AssignmentPatient.patient_id == current.id)
    stmt = select(Assignment).filter(Assignment.id.in_(sub))
    if topic:
        stmt = stmt.filter(Assignment.topic == topic)
    res = await session.execute(stmt)
    return res.scalars().all()

# helper: get or create record
async def _get_record(session: AsyncSession, assignment_id: int, patient_id: int) -> AssignmentRecord:
    # Try to locate the most recent **unfinished** record.
    rec_stmt = (
        select(AssignmentRecord)
        .filter_by(assignment_id=assignment_id, patient_id=patient_id, finished_at=None)
        .order_by(AssignmentRecord.id.desc())
        .limit(1)
    )
    rec = await session.scalar(rec_stmt)
    # If none exists (first time or previous attempt already finished) -> create new record
    if rec is None:
        rec = AssignmentRecord(assignment_id=assignment_id, patient_id=patient_id)
        session.add(rec)
        await session.flush()
    return rec

# Fetch the most recent record for an assignment/patient regardless of whether it
# has been finished. Unlike `_get_record`, this helper never creates a new
# record – it merely returns `None` if nothing exists yet.
async def _get_latest_record(session: AsyncSession, assignment_id:int, patient_id:int) -> AssignmentRecord|None:
    stmt=(select(AssignmentRecord)
           .filter_by(assignment_id=assignment_id, patient_id=patient_id)
           .order_by(AssignmentRecord.id.desc())
           .limit(1))
    return await session.scalar(stmt)

class MCQSubmit(BaseModel):
    item_id: int
    choice_index: int
    is_correct: bool

@router.post("/records/{assignment_id}/mcq")
async def submit_mcq(assignment_id: int, payload: MCQSubmit, current: User = Depends(require_role(3)), session: AsyncSession = Depends(get_session)):
    rec = await _get_record(session, assignment_id, current.id)
    session.add(MCQAnswer(record_id=rec.id, **payload.model_dump()))
    await session.commit()
    return {"ok": True}

class WritingSubmit(BaseModel):
    item_id: int
    answer_text: str

@router.post("/records/{assignment_id}/writing")
async def submit_writing(assignment_id: int, payload: WritingSubmit, current: User = Depends(require_role(3)), session: AsyncSession = Depends(get_session)):
    # Use the most recent record even if it has already been finished so that
    # answers submitted AFTER the finish call are still attached correctly
    # instead of spawning a brand-new, rogue record.
    rec = await _get_latest_record(session, assignment_id, current.id)
    if rec is None:
        # Fallback: no record yet – create one (should rarely happen)
        rec = await _get_record(session, assignment_id, current.id)
    stmt = insert(WritingAnswer).values(record_id=rec.id, **payload.model_dump()).on_conflict_do_update(
        index_elements=[WritingAnswer.record_id, WritingAnswer.item_id],
        set_={"answer_text": payload.answer_text}
    )
    await session.execute(stmt)
    await session.commit()
    return {"ok": True}

class FinishPayload(BaseModel):
    score: int | None = None

@router.post("/records/{assignment_id}/finish")
async def finish_assignment(assignment_id: int, payload: FinishPayload, current: User = Depends(require_role(3)), session: AsyncSession = Depends(get_session)):
    rec = await _get_record(session, assignment_id, current.id)
    rec.finished_at = datetime.utcnow()
    rec.score = payload.score
    await session.commit()
    return {"done": True}

# ensure record exists (start)
@router.post("/records/{assignment_id}/start")
async def start_assignment(assignment_id:int, current:User=Depends(require_role(3)), session:AsyncSession=Depends(get_session)):
    await _get_record(session, assignment_id, current.id)
    await session.commit()
    return {"started":True}

# progress list for patient UI
class RecordOut(BaseModel):
    assignment_id: int
    finished_at: datetime | None
    score: int | None
    class Config: from_attributes = True

@router.get("/records", response_model=List[RecordOut])
async def my_records(current: User = Depends(require_role(3)), session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(AssignmentRecord).filter_by(patient_id=current.id))
    return res.scalars().all()

# detailed assignment (v2) only if assigned to patient
@router.get("/assignments/v2/{assignment_id}", response_model=AssignmentReadV2)
async def assigned_assignment_v2(assignment_id:int, current:User=Depends(require_role(3)), session:AsyncSession=Depends(get_session)):
    # confirm assigned
    assigned = await session.scalar(
        select(AssignmentPatient).filter_by(assignment_id=assignment_id, patient_id=current.id)
    )
    if not assigned:
        raise HTTPException(status_code=403, detail="Not assigned")

    stmt=(select(Assignment)
          .options(
              selectinload(Assignment.items_detail),
              selectinload(Assignment.items_detail).selectinload(AssignmentItemBase.mcq),
              selectinload(Assignment.items_detail).selectinload(AssignmentItemBase.writing),
          )
          .filter(Assignment.id==assignment_id))
    res=await session.execute(stmt)
    ass=res.scalar_one()

    items_out=[]
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

    return AssignmentReadV2(id=ass.id,topic=ass.topic,title=ass.title,qtype=ass.qtype,properties=ass.properties,items=items_out)

# legacy assignment read (JSON)

@router.get("/assignments/{assignment_id}", response_model=AssignmentRead)
async def assigned_assignment_legacy(assignment_id:int, current:User=Depends(require_role(3)), session:AsyncSession=Depends(get_session)):
    assigned=await session.scalar(select(AssignmentPatient).filter_by(assignment_id=assignment_id, patient_id=current.id))
    if not assigned:
        raise HTTPException(status_code=403, detail="Not assigned")
    res=await session.execute(select(Assignment).options(selectinload(Assignment.items)).filter(Assignment.id==assignment_id))
    ass=res.scalar_one_or_none()
    if not ass:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return ass

# ---------------- History helpers & endpoint ----------------
class MCQAnswerOut(BaseModel):
    item_id: int
    choice_index: int
    is_correct: bool

    class Config:
        from_attributes = True

class WritingAnswerOut(BaseModel):
    item_id: int
    answer_text: str
    reviewed: bool | None = None
    correct: bool | None = None

    class Config:
        from_attributes = True

class RecordDetailOut(BaseModel):
    id: int
    assignment_id: int
    started_at: datetime
    finished_at: datetime | None
    score: int | None
    mcq_answers: List[MCQAnswerOut]
    writing_answers: List[WritingAnswerOut]

    class Config:
        from_attributes = True

@router.get("/records/{assignment_id}/history", response_model=List[RecordDetailOut])
async def assignment_history(
    assignment_id: int,
    current: User = Depends(require_role(3)),
    session: AsyncSession = Depends(get_session),
):
    # confirm assigned (reuse existing logic but lighter query)
    assigned = await session.scalar(
        select(AssignmentPatient).filter_by(assignment_id=assignment_id, patient_id=current.id)
    )
    if not assigned:
        raise HTTPException(status_code=403, detail="Not assigned")

    stmt = (
        select(AssignmentRecord)
        .options(selectinload(AssignmentRecord.mcq_answers), selectinload(AssignmentRecord.writing_answers))
        .filter_by(assignment_id=assignment_id, patient_id=current.id)
        .order_by(AssignmentRecord.started_at.desc())
    )
    res = await session.execute(stmt)
    records: List[AssignmentRecord] = res.scalars().all()

    # Build output list
    out: List[RecordDetailOut] = []
    for r in records:
        out.append(
            RecordDetailOut(
                id=r.id,
                assignment_id=r.assignment_id,
                started_at=r.started_at,
                finished_at=r.finished_at,
                score=r.score,
                mcq_answers=[MCQAnswerOut(**a.__dict__) for a in getattr(r, "mcq_answers", [])],  # type: ignore[arg-type]
                writing_answers=[WritingAnswerOut(**a.__dict__) for a in getattr(r, "writing_answers", [])],  # type: ignore[arg-type]
            )
        )
    return out

@router.get("/records/detail/{record_id}", response_model=RecordDetailOut)
async def assignment_record_detail(record_id:int, current:User=Depends(require_role(3)), session:AsyncSession=Depends(get_session)):
    rec_stmt=(
        select(AssignmentRecord)
        .options(selectinload(AssignmentRecord.mcq_answers), selectinload(AssignmentRecord.writing_answers))
        .filter_by(id=record_id, patient_id=current.id)
    )
    rec=await session.scalar(rec_stmt)
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")
    return RecordDetailOut(
        id=rec.id,
        assignment_id=rec.assignment_id,
        started_at=rec.started_at,
        finished_at=rec.finished_at,
        score=rec.score,
        mcq_answers=[MCQAnswerOut(**a.__dict__) for a in getattr(rec,"mcq_answers",[])],
        writing_answers=[WritingAnswerOut(**a.__dict__) for a in getattr(rec,"writing_answers",[])]
    ) 