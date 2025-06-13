from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordRequestForm

from ..database import get_session
from ..models.user import User
from ..schemas.user import UserCreate, UserRead
from ..utils.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, session: AsyncSession = Depends(get_session)):
    # Check duplicates separately for clearer error messages ----------------
    dup_username = await session.execute(select(User).filter(User.username == user_in.username))
    if dup_username.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    dup_email = await session.execute(select(User).filter(User.email == user_in.email))
    if dup_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        date_of_birth=user_in.date_of_birth,
        address=user_in.address,
        role=user_in.role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


# Login endpoint (OAuth2 password flow)
@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(User).filter((User.username == form_data.username) | (User.email == form_data.username))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token = create_access_token(user.username, user.role)
    return {"access_token": access_token, "token_type": "bearer"} 