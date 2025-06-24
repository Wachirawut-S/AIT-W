from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, String, func
from sqlalchemy.orm import relationship
from ..models import Base

class AssignmentRecord(Base):
    __tablename__ = "assignment_record"

    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"))
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Integer, nullable=True)

    assignment = relationship("Assignment")
    patient = relationship("User")
    mcq_answers = relationship("MCQAnswer", back_populates="record", cascade="all, delete-orphan")
    writing_answers = relationship("WritingAnswer", back_populates="record", cascade="all, delete-orphan")

class MCQAnswer(Base):
    __tablename__ = "mcq_answer"

    id = Column(Integer, primary_key=True)
    record_id = Column(Integer, ForeignKey("assignment_record.id", ondelete="CASCADE"))
    item_id = Column(Integer)
    choice_index = Column(Integer)
    is_correct = Column(Boolean)

    record = relationship("AssignmentRecord", back_populates="mcq_answers")

class WritingAnswer(Base):
    __tablename__ = "writing_answer"

    id = Column(Integer, primary_key=True)
    record_id = Column(Integer, ForeignKey("assignment_record.id", ondelete="CASCADE"))
    item_id = Column(Integer, ForeignKey("assignment_items_base.id", ondelete="CASCADE"))
    answer_text = Column(String)
    reviewed = Column(Boolean, default=False)
    correct = Column(Boolean, nullable=True)

    record = relationship("AssignmentRecord", back_populates="writing_answers") 