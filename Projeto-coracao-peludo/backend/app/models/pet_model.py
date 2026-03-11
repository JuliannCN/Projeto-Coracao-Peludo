from bson import ObjectId


def pet_entity(pet) -> dict:
    return {
        "id": str(pet["_id"]),
        "name": pet.get("name"),
        "species": pet.get("species"),
        "breed": pet.get("breed"),
        "age": pet.get("age"),
        "description": pet.get("description"),
        "owner_id": pet.get("owner_id"),
        "adopted": pet.get("adopted", False)
    }


def pets_entity(pets) -> list:
    return [pet_entity(pet) for pet in pets]