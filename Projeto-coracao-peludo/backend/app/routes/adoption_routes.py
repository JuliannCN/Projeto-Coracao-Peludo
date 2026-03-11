from fastapi import APIRouter
from app.controllers.adoption_controller import (
    request_adoption_controller,
    list_adoptions_controller,
    approve_adoption_controller,
    reject_adoption_controller
)
from app.schemas.adoption_schema import AdoptionCreate

router = APIRouter(prefix="/adoptions", tags=["Adoptions"])


@router.post("/")
async def request_adoption(adoption: AdoptionCreate):
    adopter_id = "mock_user_id"
    return await request_adoption_controller(adoption.pet_id, adopter_id)


@router.get("/")
async def get_adoptions():
    return await list_adoptions_controller()


@router.put("/approve/{adoption_id}")
async def approve_adoption(adoption_id: str):
    return await approve_adoption_controller(adoption_id)


@router.put("/reject/{adoption_id}")
async def reject_adoption(adoption_id: str):
    return await reject_adoption_controller(adoption_id)