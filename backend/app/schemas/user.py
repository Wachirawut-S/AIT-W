from pydantic import BaseModel, EmailStr, constr, field_validator
from datetime import date

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: date | None = None  # ISO date
    address: str | None = None
    role: int = 3
    is_active: bool = True

class UserCreate(UserBase):
    password: constr(min_length=8)

    @field_validator("date_of_birth")
    @classmethod
    def not_in_future(cls, v: date | None):
        if v is not None and v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

class UserRead(UserBase):
    id: int
    doctor_id: int | None = None

    class Config:
        orm_mode = True 