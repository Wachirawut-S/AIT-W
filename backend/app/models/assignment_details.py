from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from ..models import Base

class AssignmentItemBase(Base):
    __tablename__ = "assignment_items_base"

    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"))
    order_index = Column("order_index", Integer, nullable=False)
    prompt = Column(String, nullable=True)
    image_path = Column(String, nullable=True)

    # one-to-one links to specialized tables
    mcq = relationship("MCQItem", uselist=False, back_populates="base", cascade="all, delete-orphan")
    writing = relationship("WritingItem", uselist=False, back_populates="base", cascade="all, delete-orphan")

    # back reference to assignment (declared in assignment.py)
    assignment = relationship("Assignment", back_populates="items_detail")

    # property for compatibility
    @property
    def order(self):
        return self.order_index


class MCQItem(Base):
    __tablename__ = "mcq_items"

    id = Column(Integer, ForeignKey("assignment_items_base.id", ondelete="CASCADE"), primary_key=True)
    choices = Column(JSON, nullable=True)  # list[ {text,image} ]
    answer_key = Column(Integer, nullable=True)

    base = relationship("AssignmentItemBase", back_populates="mcq", uselist=False)


class WritingItem(Base):
    __tablename__ = "writing_items"

    id = Column(Integer, ForeignKey("assignment_items_base.id", ondelete="CASCADE"), primary_key=True)
    answer_key = Column(String, nullable=True)
    manual_review = Column(Boolean, default=False)

    base = relationship("AssignmentItemBase", back_populates="writing", uselist=False) 