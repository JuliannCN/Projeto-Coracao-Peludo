from bson import ObjectId
from app.database import user_collection
from app.models.user_model import user_entity, users_entity


async def create_user(user):
    user_dict = user.dict()

    result = await user_collection.insert_one(user_dict)

    new_user = await user_collection.find_one({"_id": result.inserted_id})

    return user_entity(new_user)


async def get_users():
    users = []

    async for user in user_collection.find():
        users.append(user_entity(user))

    return users


async def get_user_by_id(user_id: str):
    user = await user_collection.find_one({"_id": ObjectId(user_id)})

    if user:
        return user_entity(user)

    return {"error": "Usuário não encontrado"}


async def update_user(user_id: str, data):
    await user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": data}
    )

    user = await user_collection.find_one({"_id": ObjectId(user_id)})

    return user_entity(user)


async def delete_user(user_id: str):
    await user_collection.delete_one({"_id": ObjectId(user_id)})

    return {"message": "Usuário removido com sucesso"}