from pydantic import BaseModel
from typing import Optional

# ======================= MODELS =======================

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    post_id: str
    content: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    created_at: str