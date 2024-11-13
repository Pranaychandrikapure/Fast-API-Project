from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from typing import Optional

# Password hashing and verification utility
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Function to hash a password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Function to verify a hashed password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Pydantic models

# UserCreate model for registration (request)
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    other_info: str

    class Config:
        orm_mode = True

# UserOut model for user details (response)
class UserOut(BaseModel):
    username: str
    email: EmailStr
    other_info: str

    class Config:
        orm_mode = True

# User model used in the database (internal model)
class UserInDB(UserOut):
    password: str

    class Config:
        orm_mode = True

# Token model for JWT response
class Token(BaseModel):
    access_token: str
    token_type: str

# Define Pydantic model for user update request
class UserUpdate(BaseModel):
    email: str
    other_info: Optional[str] = None  # other_info is optional

# UserLogin model (optional: if you want to use this for login requests)
class UserLogin(BaseModel):
    username: str
    password: str

    class Config:
        orm_mode = True

class NoteCreate(BaseModel):
    title: str
    content: str

class NoteOut(BaseModel):
    id: str
    title: str
    content: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
