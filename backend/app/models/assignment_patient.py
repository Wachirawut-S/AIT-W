from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint, func
from sqlalchemy.orm import relationship
from ..models import Base

class AssignmentPatient(Base):
    __tablename__ = "assignment_patient"

    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"))
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("assignment_id", "patient_id", name="uix_assignment_patient"),)

    # optional relationships
    assignment = relationship("Assignment")
    patient = relationship("User") 