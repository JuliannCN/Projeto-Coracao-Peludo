from app.services.pet_service import (
    create_pet,
    get_pets,
    get_pet_by_id,
    update_pet,
    delete_pet
)


async def create_pet_controller(pet, owner_id: str):
    return await create_pet(pet, owner_id)


async def list_pets_controller():
    return await get_pets()


async def get_pet_controller(pet_id: str):
    return await get_pet_by_id(pet_id)


async def update_pet_controller(pet_id: str, data):
    return await update_pet(pet_id, data)


async def delete_pet_controller(pet_id: str):
    return await delete_pet(pet_id)