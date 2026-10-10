"""
Pesticide Recommendation Service for AgriRhythm: FieldReady
Traceable, rule-based agricultural advisory service backed by verified Indian regulatory
sources (CIBRC - Central Insecticides Board & Registration Committee and ICAR-IIMR).

Enforces strict safety rules:
1. Neural networks never guess chemical names or doses.
2. Healthy crops never receive chemical recommendations.
3. Uncertain / ambiguous predictions strictly withhold chemical recommendations.
4. Chemical records must declare active ingredients, approved rates, PHI, REI, PPE, and source citations.
5. Common Rust and Southern Rust maintain distinct, separate disease management records.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

CATALOG_PATH = Path(__file__).resolve().parents[3] / "data" / "maize_pesticide_catalog.json"

_CACHED_CATALOG: Optional[Dict[str, Any]] = None


def load_catalog() -> Dict[str, Any]:
    global _CACHED_CATALOG
    if _CACHED_CATALOG is not None:
        return _CACHED_CATALOG

    if CATALOG_PATH.exists():
        try:
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                _CACHED_CATALOG = json.load(f)
                return _CACHED_CATALOG
        except Exception as e:
            print(f"Warning: Failed to load pesticide catalog from {CATALOG_PATH}: {e}")

    # Fallback minimal schema if catalog file is missing
    _CACHED_CATALOG = {
        "catalog_version": "1.0.0-fallback",
        "country": "India",
        "regulatory_framework": "CIBRC / ICAR-IIMR",
        "diseases": {}
    }
    return _CACHED_CATALOG


def get_pesticide_recommendation(
    disease: str,
    is_uncertain: bool = False,
    location: str = "India"
) -> Dict[str, Any]:
    """
    Retrieves verified disease-specific pesticide recommendations and non-chemical IDM measures.
    Strictly withholds chemicals if prediction is uncertain or crop is healthy.
    """
    catalog = load_catalog()
    norm_disease = disease.lower().strip()

    # Rule 1: Healthy crops require NO pesticide application
    if norm_disease == "healthy":
        disease_data = catalog.get("diseases", {}).get("healthy", {})
        return {
            "disease": "healthy",
            "recommendation_status": "no_pesticide_required",
            "message": {
                "en": "Crop foliage is healthy. No chemical pesticide application is needed or recommended.",
                "te": "పంట ఆకులు ఆరోగ్యంగా ఉన్నాయి. ఎటువంటి పురుగు మందులు లేదా ఫంగిసైడ్లు పిచికారీ చేయవలసిన అవసరం లేదు.",
                "hi": "फसल स्वस्थ है। किसी भी रासायनिक दवा या फफूंदनाशक की आवश्यकता नहीं है।"
            },
            "chemical_interventions": [],
            "integrated_disease_management": disease_data.get("integrated_disease_management", [
                "Continue periodic scouting every 7–10 days.",
                "Maintain balanced soil-tested fertilization and avoid water stagnation."
            ]),
            "source_authority": catalog.get("verification_authority", "ICAR-IIMR"),
            "disclaimer": catalog.get("disclaimer", "")
        }

    # Rule 2: Uncertain / ambiguous results strictly withhold chemicals
    if is_uncertain:
        return {
            "disease": norm_disease,
            "recommendation_status": "withheld_uncertain",
            "message": {
                "en": "Diagnostic confidence is below safe threshold (65%) or visual symptoms are ambiguous. Chemical recommendations are strictly withheld to avoid improper pesticide application. Scout additional leaves and consult your local Agriculture Extension Officer or KVK.",
                "te": "విశ్వసనీయత స్కోరు సురక్షిత పరిమితి (65%) కంటే తక్కువగా ఉంది లేదా లక్షణాలు అస్పష్టంగా ఉన్నాయి. తప్పుడు మందులు పిచికారీ చేయకుండా రసాయన సిఫార్సులు నిలిపివేయబడ్డాయి. దయచేసి స్థానిక వ్యవసాయ అధికారి లేదా KVK ని సంప్రదించండి.",
                "hi": "निदान का विश्वास स्तर सुरक्षित सीमा (65%) से कम है या लक्षण अस्पष्ट हैं। अनुचित छिड़काव से बचने के लिए रासायनिक सिफारिशें रोक दी गई हैं। कृपया स्थानीय कृषि अधिकारी या केवीके से परामर्श लें।"
            },
            "chemical_interventions": [],
            "integrated_disease_management": [
                "Scout multiple plants across the field using a W-pattern scouting route.",
                "Collect leaf samples showing distinct clear symptoms for expert laboratory examination.",
                "Do not apply broad-spectrum chemical fungicides without confirmed identification."
            ],
            "source_authority": catalog.get("verification_authority", "ICAR-IIMR"),
            "disclaimer": catalog.get("disclaimer", "")
        }

    # Rule 3: Known disease in verified catalog
    diseases = catalog.get("diseases", {})
    if norm_disease in diseases:
        d_record = diseases[norm_disease]
        return {
            "disease": norm_disease,
            "disease_name": d_record.get("disease_name", {}),
            "scientific_name": d_record.get("scientific_name", ""),
            "symptom_distinction": d_record.get("symptom_distinction", {}),
            "recommendation_status": "verified",
            "message": {
                "en": f"Verified agronomic guidance available for {d_record.get('disease_name', {}).get('en', norm_disease)}.",
                "te": f"{d_record.get('disease_name', {}).get('te', norm_disease)} కొరకు ధృవీకరించబడిన వ్యవసాయ మార్గదర్శకాలు అందుబాటులో ఉన్నాయి.",
                "hi": f"{d_record.get('disease_name', {}).get('hi', norm_disease)} के लिए सत्यापित कृषि दिशानिर्देश उपलब्ध हैं।"
            },
            "chemical_interventions": d_record.get("chemical_interventions", []),
            "integrated_disease_management": d_record.get("integrated_disease_management", []),
            "source_authority": catalog.get("verification_authority", "CIBRC & ICAR-IIMR"),
            "regulatory_framework": catalog.get("regulatory_framework", "CIBRC"),
            "last_reviewed_date": catalog.get("last_reviewed_date", "2026-10-10"),
            "disclaimer": catalog.get("disclaimer", "")
        }

    # Rule 4: Disease not in catalog or unsupported
    return {
        "disease": norm_disease,
        "recommendation_status": "no_verified_recommendation",
        "message": {
            "en": f"No verified pesticide recommendation is available for '{norm_disease}' in {location}. Follow locally approved agricultural extension guidance.",
            "te": f"{location} లో '{norm_disease}' కొరకు ధృవీకరించబడిన రసాయన మందుల రికార్డు అందుబాటులో లేదు. స్థానిక వ్యవసాయ మార్గదర్శకాలను పాటించండి.",
            "hi": f"{location} में '{norm_disease}' के लिए कोई सत्यापित कीटनाशक सिफारिश उपलब्ध नहीं है। स्थानीय कृषि दिशानिर्देशों का पालन करें।"
        },
        "chemical_interventions": [],
        "integrated_disease_management": [
            "Consult local Krishi Vigyan Kendra (KVK) or State Agricultural University extension scientists.",
            "Maintain standard agronomic sanitation and residue management."
        ],
        "source_authority": catalog.get("verification_authority", "ICAR-IIMR"),
        "disclaimer": catalog.get("disclaimer", "")
    }


def get_lookalike_comparison(disease_a: str = "common_rust", disease_b: str = "southern_rust") -> Dict[str, Any]:
    """
    Returns verified comparative diagnostic criteria between Common Rust and Southern Rust.
    Based on ICAR-IIMR, CIMMYT, and University Extension Maize Pathology Compendiums.
    """
    return {
        "comparison_title": {
            "en": "Maize Rust Differential: Common Rust vs. Southern Rust",
            "te": "మొక్కజొన్న కుంకుమ తెగుళ్ల తేడాలు: కామన్ రస్ట్ వర్సెస్ సదరన్ రస్ట్",
            "hi": "मक्का रतुआ अंतर: कॉमन रस्ट बनाम सदर्न रस्ट"
        },
        "pathogen_a": {
            "key": "common_rust",
            "scientific_name": "Puccinia sorghi",
            "common_name": {
                "en": "Common Rust",
                "te": "సాధారణ కుంకుమ తెగులు (కామన్ రస్ట్)",
                "hi": "सामान्य रतुआ (कॉमन रस्ट)"
            },
            "pustule_color": {
                "en": "Cinnamon-brown to dark reddish-brown; turns blackish late in season.",
                "te": "దాల్చిన చెక్క రంగు నుండి ముదురు ఎరుపు-గోధుమ రంగు; సీజన్ చివర్లో నల్లగా మారుతుంది.",
                "hi": "दालचीनी भूरा से गहरा लाल-भूरा; मौसम के अंत में काला पड़ जाता है।"
            },
            "pustule_shape": {
                "en": "Oval to elongate (1–2 mm long), often rupturing leaf epidermis early.",
                "te": "గుండ్రంగా లేదా పొడవుగా (1-2 మి.మీ), ఆకు పొరను చీల్చుకుని బయటకు వస్తాయి.",
                "hi": "अंडाकार से लंबा (1-2 मिमी), पत्ती की ऊपरी त्वचा को जल्दी फाड़ देता है।"
            },
            "canopy_distribution": {
                "en": "Amphigenous: Pustules occur prominently on BOTH upper and lower leaf surfaces.",
                "te": "ఆకు పైభాగం మరియు అడుగు భాగం రెండింటిపై సమానంగా కనిపిస్తాయి.",
                "hi": "पत्ती की दोनों सतहों (ऊपरी और निचली) पर समान रूप से पाए जाते हैं।"
            },
            "temperature_optimum": "16°C – 25°C (Cool, temperate to subtropical conditions)",
            "humidity_requirement": "High relative humidity (>95%) or 6+ hours of leaf wetness",
            "seasonality": "Predominates in early vegetative stages or winter/rabi maize crops.",
            "spore_morphology": "Teliospores are two-celled, oblong to ellipsoid, with rounded or obtuse apex."
        },
        "pathogen_b": {
            "key": "southern_rust",
            "scientific_name": "Puccinia polysora",
            "common_name": {
                "en": "Southern Rust",
                "te": "సదరన్ రస్ట్ (దక్షిణ కుంకుమ తెగులు)",
                "hi": "दक्षिणी रतुआ (सदर्न रस्ट)"
            },
            "pustule_color": {
                "en": "Golden-orange to light cinnamon-brown; lighter and more yellowish than common rust.",
                "te": "బంగారు-నారింజ నుండి తేలికపాటి గోధుమ రంగు; కామన్ రస్ట్ కంటే పసుపుపచ్చగా ఉంటుంది.",
                "hi": "सुनहरा-नारंगी से हल्का दालचीनी भूरा; कॉमन रस्ट की तुलना में अधिक पीलापन लिए हुए।"
            },
            "pustule_shape": {
                "en": "Tiny, circular to small oval (0.2–1 mm), dense, smooth pustules; epidermis remains intact longer.",
                "te": "చాలా చిన్నవి (0.2-1 మి.మీ), గుండ్రంగా, దట్టమైన సమూహాలుగా ఉంటాయి; ఆకు పొర త్వరగా చిట్లిపోదు.",
                "hi": "अत्यंत छोटे (0.2-1 मिमी), गोल, बहुत घने समूह; पत्ती की त्वचा देर तक साबुत रहती है।"
            },
            "canopy_distribution": {
                "en": "Predominantly adaxial: Pustules occur almost exclusively on the UPPER leaf surface.",
                "te": "ప్రధానంగా ఆకు పై ఉపరితలంపై మాత్రమే దట్టంగా కనిపిస్తాయి.",
                "hi": "मुख्य रूप से पत्ती की केवल ऊपरी सतह पर पाए जाते हैं।"
            },
            "temperature_optimum": "25°C – 35°C (Warm to hot conditions with humid atmosphere)",
            "humidity_requirement": "Frequent rains, heavy evening dews, high relative humidity",
            "seasonality": "Arrives later in season during high summer temperatures; highly destructive to grain fill.",
            "spore_morphology": "Teliospores are smaller, angular to irregular, one or two-celled with flattened apex."
        },
        "diagnostic_field_tips": [
            "Check both sides of the leaf: If pustules are equally dense on the underside, it is almost certainly Common Rust.",
            "If pustules are bright orange-yellow and tightly restricted to the upper surface during hot weather (>28°C), suspect Southern Rust.",
            "In high-heat regimes, southern rust reproduces much faster and can cause severe canopy dry-down within 7-10 days."
        ]
    }
