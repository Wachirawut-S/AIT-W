from typing import List, Optional
from pydantic import BaseModel

class Choice(BaseModel):
    text: str | None = None
    image: str | None = None

class ItemCreate(BaseModel):
    prompt: Optional[str] = None
    image_path: Optional[str] = None
    choices: List[Choice]
    # Stored as integer for multiple-choice and string for writing, so accept
    # either type here.
    answer_key: int | str | None = None

class AssignmentCreate(BaseModel):
    topic: int
    title: str
    qtype: str  # multiple_choice, drag_drop, writing
    properties: Optional[dict] = None
    items: List[ItemCreate]

class ItemRead(ItemCreate):
    id: int

    class Config:
        orm_mode = True

class AssignmentRead(BaseModel):
    id: int
    topic: int
    title: str
    qtype: str
    properties: Optional[dict]
    items: List[ItemRead]

    class Config:
        orm_mode = True 