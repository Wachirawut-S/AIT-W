from sqlalchemy import Boolean, Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import Mapped, relationship

from typing import List, Optional

from ..models import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    username: Mapped[str] = Column(String(64), unique=True, index=True, nullable=False)
    email: Mapped[str] = Column(String(256), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = Column(String(256), nullable=False)
    first_name: Mapped[Optional[str]] = Column(String(128), nullable=True)
    last_name: Mapped[Optional[str]] = Column(String(128), nullable=True)
    date_of_birth: Mapped[Optional[Date]] = Column(Date, nullable=True)
    address: Mapped[Optional[str]] = Column(String(512), nullable=True)
    role: Mapped[int] = Column(Integer, default=3)  # 1=admin, 2=doctor, 3=patient
    is_active: Mapped[bool] = Column(Boolean, default=True)

    # Doctor-patient relationship (one doctor, many patients). For doctors this lists
    # their patients; for patients, `doctor_id` points to their doctor.
    doctor_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("users.id"), nullable=True)
    patients: Mapped[List["User"]] = relationship("User", backref="doctor", remote_side=[id]) 