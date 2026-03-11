from bson import ObjectId
from datetime import datetime
from app.database import forum_collection
from app.models.forum_model import forum_entity


async def create_post(post, author_id: str):
    post_dict = post.dict()
    post_dict["author_id"] = author_id
    post_dict["created_at"] = datetime.utcnow()

    result = await forum_collection.insert_one(post_dict)

    new_post = await forum_collection.find_one({"_id": result.inserted_id})

    return forum_entity(new_post)


async def get_posts():
    posts = []

    async for post in forum_collection.find().sort("created_at", -1):
        posts.append(forum_entity(post))

    return posts


async def get_post_by_id(post_id: str):
    post = await forum_collection.find_one({"_id": ObjectId(post_id)})

    if post:
        return forum_entity(post)

    return {"error": "Post não encontrado"}


async def update_post(post_id: str, data):
    await forum_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": data}
    )

    post = await forum_collection.find_one({"_id": ObjectId(post_id)})

    return forum_entity(post)


async def delete_post(post_id: str):
    await forum_collection.delete_one({"_id": ObjectId(post_id)})

    return {"message": "Post removido com sucesso"}