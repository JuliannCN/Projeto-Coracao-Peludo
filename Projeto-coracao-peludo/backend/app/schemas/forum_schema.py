from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ForumCreate(BaseModel):
    title: str
    content: str


class ForumUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class ForumResponse(BaseModel):
    id: str
    title: str
    content: str
    author_id: str
    created_at: datetime