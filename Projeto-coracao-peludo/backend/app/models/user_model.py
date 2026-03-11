from bson import ObjectId


def user_entity(user) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "password": user.get("password")
    }


def users_entity(users) -> list:
    return [user_entity(user) for user in users]