import os

from django.conf import settings
from pymongo import MongoClient


def get_mongo_client():
    uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/ai_test_db')
    return MongoClient(uri)


def authenticate_user(username: str, password: str) -> bool:
    client = get_mongo_client()
    try:
        db_name = os.environ.get('MONGO_DB_NAME', 'ai_test_db')
        db = client[db_name]
        user = db.users.find_one({
            'username': username,
            'password': password,
        })
        return bool(user)
    finally:
        client.close()
