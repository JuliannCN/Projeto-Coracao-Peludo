from pymongo import MongoClient

# String de conexão
MONGO_URI = "mongodb+srv://julianncosta2203_db_user:julianncosta2203_db_user@projetocoracaopeludo.psfemrx.mongodb.net/coracoes_peludos?retryWrites=true&w=majority"

# Criando conexão
client = MongoClient(MONGO_URI)

# Selecionando banco
db = client["coracoes_peludos"]

# Exemplo de coleção
users_collection = db["users"]
pets_collection = db["pets"]

print(client.list_database_names())