from fastapi import FastAPI
from routes.auth import auth_router
from routes.tasks import tasks_router

app = FastAPI(title="TaskFlow Backend API")

app.include_router(auth_router, prefix="/api/auth")
app.include_router(tasks_router, prefix="/api/tasks")

@app.get("/")
def root():
    return {"message": "TaskFlow API Online"}
