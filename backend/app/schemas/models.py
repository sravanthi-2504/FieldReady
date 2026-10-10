from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class QualityCheckResponse(BaseModel):
    passed: bool
    status: str
    blur_score: float
    is_blurry: bool
    brightness_score: float
    lighting_status: str
    dimensions: List[int]
    aspect_ratio: float
    recommendation_code: str
    farmer_feedback: Dict[str, str]

class PredictionClassProbability(BaseModel):
    label: str
    name: str
    probability: float
    percentage: float

class HealthPredictionResponse(BaseModel):
    crop: str
    predicted_class: str
    display_name: Dict[str, str]
    confidence: float
    is_uncertain: bool
    uncertainty_reason: Optional[Dict[str, str]] = None
    all_probabilities: List[PredictionClassProbability]
    model_version: str
    source_mode: str  # "model_inference" or "demonstration"
    latency_ms: float
    differential_possibilities: List[Dict[str, Any]]
    management_guidance: Dict[str, Any]
    note: Optional[str] = None
    lesion_pct: Optional[float] = None
    severity_stage: Optional[str] = None
    stage_info: Optional[Dict[str, Any]] = None
    predicted_class_raw: Optional[str] = None
    sensor_fusion: Optional[Dict[str, Any]] = None
    sensor_info: Optional[Dict[str, Any]] = None
    advisory: Optional[Dict[str, Any]] = None
    highlight: Optional[Dict[str, Any]] = None

class WeatherResponse(BaseModel):
    temperature_c: float
    relative_humidity_pct: float
    precipitation_mm: float
    wind_speed_kmh: float
    weather_condition: str
    provenance: str
    retrieval_time: str
    is_live_api: bool
    location_name: str
    disclaimer: str

class SensorReading(BaseModel):
    sensor_id: str
    parameter: str
    value: float
    unit: str
    timestamp: str
    field_id: Optional[str] = None
    is_simulated: bool
    provenance_tag: str
    disclaimer: str

class SyncFieldRecord(BaseModel):
    id: str
    name: str
    crop: str
    planting_date: Optional[str] = None
    acreage: Optional[float] = None
    location: Optional[Dict[str, float]] = None
    created_at: str
    notes: Optional[str] = None

class SyncInspectionRecord(BaseModel):
    id: str
    field_id: str
    crop: str
    visited_at: str
    sample_count: int
    symptomatic_count: int
    uncertain_count: int
    predicted_condition: Optional[str] = None
    confidence: Optional[float] = None
    provenance: str
    notes: Optional[str] = None
    image_count: int = 1

class SyncPayload(BaseModel):
    client_id: str
    synced_at: str
    fields: List[SyncFieldRecord]
    inspections: List[SyncInspectionRecord]

class SyncResponse(BaseModel):
    status: str
    synced_fields_count: int
    synced_inspections_count: int
    server_timestamp: str
