from fastapi import APIRouter
from typing import List
from models.task import TaskCreate, TaskResponse

tasks_router = APIRouter(tags=["Tasks"])

_DB_TASKS = [
    {"id": 1, "title": "Setup development environment", "completed": True, "userId": 1},
    {"id": 2, "title": "Design architecture graph", "completed": False, "userId": 1},
]

@tasks_router.get("", response_model=List[TaskResponse])
def get_tasks():
    """Retrieve all user tasks."""
    return _DB_TASKS

@tasks_router.post("", response_model=TaskResponse)
def create_task(task: TaskCreate):
    """Create a new task."""
    new_item = {"id": len(_DB_TASKS) + 1, "title": task.title, "completed": False, "userId": task.userId}
    _DB_TASKS.append(new_item)
    return new_item

@tasks_router.patch("/{task_id}/complete")
def complete_task(task_id: int):
    """Mark a task as completed."""
    for t in _DB_TASKS:
        if t["id"] == task_id:
            t["completed"] = True
            return t
    return {"error": "Not found"}
