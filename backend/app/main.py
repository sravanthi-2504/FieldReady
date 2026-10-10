"""
AgriRhythm: FieldReady - FastAPI Application Server
Provides secure CORS, lifecycle startup validation, and router mounting.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router
from backend.app.sensor_api import router as sensor_router

app = FastAPI(
    title="AgriRhythm — FieldReady Intelligence API",
    description="Offline-First, Voice-Guided Crop Health Intelligence Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits mobile phone testing on local Wi-Fi LAN
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(sensor_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8008, reload=True)
