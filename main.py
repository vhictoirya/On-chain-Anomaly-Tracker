from backend.app import app
import os

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))  # Use Railway's PORT env var
    print("\n🚀 Starting ChainWatch Anomaly Detection API...")
    print(f"📡 Server will be available at: http://0.0.0.0:{port}")
    print(f"📚 API Documentation: http://0.0.0.0:{port}/docs")
    print(f"📖 ReDoc Documentation: http://0.0.0.0:{port}/redoc\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False
    )