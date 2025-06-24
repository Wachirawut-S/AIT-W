from typing import List, Literal, Union, Optional
from pydantic import BaseModel

class Choice(BaseModel):
    text: Optional[str] = None
    image: Optional[str] = None

# --------------------- detail item DTOs -----------------------
class MCQItemRead(BaseModel):
    type: Literal["mcq"] = "mcq"
    id: int
    prompt: Optional[str] = None
    image_path: Optional[str] = None
    choices: List[Choice]
    answer_key: Optional[int]

    class Config:
        orm_mode = True

class WritingItemRead(BaseModel):
    type: Literal["writing"] = "writing"
    id: int
    prompt: Optional[str]
    image_path: Optional[str]
    answer_key: Optional[str]
    manual_review: bool = False

    class Config:
        orm_mode = True

ItemRead = Union[MCQItemRead, WritingItemRead]

class AssignmentReadV2(BaseModel):
    id: int
    topic: int
    title: str
    qtype: str
    items: List[ItemRead]
    properties: Optional[dict]

    class Config:
        orm_mode = True 