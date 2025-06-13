from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from ..database import get_session
from ..models.user import User
from ..schemas.user import UserRead, UserBase
from ..utils.security import require_role
from pydantic import validator

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role(1))])

@router.get("/users", response_model=List[UserRead])
async def list_users(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User))
    return result.scalars().all()

@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(user_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

class UserUpdate(UserBase):
    # all fields optional for partial update
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    role: Optional[int] = None
    is_active: Optional[bool] = None
    doctor_id: Optional[int] = None

    # only validate if provided
    @classmethod
    def validate_date(cls, v):
        if v is not None and v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

    _normalize_dob = validator("date_of_birth", allow_reuse=True)(validate_date)

@router.put("/users/{user_id}", response_model=UserRead)
async def update_user(user_id: int, data: UserUpdate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(user, k, v)

    await session.commit()
    await session.refresh(user)
    return user 