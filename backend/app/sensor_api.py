"""
Receives readings from the field sensor node and serves the latest one per field.

In main.py:
    from backend.app.sensor_api import router as sensor_router, get_latest
    app.include_router(sensor_router, prefix="/api")

In your /api/predict handler, accept optional `field_id` and `field_confirmed` and pass
    sensor = get_latest(field_id)
into run_decision_pipeline(...).

Set SENSOR_API_KEY in the backend environment and the same value in the sensor node.
Readings live in memory (lost on restart); swap _STORE for SQLite if you need history.
"""
import os
import time
from typing import Dict, Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

try:
    from backend.app.vision.sensor_fusion import SensorReading
except ImportError:
    try:
        from app.vision.sensor_fusion import SensorReading
    except ImportError:
        from vision.sensor_fusion import SensorReading

router = APIRouter()
_STORE: Dict[str, SensorReading] = {}


class SensorIn(BaseModel):
    field_id: str = Field(..., min_length=1, max_length=64)
    temperature_c: Optional[float] = Field(None, ge=-10, le=60)
    humidity_pct: Optional[float] = Field(None, ge=0, le=100)
    leaf_wetness_hours_24h: Optional[float] = Field(None, ge=0, le=24)
    soil_moisture_pct: Optional[float] = Field(None, ge=0, le=100)


def get_latest(field_id: Optional[str] = None) -> Optional[SensorReading]:
    if field_id and field_id in _STORE:
        return _STORE[field_id]
    if not field_id and _STORE:
        # Return most recent reading across all fields
        return max(_STORE.values(), key=lambda r: r.taken_at or 0.0)
    return None


def get_latest_field_id() -> Optional[str]:
    if not _STORE:
        return None
    latest_item = max(_STORE.items(), key=lambda kv: kv[1].taken_at or 0.0)
    return latest_item[0]


@router.post("/sensor")
def post_sensor(body: SensorIn, x_sensor_key: Optional[str] = Header(None)):
    key = os.environ.get("SENSOR_API_KEY")
    if key and x_sensor_key != key:
        raise HTTPException(status_code=401, detail="bad sensor key")
    _STORE[body.field_id] = SensorReading(
        temperature_c=body.temperature_c,
        humidity_pct=body.humidity_pct,
        leaf_wetness_hours_24h=body.leaf_wetness_hours_24h,
        soil_moisture_pct=body.soil_moisture_pct,
        taken_at=time.time(),
        source="sensor",
    )
    return {"ok": True}


@router.get("/sensor")
@router.get("/sensor/latest")
def read_latest_sensor(field_id: Optional[str] = None):
    r = get_latest(field_id)
    if r is None:
        return {
            "status": "offline",
            "message": "No sensor readings available",
            "active_fields": list(_STORE.keys()),
            "reading": None
        }
    return {
        "status": "online" if r.usable() else "stale",
        "field_id": field_id or get_latest_field_id(),
        "temperature_c": r.temperature_c,
        "humidity_pct": r.humidity_pct,
        "leaf_wetness_hours_24h": r.leaf_wetness_hours_24h,
        "soil_moisture_pct": r.soil_moisture_pct,
        "taken_at": r.taken_at,
        "source": r.source,
        "age_hours": round(r.age_hours(), 2) if r.age_hours() is not None else None,
        "usable": r.usable(),
        "active_fields": list(_STORE.keys())
    }


@router.get("/sensor/{field_id}")
def read_sensor(field_id: str):
    r = _STORE.get(field_id)
    if r is None:
        raise HTTPException(status_code=404, detail="no reading for this field")
    return {
        **r.__dict__,
        "age_hours": round(r.age_hours(), 2) if r.age_hours() is not None else None,
        "usable": r.usable()
    }

