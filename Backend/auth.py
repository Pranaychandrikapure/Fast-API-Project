import os
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException
from passlib.context import CryptContext

# Secret key for JWT encoding and decoding
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Token expiry time (in minutes)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Function to create access token
def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Function to verify JWT token
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=403, detail="Could not validate credentials")

# Helper function to decode the token and check if it's blacklisted
def is_token_blacklisted(token: str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    exp = payload.get("exp")
    if datetime.utcnow().timestamp() > exp:
        raise HTTPException(status_code=401, detail="Token expired")
    
    # Check if token is in the blacklist
    if blacklisted_tokens_collection.find_one({"token": token}):
        raise HTTPException(status_code=401, detail="Token is blacklisted")

    return payload
