from bson import ObjectId
from app.database import pet_collection
from app.models.pet_model import pet_entity, pets_entity


async def create_pet(pet, owner_id: str):
    pet_dict = pet.dict()
    pet_dict["owner_id"] = owner_id
    pet_dict["adopted"] = False

    result = await pet_collection.insert_one(pet_dict)

    new_pet = await pet_collection.find_one({"_id": result.inserted_id})

    return pet_entity(new_pet)


async def get_pets():
    pets = []

    async for pet in pet_collection.find():
        pets.append(pet_entity(pet))

    return pets


async def get_pet_by_id(pet_id: str):
    pet = await pet_collection.find_one({"_id": ObjectId(pet_id)})

    if pet:
        return pet_entity(pet)

    return {"error": "Pet não encontrado"}


async def update_pet(pet_id: str, data):
    await pet_collection.update_one(
        {"_id": ObjectId(pet_id)},
        {"$set": data}
    )

    pet = await pet_collection.find_one({"_id": ObjectId(pet_id)})

    return pet_entity(pet)


async def delete_pet(pet_id: str):
    await pet_collection.delete_one({"_id": ObjectId(pet_id)})

    return {"message": "Pet removido com sucesso"}