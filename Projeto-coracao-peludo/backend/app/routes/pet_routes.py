from fastapi import APIRouter
from app.controllers.pet_controller import (
    create_pet_controller,
    list_pets_controller,
    get_pet_controller,
    update_pet_controller,
    delete_pet_controller
)
from app.schemas.pet_schema import PetCreate, PetUpdate

router = APIRouter(prefix="/pets", tags=["Pets"])


@router.post("/")
async def create_pet(pet: PetCreate):
    owner_id = "mock_user_id"
    return await create_pet_controller(pet, owner_id)


@router.get("/")
async def get_pets():
    return await list_pets_controller()


@router.get("/{pet_id}")
async def get_pet(pet_id: str):
    return await get_pet_controller(pet_id)


@router.put("/{pet_id}")
async def update_pet(pet_id: str, pet: PetUpdate):
    return await update_pet_controller(pet_id, pet.dict(exclude_unset=True))


@router.delete("/{pet_id}")
async def delete_pet(pet_id: str):
    return await delete_pet_controller(pet_id)