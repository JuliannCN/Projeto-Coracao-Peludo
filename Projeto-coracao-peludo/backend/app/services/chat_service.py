from datetime import datetime
from bson import ObjectId
from app.database import chat_collection
from app.models.message_model import message_entity


async def send_message(message, sender_id: str):
    message_dict = message.dict()

    message_dict["sender_id"] = sender_id
    message_dict["created_at"] = datetime.utcnow()

    result = await chat_collection.insert_one(message_dict)

    new_message = await chat_collection.find_one({"_id": result.inserted_id})

    return message_entity(new_message)


async def get_chat_messages(chat_id: str):
    messages = []

    async for message in chat_collection.find({"chat_id": chat_id}).sort("created_at", 1):
        messages.append(message_entity(message))

    return messages