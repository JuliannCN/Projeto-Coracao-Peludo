from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Conexão com MongoDB Atlas
client = AsyncIOMotorClient(settings.MONGO_URL)

db = client[settings.DATABASE_NAME]

user_collection = db["users"]
pet_collection = db["pets"]
adoption_collection = db["adoptions"]
forum_collection = db["forum_posts"]
chat_collection = db["chat_messages"]