from app.services.adoption_service import (
    request_adoption,
    get_adoptions,
    approve_adoption,
    reject_adoption
)


async def request_adoption_controller(pet_id: str, adopter_id: str):
    return await request_adoption(pet_id, adopter_id)


async def list_adoptions_controller():
    return await get_adoptions()


async def approve_adoption_controller(adoption_id: str):
    return await approve_adoption(adoption_id)


async def reject_adoption_controller(adoption_id: str):
    return await reject_adoption(adoption_id)