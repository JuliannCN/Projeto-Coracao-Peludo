import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)

db = client["coracoes_peludos"]

users_collection = db["users"]
pets_collection = db["pets"]
ongs_collection = db["ongs"]
adocoes_collection = db["adocoes"]
posts_collection = db["posts"]
comentarios_collection = db["comentarios"]