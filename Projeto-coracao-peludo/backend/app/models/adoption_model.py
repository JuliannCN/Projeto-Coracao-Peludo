from bson import ObjectId


def adoption_entity(adoption) -> dict:
    return {
        "id": str(adoption["_id"]),
        "pet_id": adoption.get("pet_id"),
        "adopter_id": adoption.get("adopter_id"),
        "status": adoption.get("status")
    }


def adoptions_entity(adoptions) -> list:
    return [adoption_entity(adoption) for adoption in adoptions]