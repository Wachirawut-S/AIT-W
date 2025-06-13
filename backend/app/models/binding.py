from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from ..models import Base

class DoctorPatientBinding(Base):
    __tablename__ = "doctor_patient_bindings"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_name = Column(String(256), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_name = Column(String(256), nullable=False)
    action_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    state = Column(String(16), nullable=False)  # 'bounded' or 'unbounded' 