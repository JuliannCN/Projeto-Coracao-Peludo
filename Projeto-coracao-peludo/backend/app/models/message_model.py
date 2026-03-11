def message_entity(message) -> dict:
    return {
        "id": str(message["_id"]),
        "chat_id": message.get("chat_id"),
        "sender_id": message.get("sender_id"),
        "receiver_id": message.get("receiver_id"),
        "content": message.get("content"),
        "created_at": message.get("created_at")
    }


def messages_entity(messages) -> list:
    return [message_entity(message) for message in messages]