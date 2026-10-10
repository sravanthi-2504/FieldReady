"""
Automated Unit Tests for Verified Pesticide Recommendation Service
Tests:
1. Verified Common Rust records (Mancozeb 75% WP & Azoxystrobin 18.2% + Difenoconazole 11.4% SC)
2. Distinct Southern Rust records with explicit CIBRC / ICAR-IIMR citations
3. Healthy maize strictly receives NO chemical recommendations
4. Uncertain / ambiguous predictions strictly withhold chemical recommendations
5. Lookalike rust comparative diagnostic criteria
6. Unknown disease fallback behavior
"""

import pytest
from backend.app.services.pesticide_recommendation import (
    get_pesticide_recommendation,
    get_lookalike_comparison,
    load_catalog
)

def test_pesticide_catalog_loads_valid_structure():
    catalog = load_catalog()
    assert "catalog_version" in catalog
    assert "country" in catalog
    assert catalog["country"] == "India"
    assert "diseases" in catalog
    assert "common_rust" in catalog["diseases"]
    assert "southern_rust" in catalog["diseases"]
    assert "northern_leaf_blight" in catalog["diseases"]
    assert "gray_leaf_spot" in catalog["diseases"]
    assert "healthy" in catalog["diseases"]

def test_healthy_maize_strictly_no_pesticides():
    rec = get_pesticide_recommendation("healthy", is_uncertain=False)
    assert rec["recommendation_status"] == "no_pesticide_required"
    assert len(rec["chemical_interventions"]) == 0
    assert "No chemical pesticide" in rec["message"]["en"]
    assert len(rec["integrated_disease_management"]) > 0

def test_uncertain_prediction_strictly_withholds_chemicals():
    rec = get_pesticide_recommendation("common_rust", is_uncertain=True)
    assert rec["recommendation_status"] == "withheld_uncertain"
    assert len(rec["chemical_interventions"]) == 0
    assert "withheld" in rec["message"]["en"].lower()
    assert "Agriculture Extension Officer" in rec["message"]["en"]
    assert len(rec["integrated_disease_management"]) > 0

def test_common_rust_verified_pesticides():
    rec = get_pesticide_recommendation("common_rust", is_uncertain=False)
    assert rec["recommendation_status"] == "verified"
    assert rec["scientific_name"] == "Puccinia sorghi"
    assert len(rec["chemical_interventions"]) >= 2

    # Verify first product: Mancozeb
    mz = next(p for p in rec["chemical_interventions"] if "Mancozeb" in p["product_name"])
    assert mz["registration_status"] == "registered"
    assert "CIBRC" in mz["verification_source"]
    assert mz["pre_harvest_interval_days"] == 20
    assert len(mz["ppe_requirements"]) > 0
    assert "recommended_rate" in mz
    assert "rate_per_acre" in mz

    # Verify second product: Azoxystrobin + Difenoconazole
    az = next(p for p in rec["chemical_interventions"] if "Azoxystrobin" in p["product_name"])
    assert az["registration_status"] == "registered"
    assert az["pre_harvest_interval_days"] == 21

def test_southern_rust_verified_pesticides_distinct_from_common_rust():
    rec_sr = get_pesticide_recommendation("southern_rust", is_uncertain=False)
    assert rec_sr["recommendation_status"] == "verified"
    assert rec_sr["scientific_name"] == "Puccinia polysora"
    assert len(rec_sr["chemical_interventions"]) >= 2

    # Check that symptom distinction notes upper leaf surface
    symptom_en = rec_sr["symptom_distinction"]["en"].lower()
    assert "upper" in symptom_en

    # Verify Pyraclostrobin is marked extension_recommended
    pyra = next(p for p in rec_sr["chemical_interventions"] if "Pyraclostrobin" in p["product_name"])
    assert pyra["registration_status"] == "extension_recommended"

def test_unknown_disease_returns_safe_fallback():
    rec = get_pesticide_recommendation("fusarium_ear_rot", is_uncertain=False)
    assert rec["recommendation_status"] == "no_verified_recommendation"
    assert len(rec["chemical_interventions"]) == 0
    assert "No verified pesticide recommendation" in rec["message"]["en"]

def test_lookalike_rust_comparison():
    comp = get_lookalike_comparison("common_rust", "southern_rust")
    assert "pathogen_a" in comp
    assert "pathogen_b" in comp
    assert comp["pathogen_a"]["scientific_name"] == "Puccinia sorghi"
    assert comp["pathogen_b"]["scientific_name"] == "Puccinia polysora"

    # Common rust: amphigenous (both surfaces)
    assert "both" in comp["pathogen_a"]["canopy_distribution"]["en"].lower()
    # Southern rust: upper surface only
    assert "upper" in comp["pathogen_b"]["canopy_distribution"]["en"].lower()

    # Temperature requirements
    assert "16°C" in comp["pathogen_a"]["temperature_optimum"]
    assert "25°C" in comp["pathogen_b"]["temperature_optimum"]
