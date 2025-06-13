from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped

from . import Base

class DoctorPatientHistory(Base):
    __tablename__ = "doctor_patient_history"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_name: Mapped[str] = Column(String(256), nullable=False)
    patient_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_name: Mapped[str] = Column(String(256), nullable=False)
    state: Mapped[str] = Column(String(32), nullable=False)  # "bounded" or "unbounded"
    timestamp: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False) 