from pydantic import BaseModel
from datetime import datetime


class MessageCreate(BaseModel):
    chat_id: str
    receiver_id: str
    content: str


class MessageResponse(BaseModel):
    id: str
    chat_id: str
    sender_id: str
    receiver_id: str
    content: str
    created_at: datetime