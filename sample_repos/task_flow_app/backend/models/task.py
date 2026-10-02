from pydantic import BaseModel
from typing import Optional

class TaskCreate(BaseModel):
    title: str
    userId: int

class TaskResponse(BaseModel):
    id: int
    title: str
    completed: bool
    userId: int
