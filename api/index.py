from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Origin"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to ChainWatch Anomaly Detection APP",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": {
            "python_version": "3.11"
        }
    }

@app.get("/api/v1/health")
async def api_health_check():
    return {
        "status": "healthy",
        "api_version": "v1",
        "timestamp": datetime.now().isoformat()
    }