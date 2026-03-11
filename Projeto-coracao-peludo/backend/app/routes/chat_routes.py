from fastapi import APIRouter
from app.controllers.chat_controller import (
    send_message_controller,
    get_messages_controller
)
from app.schemas.message_schema import MessageCreate

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message")
async def send_message(message: MessageCreate):
    sender_id = "mock_user_id"
    return await send_message_controller(message, sender_id)


@router.get("/{chat_id}")
async def get_messages(chat_id: str):
    return await get_messages_controller(chat_id)