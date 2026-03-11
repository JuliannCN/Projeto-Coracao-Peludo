from app.services.chat_service import send_message, get_chat_messages


async def send_message_controller(message, sender_id: str):
    return await send_message(message, sender_id)


async def get_messages_controller(chat_id: str):
    return await get_chat_messages(chat_id)