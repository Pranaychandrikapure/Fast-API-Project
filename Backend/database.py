import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

MONGODB_URL = os.getenv("MONGODB_URL")
client = MongoClient(MONGODB_URL)
db = client["assignment"]  # Replace with your database name
users_collection = db["users"]


