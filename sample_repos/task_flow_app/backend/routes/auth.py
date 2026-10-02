from fastapi import APIRouter, HTTPException, Depends
from models.user import UserLogin, UserRegister, UserResponse

auth_router = APIRouter(tags=["Authentication"])

@auth_router.post("/login")
def login(credentials: UserLogin):
    """Authenticates user and returns JWT token."""
    if credentials.email == "demo@example.com" and credentials.password == "password":
        return {
            "token": "jwt_token_sample_12345",
            "user": {"id": 1, "email": credentials.email, "name": "Demo User"}
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@auth_router.post("/register")
def register(user_data: UserRegister):
    """Registers a new user into database."""
    return {"id": 2, "email": user_data.email, "name": user_data.name}
