from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..utils.security import require_role
from ..database import get_session
from ..models.user import User
from ..models.binding import DoctorPatientBinding
from ..schemas.user import UserRead

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