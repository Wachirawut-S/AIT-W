from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, join
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.exc import IntegrityError

from ..utils.security import require_role
from ..database import get_session
from ..models.user import User
from ..models.binding import DoctorPatientBinding
from ..models.assignment import Assignment
from ..schemas.user import UserRead
from ..schemas.assignment import AssignmentRead
from ..schemas.assignment_v2 import AssignmentReadV2, MCQItemRead, WritingItemRead
from ..models.assignment_details import AssignmentItemBase, WritingItem
from ..models.assignment_patient import AssignmentPatient
from ..models.assignment_record import AssignmentRecord, MCQAnswer, WritingAnswer
from pydantic import BaseModel

router = APIRouter(prefix="/doctor", tags=["doctor"], dependencies=[Depends(require_role(2))])

@router.get("/patients", response_model=List[UserRead])
async def my_patients(current: User = Depends(require_role(2)), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).filter(User.doctor_id == current.id))
    return result.scalars().all()

@router.get("/patients/available", response_model=List[UserRead])
async def available_patients(q: str | None = None, session: AsyncSession = Depends(get_session)):
    stmt = select(User).filter(User.role == 3, User.doctor_id == None)  # type: ignore
    if q:
        stmt = stmt.filter((User.username.ilike(f"%{q}%")) | (User.first_name.ilike(f"%{q}%")))
    result = await session.execute(stmt)
    return result.scalars().all()

@router.post("/patients/{patient_id}/bind", response_model=UserRead)
async def bind_patient(patient_id: int, current: User = Depends(require_role(2)), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).filter(User.id == patient_id, User.role == 3))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.doctor_id is not None:
        raise HTTPException(status_code=400, detail="Patient already bounded")
    patient.doctor_id = current.id
    binding = DoctorPatientBinding(
        doctor_id=current.id,
        doctor_name=current.username,
        patient_id=patient.id,
        patient_name=patient.username,
        state="bounded",
    )
    session.add(binding)
    await session.commit()
    await session.refresh(patient)
    return patient

# ---------------------------------------------------------------------------
# Inspect specific patient (only if bound to doctor)
# ---------------------------------------------------------------------------

@router.get("/patients/{patient_id}", response_model=UserRead)
async def inspect_patient(patient_id: int, current: User = Depends(require_role(2)), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).filter(User.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient or patient.role != 3:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.doctor_id != current.id:
        raise HTTPException(status_code=403, detail="Not your patient")
    return patient

# ---------------------------------------------------------------------------
# Assignments view (read-only) for doctors
# ---------------------------------------------------------------------------

@router.get("/assignments", response_model=list[AssignmentRead])
async def list_assignments(topic: int | None = None, session: AsyncSession = Depends(get_session)):
    stmt = select(Assignment).order_by(Assignment.created_at.desc())
    if topic:
        stmt = stmt.filter(Assignment.topic == topic)
    result = await session.execute(stmt)
    return result.scalars().all()

@router.get("/assignments/v2/{assignment_id}", response_model=AssignmentReadV2)
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

# legacy read

@router.get("/assignments/{assignment_id}", response_model=AssignmentRead)
async def get_assignment(assignment_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Assignment).filter(Assignment.id == assignment_id))
    ass = result.scalar_one_or_none()
    if not ass:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return ass

# ------------------- Assign existing assignments to patient -----------------

class AssignPayload(BaseModel):
    assignment_ids: list[int]

@router.post("/patients/{patient_id}/assign")
async def assign_assignments_to_patient(patient_id: int, payload: AssignPayload, current: User = Depends(require_role(2)), session: AsyncSession = Depends(get_session)):
    # ensure patient belongs to doctor
    result = await session.execute(select(User).filter(User.id == patient_id, User.role == 3))
    patient = result.scalar_one_or_none()
    if not patient or patient.doctor_id != current.id:
        raise HTTPException(status_code=403, detail="Not your patient")

    # insert links
    for aid in payload.assignment_ids:
        link = AssignmentPatient(assignment_id=aid, patient_id=patient_id)
        session.add(link)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
    return {"status": "ok"}

# list assignments for a patient

@router.get("/patients/{patient_id}/assignments", response_model=list[AssignmentRead])
async def patient_assignments(patient_id: int, current: User = Depends(require_role(2)), session: AsyncSession = Depends(get_session)):
    # ensure patient belongs to doctor
    result = await session.execute(select(User).filter(User.id == patient_id, User.role == 3))
    patient = result.scalar_one_or_none()
    if not patient or patient.doctor_id != current.id:
        raise HTTPException(status_code=403, detail="Not your patient")

    # get assignments ids
    sub = select(AssignmentPatient.assignment_id).filter(AssignmentPatient.patient_id == patient_id)
    result = await session.execute(select(Assignment).filter(Assignment.id.in_(sub)))
    return result.scalars().all()

# ---------------- Patient assignment records ----------------
class MCQAnswerOut(BaseModel):
    item_id:int
    choice_index:int
    is_correct:bool
    class Config: from_attributes=True

class WritingAnswerOut(BaseModel):
    item_id:int
    answer_text:str
    reviewed:bool|None=None
    correct:bool|None=None
    class Config: from_attributes=True

class RecordOut(BaseModel):
    id:int
    assignment_id:int
    finished_at:datetime|None
    score:int|None
    mcq_answers:list[MCQAnswerOut]=[]
    writing_answers:list[WritingAnswerOut]=[]
    class Config: from_attributes=True

@router.get("/patients/{patient_id}/records", response_model=list[RecordOut])
async def patient_records(patient_id:int, current:User=Depends(require_role(2)), session:AsyncSession=Depends(get_session)):
    # ensure patient belongs to doctor
    pat=await session.scalar(select(User).filter(User.id==patient_id, User.role==3))
    if not pat or pat.doctor_id!=current.id:
        raise HTTPException(status_code=403, detail="Not your patient")
    stmt=(select(AssignmentRecord)
           .options(selectinload(AssignmentRecord.mcq_answers), selectinload(AssignmentRecord.writing_answers))
           .filter_by(patient_id=patient_id))
    res=await session.execute(stmt)
    records=res.scalars().all()
    out=[]
    for r in records:
        out.append(RecordOut(
            id=r.id,
            assignment_id=r.assignment_id,
            finished_at=r.finished_at,
            score=r.score,
            mcq_answers=[MCQAnswerOut(**a.__dict__) for a in getattr(r,'mcq_answers',[])],
            writing_answers=[WritingAnswerOut(**a.__dict__) for a in getattr(r,'writing_answers',[])]
        ))
    return out 

# Review endpoints
class ReviewOut(BaseModel):
    answer_id:int
    record_id:int
    patient_id:int
    patient_name:str
    assignment_id:int
    assignment_title:str
    prompt:str|None=None
    answer_text:str
    reviewed:bool
    correct:bool|None=None

@router.get("/reviews", response_model=list[ReviewOut])
async def pending_reviews(current:User=Depends(require_role(2)), session:AsyncSession=Depends(get_session)):
    # fetch pending writing answers for doctor patients
    stmt=(select(WritingAnswer, AssignmentRecord, Assignment, User, AssignmentItemBase)
          .join(AssignmentRecord, WritingAnswer.record_id==AssignmentRecord.id)
          .join(Assignment, Assignment.id==AssignmentRecord.assignment_id)
          .join(User, User.id==AssignmentRecord.patient_id)
          .join(AssignmentItemBase, AssignmentItemBase.id==WritingAnswer.item_id, isouter=True)
          .filter(User.doctor_id==current.id, WritingAnswer.reviewed==False))
    res=await session.execute(stmt)
    out=[]
    for wa, rec, ass, pat, item in res.all():
        out.append(ReviewOut(
            answer_id=wa.id,
            record_id=rec.id,
            patient_id=pat.id,
            patient_name=pat.username,
            assignment_id=ass.id,
            assignment_title=ass.title,
            prompt=getattr(item,'prompt',None),
            answer_text=wa.answer_text,
            reviewed=wa.reviewed,
            correct=wa.correct
        ))
    return out

class ReviewUpdate(BaseModel):
    correct: bool

@router.post("/reviews/{answer_id}")
async def mark_review(answer_id:int, payload:ReviewUpdate, current:User=Depends(require_role(2)), session:AsyncSession=Depends(get_session)):
    wa=await session.get(WritingAnswer, answer_id)
    if not wa:
        raise HTTPException(status_code=404, detail="Answer not found")
    # ensure doctor owns patient
    rec=await session.get(AssignmentRecord, wa.record_id)
    pat=await session.get(User, rec.patient_id) if rec else None
    if not pat or pat.doctor_id!=current.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    wa.reviewed=True
    wa.correct=payload.correct
    # update record score if auto graded previously not counted
    if payload.correct:
        rec.score=(rec.score or 0)+1
    await session.commit()
    return {"status":"ok"} 