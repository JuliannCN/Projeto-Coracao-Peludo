from pydantic import BaseModel
from typing import Optional

# ======================= MODELS =======================

class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    pet_id: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    receiver_name: str
    content: str
    pet_id: Optional[str] = None
    pet_name: Optional[str] = None
    read: bool = False
    created_at: str