from bson import ObjectId
from app.database import adoption_collection, pet_collection
from app.models.adoption_model import adoption_entity, adoptions_entity


async def request_adoption(pet_id: str, adopter_id: str):
    adoption_data = {
        "pet_id": pet_id,
        "adopter_id": adopter_id,
        "status": "pending"
    }

    result = await adoption_collection.insert_one(adoption_data)

    adoption = await adoption_collection.find_one({"_id": result.inserted_id})

    return adoption_entity(adoption)


async def get_adoptions():
    adoptions = []

    async for adoption in adoption_collection.find():
        adoptions.append(adoption_entity(adoption))

    return adoptions


async def approve_adoption(adoption_id: str):
    adoption = await adoption_collection.find_one({"_id": ObjectId(adoption_id)})

    if not adoption:
        return {"error": "Adoção não encontrada"}

    await adoption_collection.update_one(
        {"_id": ObjectId(adoption_id)},
        {"$set": {"status": "approved"}}
    )

    await pet_collection.update_one(
        {"_id": ObjectId(adoption["pet_id"])},
        {"$set": {"adopted": True}}
    )

    updated = await adoption_collection.find_one({"_id": ObjectId(adoption_id)})

    return adoption_entity(updated)


async def reject_adoption(adoption_id: str):
    await adoption_collection.update_one(
        {"_id": ObjectId(adoption_id)},
        {"$set": {"status": "rejected"}}
    )

    adoption = await adoption_collection.find_one({"_id": ObjectId(adoption_id)})

    return adoption_entity(adoption)