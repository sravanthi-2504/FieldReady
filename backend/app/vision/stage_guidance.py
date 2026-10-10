"""
Stage-aware guidance + post-processing for banana predictions.

Usage in banana_predictor.py, right before `return {...}` in predict():

    from app.vision.stage_guidance import enrich_with_stage
    result = {... existing dict ...}
    return enrich_with_stage(result, image_bytes)

No chemical doses are given. Fungicide choice and dose should come from the
local agriculture officer / KVK label advice.
"""
from typing import Any, Dict

try:
    from backend.app.vision.lesion_stage import analyze_lesions
except ImportError:
    try:
        from app.vision.lesion_stage import analyze_lesions
    except ImportError:
        from lesion_stage import analyze_lesions

# Classes the retrained 4-class model will know. Merge into BANANA_CLASS_DISPLAY_NAMES.
EXTRA_DISPLAY_NAMES = {
    "cordana": {
        "en": "Cordana Leaf Spot (Cordana musae)",
        "te": "కార్డానా ఆకు మచ్చ తెగులు",
        "hi": "कॉर्डाना पत्ती धब्बा रोग",
    },
    "pestalotiopsis": {
        "en": "Pestalotiopsis Leaf Spot (Pestalotiopsis sp.)",
        "te": "పెస్టలోటియోప్సిస్ ఆకు మచ్చ తెగులు",
        "hi": "पेस्टालोटियोप्सिस पत्ती धब्बा रोग",
    },
}

FUNGAL_SPOT = {"black_sigatoka", "cordana", "pestalotiopsis"}

STAGE_LABEL = {
    "trace":    {"en": "Trace / very early", "te": "అతి తొలి దశ", "hi": "बहुत शुरुआती अवस्था"},
    "early":    {"en": "Early stage", "te": "ప్రారంభ దశ", "hi": "शुरुआती अवस्था"},
    "moderate": {"en": "Moderate stage", "te": "మధ్యస్థ దశ", "hi": "मध्यम अवस्था"},
    "severe":   {"en": "Severe stage", "te": "తీవ్ర దశ", "hi": "गंभीर अवस्था"},
    "unknown":  {"en": "Stage could not be measured", "te": "దశను కొలవలేకపోయాం", "hi": "अवस्था नहीं मापी जा सकी"},
}

# What to do depends on how far the damage has gone
STAGE_ACTIONS = {
    "trace": {
        "en": ["Only a few marks are visible. Do not spray yet.",
               "Mark this plant and check the next 2-3 leaves down.",
               "Keep the field drained and weeds down."],
        "te": ["కొన్ని మచ్చలు మాత్రమే ఉన్నాయి. ఇప్పుడే మందు పిచికారీ చేయవద్దు.",
               "ఈ మొక్కను గుర్తించి కింది 2-3 ఆకులను పరిశీలించండి.",
               "నీరు నిలవకుండా చూసి కలుపు తీయండి."],
        "hi": ["अभी कुछ ही निशान हैं। अभी छिड़काव न करें।",
               "इस पौधे को चिह्नित करें और नीचे की 2-3 पत्तियाँ जाँचें।",
               "जल निकासी ठीक रखें और खरपतवार हटाएँ।"],
        "reinspect_days": 7,
    },
    "early": {
        "en": ["Cut off only the spotted leaf tips or segments and remove them from the plot.",
               "Place cut leaves face down on the ground, away from healthy plants.",
               "Scout 10 neighbouring plants to see how far it has spread."],
        "te": ["మచ్చలు ఉన్న ఆకు కొనలు లేదా భాగాలను మాత్రమే కత్తిరించి తోట బయట వేయండి.",
               "కత్తిరించిన ఆకులను ఆరోగ్యకరమైన మొక్కలకు దూరంగా బోర్లించి వేయండి.",
               "పక్కన ఉన్న 10 మొక్కలను పరిశీలించి వ్యాప్తిని తెలుసుకోండి."],
        "hi": ["केवल धब्बेदार सिरे या हिस्से काटकर खेत से बाहर करें।",
               "कटी पत्तियाँ स्वस्थ पौधों से दूर उल्टी रखें।",
               "आसपास के 10 पौधे देखकर फैलाव जाँचें।"],
        "reinspect_days": 5,
    },
    "moderate": {
        "en": ["Remove all leaves with large spots; keep the youngest leaves.",
               "Improve airflow: clear suckers and weeds, fix drainage.",
               "Contact your local agriculture officer or KVK about a suitable spray for this disease.",
               "Check the whole plot, not just this plant."],
        "te": ["పెద్ద మచ్చలు ఉన్న ఆకులన్నింటినీ తొలగించి, లేత ఆకులను ఉంచండి.",
               "గాలి ప్రసరణ కోసం పిలకలు, కలుపు తొలగించి, మురుగు నీటి కాలువలు సరిచేయండి.",
               "ఈ తెగులుకు తగిన మందు కోసం స్థానిక వ్యవసాయ అధికారి లేదా KVK ను సంప్రదించండి.",
               "ఈ మొక్కే కాకుండా మొత్తం తోటను పరిశీలించండి."],
        "hi": ["बड़े धब्बों वाली सभी पत्तियाँ हटाएँ, सबसे नई पत्तियाँ रखें।",
               "हवा के लिए सकर्स और खरपतवार हटाएँ, जल निकासी सुधारें।",
               "इस रोग के लिए उपयुक्त दवा हेतु स्थानीय कृषि अधिकारी या KVK से मिलें।",
               "केवल यह पौधा नहीं, पूरा खेत जाँचें।"],
        "reinspect_days": 3,
    },
    "severe": {
        "en": ["Most of the leaf is dead. Remove badly damaged leaves now.",
               "Act today: contact your agriculture officer or KVK. Do not wait for the next inspection.",
               "Protect the bunch: more than half the leaf area lost can reduce fruit size.",
               "Keep tools and boots clean when moving to healthy plants."],
        "te": ["ఆకులో ఎక్కువ భాగం ఎండిపోయింది. బాగా దెబ్బతిన్న ఆకులను వెంటనే తొలగించండి.",
               "ఈరోజే వ్యవసాయ అధికారి లేదా KVK ను సంప్రదించండి. తదుపరి పరిశీలన వరకు ఆగవద్దు.",
               "ఆకు విస్తీర్ణం సగానికి పైగా పోతే గెల పరిమాణం తగ్గే ప్రమాదం ఉంది.",
               "ఆరోగ్యకరమైన మొక్కల వద్దకు వెళ్లేముందు పనిముట్లు, పాదరక్షలు శుభ్రం చేసుకోండి."],
        "hi": ["पत्ती का ज़्यादातर हिस्सा सूख चुका है। बुरी तरह प्रभावित पत्तियाँ अभी हटाएँ।",
               "आज ही कृषि अधिकारी या KVK से संपर्क करें, अगली जाँच का इंतज़ार न करें।",
               "आधे से अधिक पत्ती क्षेत्र खोने पर घौद का आकार घट सकता है।",
               "स्वस्थ पौधों के पास जाने से पहले औज़ार और जूते साफ करें।"],
        "reinspect_days": 2,
    },
}

DISEASE_NOTE = {
    "black_sigatoka": {
        "en": "Black Sigatoka: dark streaks that merge. Spreads fast in warm, humid weather.",
        "te": "బ్లాక్ సిగటోకా: ముదురు గీతలు కలిసిపోతాయి. వేడి, తేమ వాతావరణంలో వేగంగా వ్యాపిస్తుంది.",
        "hi": "ब्लैक सिगाटोका: गहरी धारियाँ जुड़ जाती हैं। गर्म और नम मौसम में तेज़ी से फैलता है।",
    },
    "cordana": {
        "en": "Cordana: large oval spots with yellow edges, often at leaf margins, sometimes with rings.",
        "te": "కార్డానా: పసుపు అంచులతో పెద్ద అండాకార మచ్చలు, తరచూ ఆకు అంచుల వద్ద, కొన్నిసార్లు వలయాలతో.",
        "hi": "कॉर्डाना: पीले किनारों वाले बड़े अंडाकार धब्बे, अक्सर पत्ती के किनारों पर।",
    },
    "pestalotiopsis": {
        "en": "Pestalotiopsis: brown irregular spots, often following injury or weak plants. Fix plant stress too.",
        "te": "పెస్టలోటియోప్సిస్: గోధుమ రంగు అక్రమ మచ్చలు, తరచూ గాయాలు లేదా బలహీన మొక్కలపై. మొక్క ఒత్తిడిని కూడా సరిచేయండి.",
        "hi": "पेस्टालोटियोप्सिस: भूरे अनियमित धब्बे, अक्सर चोट या कमज़ोर पौधों पर।",
    },
}

HEALTHY_BUT_LESIONS = {
    "en": "The model says healthy, but brown or dark patches cover part of this leaf. Retake the photo in daylight or ask an extension officer.",
    "te": "మోడల్ ఆరోగ్యంగా ఉందని చెప్తోంది, కానీ ఆకుపై గోధుమ లేదా ముదురు మచ్చలు కనిపిస్తున్నాయి. పగటి వెలుగులో మళ్లీ ఫోటో తీయండి లేదా వ్యవసాయ అధికారిని అడగండి.",
    "hi": "मॉडल स्वस्थ बता रहा है, लेकिन पत्ती पर भूरे या गहरे धब्बे दिख रहे हैं। दिन की रोशनी में फोटो दोबारा लें या कृषि अधिकारी से पूछें।",
}

# healthy prediction + more lesion than this => do not trust "healthy"
HEALTHY_LESION_LIMIT = 4.0


def enrich_with_stage(result: Dict[str, Any], image_bytes: bytes) -> Dict[str, Any]:
    try:
        st = analyze_lesions(image_bytes)
    except Exception as e:  # never break prediction because of the heuristic
        result["stage_info"] = {"stage": "unknown", "reliable": False, "error": str(e)}
        return result

    result["stage_info"] = {
        **st,
        "stage_label": STAGE_LABEL[st["stage"]],
    }
    result["lesion_pct"] = st.get("lesion_percent")
    result["severity_stage"] = st.get("stage")

    pred = result.get("predicted_class")

    # 1) Do not confidently call a visibly damaged leaf healthy
    if pred == "healthy" and st["reliable"] and st["lesion_percent"] is not None and st["lesion_percent"] >= HEALTHY_LESION_LIMIT:
        result["is_uncertain"] = True
        result["uncertainty_reason"] = HEALTHY_BUT_LESIONS
        result["predicted_class_raw"] = "healthy"
        return result

    # 2) Stage-specific advice for leaf-spot diseases
    if pred in FUNGAL_SPOT and st["reliable"]:
        stage = st["stage"]
        if stage == "trace":
            # almost no damage: suspicious label, say so instead of giving a full treatment plan
            result["is_uncertain"] = True
        block = STAGE_ACTIONS.get(stage, STAGE_ACTIONS["moderate"])
        guidance = dict(result.get("management_guidance") or {})
        guidance["stage"] = stage
        guidance["stage_label"] = STAGE_LABEL[stage]
        guidance["disease_note"] = DISEASE_NOTE.get(pred)
        guidance["immediate_actions"] = {k: block[k] for k in ("en", "te", "hi")}
        guidance["reinspect_days"] = block["reinspect_days"]
        result["management_guidance"] = guidance
    return result
