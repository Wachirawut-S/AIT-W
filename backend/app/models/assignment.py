from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from ..models import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True)
    topic = Column(Integer, nullable=False)  # 1-9
    title = Column(String(256), nullable=False)
    qtype = Column(String(16), nullable=False)  # multiple_choice, drag_drop, writing
    properties = Column(JSON, nullable=True)    # num_choices, manual_review, etc.
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to legacy JSON items (kept for backward-compatibility)
    items = relationship(
        "AssignmentItem",
        back_populates="assignment",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # Relationship to new typed detail items
    items_detail = relationship(
        "AssignmentItemBase",
        back_populates="assignment",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

class AssignmentItem(Base):
    __tablename__ = "assignment_items"

    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"))
    prompt = Column(String, nullable=True)
    image_path = Column(String, nullable=True)
    choices = Column(JSON, nullable=True)  # list of strings or image paths
    answer_key = Column(String, nullable=True)
    order = Column(Integer, nullable=False)

    assignment = relationship("Assignment", back_populates="items") 