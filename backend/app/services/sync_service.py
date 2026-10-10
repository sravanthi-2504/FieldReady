"""
Sync Service for AgriRhythm: FieldReady
Persists queued offline inspection records and field profiles in SQLite.
Ensures duplicate prevention using stable client UUIDs.
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List

DB_PATH = Path("data/fieldready_sync.db")

class SyncService:
    def __init__(self):
        self._init_db()

    def _init_db(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS fields (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    crop TEXT NOT NULL,
                    planting_date TEXT,
                    acreage REAL,
                    location_json TEXT,
                    created_at TEXT NOT NULL,
                    notes TEXT,
                    synced_at TEXT NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS inspections (
                    id TEXT PRIMARY KEY,
                    field_id TEXT NOT NULL,
                    crop TEXT NOT NULL,
                    visited_at TEXT NOT NULL,
                    sample_count INTEGER NOT NULL,
                    symptomatic_count INTEGER NOT NULL,
                    uncertain_count INTEGER NOT NULL,
                    predicted_condition TEXT,
                    confidence REAL,
                    provenance TEXT NOT NULL,
                    notes TEXT,
                    image_count INTEGER DEFAULT 1,
                    synced_at TEXT NOT NULL
                )
            """)
            conn.commit()

    def sync_records(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()
        fields_synced = 0
        inspections_synced = 0

        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()

            for f in payload.get("fields", []):
                loc_json = json.dumps(f.get("location")) if f.get("location") else None
                cursor.execute("""
                    INSERT INTO fields (id, name, crop, planting_date, acreage, location_json, created_at, notes, synced_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name=excluded.name,
                        crop=excluded.crop,
                        planting_date=excluded.planting_date,
                        acreage=excluded.acreage,
                        location_json=excluded.location_json,
                        notes=excluded.notes,
                        synced_at=excluded.synced_at
                """, (
                    f["id"], f["name"], f["crop"], f.get("planting_date"),
                    f.get("acreage"), loc_json, f.get("created_at", now_iso),
                    f.get("notes"), now_iso
                ))
                fields_synced += 1

            for insp in payload.get("inspections", []):
                cursor.execute("""
                    INSERT INTO inspections (
                        id, field_id, crop, visited_at, sample_count, symptomatic_count,
                        uncertain_count, predicted_condition, confidence, provenance, notes, image_count, synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        sample_count=excluded.sample_count,
                        symptomatic_count=excluded.symptomatic_count,
                        uncertain_count=excluded.uncertain_count,
                        predicted_condition=excluded.predicted_condition,
                        confidence=excluded.confidence,
                        provenance=excluded.provenance,
                        notes=excluded.notes,
                        image_count=excluded.image_count,
                        synced_at=excluded.synced_at
                """, (
                    insp["id"], insp["field_id"], insp["crop"], insp["visited_at"],
                    insp["sample_count"], insp["symptomatic_count"], insp["uncertain_count"],
                    insp.get("predicted_condition"), insp.get("confidence"),
                    insp.get("provenance", "client_indexeddb"), insp.get("notes"),
                    insp.get("image_count", 1), now_iso
                ))
                inspections_synced += 1

            conn.commit()

        return {
            "status": "success",
            "synced_fields_count": fields_synced,
            "synced_inspections_count": inspections_synced,
            "server_timestamp": now_iso
        }

    def get_all_synced_data(self) -> Dict[str, Any]:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM fields ORDER BY created_at DESC")
            fields = [dict(row) for row in cursor.fetchall()]
            cursor.execute("SELECT * FROM inspections ORDER BY visited_at DESC")
            inspections = [dict(row) for row in cursor.fetchall()]
        return {"fields": fields, "inspections": inspections}
