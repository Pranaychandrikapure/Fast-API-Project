from fastapi import FastAPI, HTTPException, Depends, status, Form
from pydantic import BaseModel
from models import UserCreate, UserOut, hash_password, verify_password, UserUpdate,NoteCreate,NoteOut,NoteUpdate
from database import users_collection
from auth import create_access_token
from fastapi.security import OAuth2PasswordBearer
from pymongo import MongoClient
import jwt  # Import JWT for token handling
from datetime import datetime, timedelta
from typing import Optional,List
from starlette.middleware.cors import CORSMiddleware 
from bson import ObjectId
import os

# FastAPI App
app = FastAPI()

# Add CORS middleware to allow requests from specific origins
# Define allowed origins (add your frontend URL here)
origins = [
    "http://localhost:3000",
]

# Add CORS middleware to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# MongoDB setup for blacklisting tokens
client = MongoClient(os.getenv("MONGODB_URL"))
db = client["assignment"]
blacklisted_tokens_collection = db["blacklisted_tokens"]
notes_collection = db["notes"]

# Define secret keys and algorithms
SECRET_KEY = os.getenv("SECRET_KEY", "JWT_SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30



# Token generation and verification
# Token generation and verification functions
def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=15)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload  # Return decoded payload if token is valid
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid")


# Register Endpoint
@app.post("/register", response_model=dict)
async def register_user(user: UserCreate):
    # Check if username or email already exists
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = hash_password(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "other_info": user.other_info
    }
    users_collection.insert_one(user_data)

    # Generate access token
    access_token = create_access_token(
        data={"sub": user.email}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "username": user.username,
        "email": user.email,
        "other_info": user.other_info,
        "access_token": access_token,
        "token_type": "bearer"
    }

# Update the /login endpoint to receive form data
class LoginData(BaseModel):
    username: str
    password: str

@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    db_user = users_collection.find_one({"username": username})
    if not db_user or not verify_password(password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": db_user.get("email")
    }

# Check if a token is blacklisted
def is_token_blacklisted(token: str) -> bool:
    return blacklisted_tokens_collection.find_one({"token": token}) is not None

# Dependency to get the current user and validate the token
def get_current_user(token: str = Depends(oauth2_scheme)):
    if is_token_blacklisted(token):
        raise HTTPException(status_code=401, detail="Token has been logged out")
    
    payload = verify_token(token)
    username = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    db_user = users_collection.find_one({"username": username})
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return db_user

# Secure CRUD Endpoints

# Read User (Get Profile)
@app.get("/users/me", response_model=UserOut)
async def get_user(current_user: dict = Depends(get_current_user)):
    return UserOut(username=current_user["username"], email=current_user["email"])

# Update User Profile
@app.put("/users/update")
async def update_user_profile(
    user_update: UserUpdate, 
    current_user: dict = Depends(get_current_user)
):
    # Ensure the current user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Update the user's profile in the database
    updated_user = update_user_in_db(
        username=current_user["username"], 
        email=user_update.email, 
        other_info=user_update.other_info
    )
    
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update user profile")

    return {"message": "Profile updated successfully", "user": updated_user}

# Function to update user profile in the database
def update_user_in_db(username: str, email: str, other_info: Optional[str]) -> dict:
    result = users_collection.update_one(
        {"username": username}, 
        {"$set": {"email": email, "other_info": other_info}}
    )
    if result.modified_count == 0:
        return None
    return {"username": username, "email": email, "other_info": other_info}


@app.get("/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "username": current_user["username"],
        "email": current_user["email"],
        "other_info": current_user.get("other_info", "Additional user info here")
    }

# Logout Endpoint
@app.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    if is_token_blacklisted(token):
        raise HTTPException(status_code=400, detail="Token is already blacklisted")
    
    blacklisted_tokens_collection.insert_one({"token": token})
    return {"message": "Successfully logged out"}

#====================================================================================================

@app.post("/notes", response_model=NoteOut)
async def create_note(note: NoteCreate, token: str = Depends(oauth2_scheme), current_user: dict = Depends(get_current_user)):
    try:
        # Store the user ID instead of the access token
        note_dict = note.dict()
        note_dict["user_id"] = current_user["_id"]  # Link the note to the user's ID

        result = notes_collection.insert_one(note_dict)
        if result.inserted_id:
            return {"id": str(result.inserted_id), **note_dict}
        raise HTTPException(status_code=500, detail="Failed to create note")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# When retrieving notes, you filter by user_id
@app.get("/notes", response_model=List[NoteOut])
async def get_notes(current_user: dict = Depends(get_current_user)):
    cursor = notes_collection.find({"user_id": current_user["_id"]}, {"_id": 1, "title": 1, "content": 1})
    notes = cursor.to_list(length=100)
    return [{"id": str(note["_id"]), "title": note["title"], "content": note["content"]} for note in notes]


# Update Note
@app.put("/notes/{note_id}", response_model=NoteOut)
async def update_note(note_id: str, note_update: NoteUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in note_update.dict().items() if v is not None}
    result = notes_collection.update_one(
        {"_id": ObjectId(note_id), "user_id": current_user["_id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    updated_note = notes_collection.find_one({"_id": ObjectId(note_id)})
    return {"id": str(updated_note["_id"]), "title": updated_note["title"], "content": updated_note["content"]}

# Delete Note
@app.delete("/notes/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    result = notes_collection.delete_one({"_id": ObjectId(note_id), "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted successfully"}