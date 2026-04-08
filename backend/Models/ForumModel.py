from pydantic import BaseModel
from typing import Optional

# ======================= MODELS =======================

class ForumPostCreate(BaseModel):
    title: str
    content: str
    category: str  # dicas, curiosidades, saude, adocao

class ForumPostResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    comments_count: int = 0
    likes_count: int = 0
    created_at: str