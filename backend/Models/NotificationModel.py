from pydantic import BaseModel
from typing import Optional

# ======================= MODELS =======================

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str  # adoption_request, message, forum_reply, system
    related_id: Optional[str] = None
    read: bool = False
    created_at: str