"""
Model Inference Service for AgriRhythm: FieldReady
Loads PyTorch MobileNetV2 trained artifact, performs standard ImageNet normalization,
computes softmax scores, applies abstention threshold (0.65), and provides differential
alternative possibilities and evidence-based guidance.
"""

import time
import io
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, List, Optional
from pathlib import Path

CLASSES = ["healthy", "common_rust", "northern_leaf_blight", "gray_leaf_spot"]

CLASS_DISPLAY_NAMES = {
    "healthy": {
        "en": "Healthy Maize Leaf",
        "te": "ఆరోగ్యకరమైన మొక్కజొన్న ఆకు",
        "hi": "स्वस्थ मक्के की पत्ती"
    },
    "common_rust": {
        "en": "Common Rust (Puccinia sorghi)",
        "te": "మొక్కజొన్న కుంకుమ తెగులు (కామన్ రస్ట్)",
        "hi": "सामान्य रतुआ (कॉमन रस्ट)"
    },
    "northern_leaf_blight": {
        "en": "Northern Corn Leaf Blight (Exserohilum turcicum)",
        "te": "నార్తర్న్ లీఫ్ బ్లైట్ (ఆకు ఎండు తెగులు)",
        "hi": "उत्तरी पत्ती झुलसा (नार्दर्न लीफ ब्लाइट)"
    },
    "gray_leaf_spot": {
        "en": "Gray Leaf Spot (Cercospora zeae-maydis)",
        "te": "బూడిద రంగు మచ్చ తెగులు (గ్రే లీఫ్ స్పాట్)",
        "hi": "धूसर पत्ती धब्बा (ग्रे लीफ स्पॉट)"
    }
}

DIFFERENTIAL_CAUSES = {
    "common_rust": [
        {
            "condition": "Southern Rust (Puccinia polysora)",
            "similarity": "Produces similar orange/brown pustules, but tends to occur mainly on upper leaf surfaces under high heat.",
            "differentiation": "Check if pustules are on both leaf surfaces (common rust) or only upper surface (southern rust)."
        },
        {
            "condition": "Physoderma Brown Spot",
            "similarity": "Small brownish-yellow spots on leaves and midribs.",
            "differentiation": "Physoderma lesions form banded patterns across leaf blades and dark purplish spots on the midrib."
        },
        {
            "condition": "Pesticide Spray Burn / Fertilizer Scorch",
            "similarity": "Localized speckling or necrosis.",
            "differentiation": "Spray burn does not produce powdery fungal spores when rubbed with a finger."
        }
    ],
    "northern_leaf_blight": [
        {
            "condition": "Stewart's Bacterial Wilt",
            "similarity": "Long linear pale lesions following leaf veins.",
            "differentiation": "Stewart's wilt has irregular, wavy margins, and bacterial ooze tests can distinguish from fungal blight."
        },
        {
            "condition": "Drought / Heat Stress Scorch",
            "similarity": "Longitudinal drying and firing along leaf margins.",
            "differentiation": "Drought scorch starts uniformly from lower leaf tips rather than distinct cigar-shaped lesions."
        },
        {
            "condition": "Diplodia Leaf Streak",
            "similarity": "Elongated tan necrotic lesions.",
            "differentiation": "Diplodia produces smaller lesions with yellow halos, distinct from classic cigar lesions of NCLB."
        }
    ],
    "gray_leaf_spot": [
        {
            "condition": "Nitrogen Deficiency Firing",
            "similarity": "Yellowing and browning along leaf blade.",
            "differentiation": "Nitrogen deficiency exhibits a characteristic V-shaped yellowing starting at leaf tips of oldest leaves."
        },
        {
            "condition": "Anthracnose Leaf Blight",
            "similarity": "Oval to elongated tan spots with darker borders.",
            "differentiation": "Anthracnose lesions contain black fungal fruiting bodies (spines/setae) visible with hand lens."
        },
        {
            "condition": "Herbicide Carryover Injury",
            "similarity": "Interveinal striping and localized tissue necrosis.",
            "differentiation": "Herbicide damage typically shows across whole plant rows corresponding to tractor sprayer passes."
        }
    ],
    "healthy": [
        {
            "condition": "Early Incubation Stage",
            "similarity": "Leaf currently appears clean, but microscopic fungal incubation may occur 7-14 days before visible lesions.",
            "differentiation": "Re-inspect in 5 to 7 days, especially if wet weather or humid conditions prevail."
        }
    ]
}

MANAGEMENT_GUIDANCE_DB = {
    "healthy": {
        "summary": {
            "en": "Leaf appears vigorous and healthy with no visible signs of fungal or bacterial lesions.",
            "te": "ఆకు ఎటువంటి తెగులు లేదా వ్యాధి లక్షణాలు లేకుండా పచ్చగా, ఆరోగ్యంగా ఉంది.",
            "hi": "पत्ती स्वस्थ और हरी-भरी है, इसमें किसी रोग या धब्बे के लक्षण नहीं हैं।"
        },
        "what_it_means": {
            "en": "Plant physiology is intact; maintain current good agricultural practices.",
            "te": "మొక్క ఆరోగ్యంగా ఉంది; ప్రస్తుత మంచి సాగు పద్ధతులను కొనసాగించండి.",
            "hi": "पौधा स्वस्थ है; वर्तमान उत्तम कृषि पद्धतियों को जारी रखें।"
        },
        "immediate_actions": {
            "en": [
                "Continue regular irrigation without waterlogging.",
                "Check other areas of the plot to confirm field-wide health status.",
                "Maintain clean bunds and weed-free field margins."
            ],
            "te": [
                "చేనులో నీరు నిలవకుండా సాధారణ నీటిపారుదలని కొనసాగించండి.",
                "పొలంలోని ఇతర భాగాలలో కూడా మొక్కల ఆరోగ్యాన్ని పరిశీలించండి.",
                "గట్లపై కలుపు లేకుండా పరిశుభ్రంగా ఉంచండి."
            ],
            "hi": [
                "जलभराव से बचते हुए नियमित सिंचाई जारी रखें।",
                "खेत के अन्य हिस्सों में भी पौधों के स्वास्थ्य की जाँच करें।",
                "मेड़ों को खरपतवार मुक्त और साफ रखें।"
            ]
        },
        "preventive_care": {
            "en": [
                "Maintain balanced fertilization based on periodic soil testing.",
                "Scout fields periodically every 7–10 days throughout the vegetative and grain-fill stages.",
                "Monitor weather forecasts for high humidity or prolonged overcast skies."
            ],
            "te": [
                "నేల పరీక్షల ఆధారంగా సమతుల్య ఎరువుల యాజమాన్యాన్ని పాటించండి.",
                "ప్రతి 7-10 రోజులకు ఒకసారి పొలంలో పలుచోట్ల తిరుగుతూ పరిశీలించండి.",
                "వాతావరణంలో తేమ మరియు ఆకాశం మబ్బుగా ఉన్నప్పుడు ముందస్తు జాగ్రత్తలు తీసుకోండి."
            ],
            "hi": [
                "मृदा परीक्षण के आधार पर संतुलित उर्वरक प्रबंधन जारी रखें।",
                "वानस्पतिक और दाना भराव अवस्था में हर 7-10 दिनों में खेत का नियमित निरीक्षण करें।",
                "उच्च आर्द्रता या बादलों वाले मौसम पर नज़र रखें।"
            ]
        },
        "reinspect_days": 7,
        "reinspect_text": {
            "en": "Re-inspect in 7 to 10 days for regular seasonal health monitoring.",
            "te": "సాధారణ పర్యవేక్షణ కోసం 7 నుండి 10 రోజులలో మళ్లీ పరిశీలించండి.",
            "hi": "नियमित मौसमी निगरानी के लिए 7 से 10 दिनों में पुनः निरीक्षण करें।"
        },
        "seek_help_conditions": {
            "en": "If sudden yellowing, wilting, or spot formation occurs across multiple plants, consult your local KVK.",
            "te": "ఒక్కసారిగా ఎక్కువ మొక్కలలో పసుపు రంగు లేదా మచ్చలు కనిపిస్తే వెంటనే స్థానిక KVK ని సంప్రదించండి.",
            "hi": "यदि कई पौधों में अचानक पीलापन या धब्बे दिखें, तो स्थानीय केवीके से परामर्श लें।"
        },
        "chemical_advice": {
            "en": "No chemical or fungicide application is needed or recommended for healthy crops.",
            "te": "ఆరోగ్యకరమైన పంటకు ఎటువంటి పురుగు మందులు లేదా ఫంగిసైడ్లు పిచికారీ చేయవలసిన అవసరం లేదు.",
            "hi": "स्वस्थ फसल के लिए किसी भी रासायनिक दवा या फफूंदनाशक की आवश्यकता नहीं है।"
        },
        "official_source": "ICAR-Indian Institute of Maize Research (IIMR) Scouting Guidelines",
        "cultural_actions": [
            "Maintain balanced fertilization based on soil testing.",
            "Ensure regular irrigation schedule without waterlogging.",
            "Continue periodic scouting at multiple points across the field every 7-10 days."
        ]
    },
    "common_rust": {
        "summary": {
            "en": "Puccinia sorghi infection detected. Favored by cool temperatures (16–24°C) and high relative humidity (>95%).",
            "te": "పుక్సినియా సోర్గి ఫంగస్ సంక్రమణ గుర్తించబడింది. చల్లని ఉష్ణోగ్రతలు (16-24°C) మరియు అధిక తేమ ఉన్నప్పుడు ఇది వేగంగా వ్యాపిస్తుంది.",
            "hi": "पुक्सिनिया सोर्गी कवक संक्रमण पाया गया। यह ठंडे तापमान (16-24°C) और अधिक नमी में तेजी से फैलता है।"
        },
        "what_it_means": {
            "en": "Rust pustules erupt on leaves, reducing photosynthesis and grain filling if infection occurs before tasseling.",
            "te": "ఆకులపై తుప్పు వంటి బొబ్బలు ఏర్పడి కిరణజన్య సంయోగక్రియను తగ్గిస్తాయి, దీనివల్ల గింజ బరువు తగ్గుతుంది.",
            "hi": "पत्तियों पर रतुआ जैसे फफोले बनते हैं, जिससे प्रकाश संश्लेषण घटता है और दानों का भराव प्रभावित होता है।"
        },
        "immediate_actions": {
            "en": [
                "Inspect both upper and lower leaf surfaces around the ear leaf.",
                "Avoid excessive overhead sprinkler irrigation that lengthens leaf wetness duration.",
                "Remove heavily infected lower leaf residues if confined to a small patch."
            ],
            "te": [
                "కంకి ఆకు చుట్టూ పై మరియు కింది వైపులా తుప్పు మచ్చలను పరిశీలించండి.",
                "ఆకులపై ఎక్కువసేపు నీరు నిలవకుండా స్పింక్లర్ లేదా తుంపర నీటిపారుదల తగ్గించండి.",
                "లక్షణాలు ఉన్న కొన్ని ఆకులను మాత్రమే గుర్తించి తోట నుండి వేరుచేయండి."
            ],
            "hi": [
                "भुट्टे के आसपास की पत्तियों के दोनों तरफ फफोलों की जाँच करें।",
                "पत्तियों को अधिक समय तक गीला रखने वाली स्प्रिंकलर सिंचाई से बचें।",
                "यदि संक्रमण शुरुआती और सीमित है, तो प्रभावित पत्तों को अलग करें।"
            ]
        },
        "preventive_care": {
            "en": [
                "For subsequent seasons, select certified rust-resistant maize hybrids recommended by ICAR-IIMR.",
                "Practice crop rotation with non-cereal crops such as pulses or oilseeds.",
                "Maintain balanced potash (K) and nitrogen (N) nutrition to enhance plant defenses."
            ],
            "te": [
                "తదుపరి పంట కాలంలో ICAR-IIMR ధృవీకరించిన రస్ట్-నిరోధక హైబ్రిడ్ విత్తనాలను ఎంచుకోండి.",
                "పప్పుధాన్యాలతో పంట మార్పిడి విధానాన్ని పాటించండి.",
                "మొక్కల రోగనిరోధక శక్తిని పెంచడానికి సిఫార్సు చేసిన పొటాష్ మరియు నత్రజని ఎరువులను సమతుల్యంగా వేయండి."
            ],
            "hi": [
                "अगले मौसम में ICAR-IIMR अनुशंसित रतुआ-प्रतिरोधी संकर बीजों का चयन करें।",
                "दलहनी फसलों के साथ फसल चक्र अपनाएँ।",
                "पौधों की रोग प्रतिरोधक क्षमता बढ़ाने हेतु पोटाश एवं संतुलित उर्वरकों का उपयोग करें।"
            ]
        },
        "reinspect_days": 3,
        "reinspect_text": {
            "en": "Re-inspect in 3 to 4 days to monitor spread toward the upper ear canopy.",
            "te": "పై ఆకులకు తెగులు వ్యాపిస్తుందో లేదో గమనించడానికి 3 నుండి 4 రోజుల్లో మళ్లీ తనిఖీ చేయండి.",
            "hi": "ऊपरी पत्तियों पर फैलाव देखने के लिए 3 से 4 दिनों में दोबारा निरीक्षण करें।"
        },
        "seek_help_conditions": {
            "en": "If pustules spread rapidly above the ear leaf before tasseling, consult local KVK or Agricultural Officer immediately.",
            "te": "కంకి కంటే పై ఆకులకు పూత దశకు ముందే తెగులు వేగంగా వ్యాపిస్తే వెంటనే స్థానిక వ్యవసాయ అధికారి లేదా KVK శాస్త్రవేత్తను సంప్రదించండి.",
            "hi": "यदि मंजर आने से पहले भुट्टे के ऊपर की पत्तियों में संक्रमण फैले, तो तुरंत नजदीकी कृषि अधिकारी या केवीके से संपर्क करें।"
        },
        "chemical_advice": {
            "en": "Consult local Agricultural Officer / KVK agronomist before spraying. If rust reaches upper leaves prior to tasseling and weather favors spread, extension guidelines cite labeled fungicides (e.g. Mancozeb 75% WP @ 2-2.5 g/L or Azoxystrobin) applied per label instructions with strict pre-harvest intervals.",
            "te": "స్ప్రే చేయడానికి ముందు తప్పనిసరిగా వ్యవసాయ అధికారి సలహా తీసుకోండి. తీవ్రత ఎక్కువగా ఉంటే విశ్వవిద్యాలయ సిఫార్సుల ప్రకారం మ్యాంకోజెబ్ 75% WP (లీటరు నీటికి 2-2.5 గ్రా) ఉపయోగించవచ్చు.",
            "hi": "छिड़काव से पहले कृषि अधिकारी से सलाह अवश्य लें। आवश्यकता पड़ने पर अनुशंसित फफूंदनाशक जैसे मैंकोजेब 75% WP (2-2.5 ग्राम प्रति लीटर पानी) का नियमानुसार उपयोग करें।"
        },
        "official_source": "ICAR-IIMR Integrated Disease Management & State Agricultural University (ANGRAU/PJTSAU) Maize Package of Practices",
        "cultural_actions": [
            "Monitor upper leaves around silking/tasseling stage.",
            "Avoid excessive overhead sprinkler irrigation that lengthens leaf wetness duration.",
            "For subsequent crop seasons, select certified rust-resistant maize hybrids suited for your zone."
        ]
    },
    "northern_leaf_blight": {
        "summary": {
            "en": "Exserohilum turcicum detected. Characterized by elongated, elliptical grayish-green to tan cigar-shaped lesions.",
            "te": "ఎక్సెరోహిలమ్ టర్సికమ్ ఫంగస్ సంక్రమణ గుర్తించబడింది. ఆకులపై పొడవాటి చుట్ట ఆకారపు బూడిద-గోధుమ మచ్చలు ఉంటాయి.",
            "hi": "एक्सरोहिलम टर्सिकम कवक संक्रमण पाया गया। पत्तियों पर लंबे सिगार के आकार के धब्बे बनते हैं।"
        },
        "what_it_means": {
            "en": "Extensive blighting causes premature death of foliage and severe yield loss during grain development.",
            "te": "ఈ తెగులు ఆకులను ఎండబెట్టి, గింజలు సరిగ్గా ఎదగకుండా దిగుబడిని గణనీయంగా తగ్గిస్తుంది.",
            "hi": "यह झुलसा पत्तियों को सूखा देता है, जिससे दाना बनने के समय भारी पैदावार का नुकसान हो सकता है।"
        },
        "immediate_actions": {
            "en": [
                "Assess lesion progression on leaves at and below the cob.",
                "Avoid overhead irrigation during cooler evening hours to reduce leaf wetness duration.",
                "Ensure proper field drainage to eliminate stagnant water."
            ],
            "te": [
                "కంకి కింద మరియు చుట్టుపక్కల ఆకులపై మచ్చల వ్యాప్తిని పరిశీలించండి.",
                "సాయంత్రం వేళల్లో ఆకులపై నీరు పడేలా నీటిపారుదల చేయవద్దు.",
                "చేనులో నీరు నిలవకుండా మురుగు కాలువలను సరిచేయండి."
            ],
            "hi": [
                "भुट्टे के नीचे और आसपास की पत्तियों पर धब्बों के फैलाव की जाँच करें।",
                "शाम के समय पत्तियों को भिगोने वाली सिंचाई से बचें।",
                "खेत में जलभराव न होने दें, जल निकासी की उचित व्यवस्था करें।"
            ]
        },
        "preventive_care": {
            "en": [
                "Deep plow crop debris after harvest to bury overwintering fungal spores.",
                "Practice 1-2 year crop rotation with non-host crops (e.g., legumes/pulses).",
                "Select certified blight-resistant hybrid cultivars for your agro-climatic zone."
            ],
            "te": [
                "పంట కోత తర్వాత భూమిని లోతుగా దున్ని శిలీంధ్ర అవశేషాలను మట్టిలో కలపండి.",
                "కనీసం 1-2 సీజన్లు అపరాలు లేదా నూనెగింజల పంటలతో పంట మార్పిడి చేయండి.",
                "మీ ప్రాంతానికి అనువైన తెగులు నిరోధక హైబ్రిడ్ రకాలను మాత్రమే సాగు చేయండి."
            ],
            "hi": [
                "कटाई के बाद गहरी जुताई करें ताकि कवक के अवशेष मिट्टी में दब जाएँ।",
                "कम से कम 1-2 मौसम तक गैर-घास कुल की फसलों के साथ फसल चक्र अपनाएँ।",
                "अपने क्षेत्र के लिए प्रमाणित रोगरोधी संकर किस्मों का चयन करें।"
            ]
        },
        "reinspect_days": 3,
        "reinspect_text": {
            "en": "Re-inspect within 3 to 5 days, tracking whether cigar lesions expand across leaf veins.",
            "te": "మచ్చలు నరాలను దాటి విస్తరిస్తున్నాయో లేదో చూడటానికి 3 నుండి 5 రోజుల్లో మళ్లీ పరిశీలించండి.",
            "hi": "धब्बे नसों को पार कर बढ़ रहे हैं या नहीं, यह देखने के लिए 3 से 5 दिनों में दोबारा जाँच करें।"
        },
        "seek_help_conditions": {
            "en": "If lesions appear on ear leaf or above during silking, contact your local extension officer immediately.",
            "te": "పరాగ సంపర్కానికి ముందే కంకి ఆకుపై మచ్చలు కనిపిస్తే వెంటనే వ్యవసాయ అధికారిని సంప్రదించండి.",
            "hi": "यदि परागण से पहले भुट्टे के पत्ते पर धब्बे दिखने लगें, तो तुरंत कृषि अधिकारी से संपर्क करें।"
        },
        "chemical_advice": {
            "en": "Verify economic threshold with local extension officer. Standard university recommendation: if lesions appear on ear leaf or above during silking, spray Mancozeb 75% WP @ 2.5 g/L water or Propiconazole 25% EC @ 1 mL/L water as permitted by local registration.",
            "te": "వ్యవసాయ విస్తరణ అధికారి సూచన మేరకే మందులు వాడండి. సిఫార్సుల ప్రకారం మ్యాంకోజెబ్ 75% WP (2.5 గ్రా/లీ) లేదా ప్రోపికోనజోల్ 25% EC (1 మి.లీ/లీ) పిచికారీ చేయవచ్చు.",
            "hi": "कृषि विशेषज्ञ की सलाह के अनुसार ही दवा का उपयोग करें। मानक दिशानिर्देशों के अनुसार मैंकोजेब 75% WP (2.5 ग्रा/ली) या प्रोपिकोनाजोल 25% EC (1 मि.ली/ली) का छिड़काव किया जा सकता है।"
        },
        "official_source": "ICAR-IIMR Package of Practices for Maize Diseases & TNAU Agritech Portal",
        "cultural_actions": [
            "Deep plow crop debris after harvest to bury overwintering fungal spores.",
            "Practice 1-2 year crop rotation with non-host crops (e.g., legumes/pulses).",
            "Avoid overhead irrigation during cooler evening hours to reduce leaf wetness duration."
        ]
    },
    "gray_leaf_spot": {
        "summary": {
            "en": "Cercospora zeae-maydis detected. Produces rectangular, tan-to-gray lesions restricted between leaf veins.",
            "te": "సెర్కోస్పోరా జియే-మేడిస్ సంక్రమణ గుర్తించబడింది. ఆకు ఈనెల మధ్య దీర్ఘచతురస్రాకారపు బూడిద-గోధుమ రంగు మచ్చలు ఉంటాయి.",
            "hi": "सर्कोस्पोरा ज़ी-मेयडिस कवक संक्रमण पाया गया। पत्तियों की नसों के बीच आयताकार धूसर धब्बे बनते हैं।"
        },
        "what_it_means": {
            "en": "Severe infections cause blighting of leaves, premature dry-down, and stalk lodging.",
            "te": "తీవ్రమైన వ్యాధి వల్ల ఆకులు త్వరగా ఎండిపోయి, పైరు నేలకొరిగే ప్రమాదం ఉంది.",
            "hi": "गंभीर संक्रमण से पत्तियाँ सूख जाती हैं और तने के गिरने का खतरा बढ़ जाता है।"
        },
        "immediate_actions": {
            "en": [
                "Check lower leaves first where humidity is highest.",
                "Maintain optimal plant spacing to allow adequate sunlight penetration and air circulation.",
                "Avoid excess nitrogen applications that promote overly succulent canopy."
            ],
            "te": [
                "తేమ ఎక్కువగా ఉండే కింది ఆకులను మొదట పరిశీలించండి.",
                "గాలి, వెలుతురు బాగా సోకేలా కలుపు మొక్కలను తొలగించి తగిన ఎడం పాటించండి.",
                "నత్రజని ఎరువులను అధికంగా వాడటం నివారించండి."
            ],
            "hi": [
                "निचली पत्तियों की पहले जाँच करें जहाँ नमी अधिक रहती है।",
                "हवा और धूप के संचार के लिए खरपतवार हटाएँ और पौधों की उचित दूरी रखें।",
                "अत्यधिक नाइट्रोजन उर्वरक के प्रयोग से बचें।"
            ]
        },
        "preventive_care": {
            "en": [
                "Incorporate residue post-harvest or practice conservation tillage with rotation.",
                "Rotate field with non-graminaceous crops (soybean, groundnut, pulses).",
                "Select hybrid varieties with proven tolerance to Cercospora gray leaf spot."
            ],
            "te": [
                "వేరుశనగ, సోయాచిక్కుడు లేదా పప్పుధాన్యాల పంటలతో పంట మార్పిడి చేయండి.",
                "పంట కోత తర్వాత భూమిని బాగా దున్ని మొండి మొదళ్ళను నాశనం చేయండి.",
                "గ్రే లీఫ్ స్పాట్ తట్టుకునే హైబ్రిడ్ రకాలను మాత్రమే ఎంపిక చేసుకోండి."
            ],
            "hi": [
                "सोयाबीन, मूंगफली या दलहनी फसलों के साथ फसल चक्र अपनाएँ।",
                "फसल अवशेषों को मिट्टी में मिलाएँ या उचित जुताई करें।",
                "रोग सहिष्णु प्रमाणित संकर किस्मों का चयन करें।"
            ]
        },
        "reinspect_days": 4,
        "reinspect_text": {
            "en": "Re-inspect in 4 to 6 days to observe if rectangular spots merge and dry out upper leaves.",
            "te": "మచ్చలు కలిసిపోయి పై ఆకులు ఎండిపోతున్నాయా అని చూడటానికి 4 నుండి 6 రోజుల్లో మళ్లీ తనిఖీ చేయండి.",
            "hi": "धब्बे आपस में मिलकर पत्तियों को सूखा तो नहीं रहे, यह देखने के लिए 4 से 6 दिनों में दोबारा जाँच करें।"
        },
        "seek_help_conditions": {
            "en": "If rectangular lesions reach upper leaves before grain filling is complete, contact your Agricultural Extension Officer.",
            "te": "గింజ పాలు పోసుకునే దశకు ముందే పై ఆకులకు మచ్చలు చేరితే వెంటనే వ్యవసాయ అధికారిని సంప్రదించండి.",
            "hi": "दाना भरने से पहले यदि धब्बे ऊपरी पत्तियों तक पहुँच जाएँ, तो तुरंत कृषि विस्तार अधिकारी से संपर्क करें।"
        },
        "chemical_advice": {
            "en": "Consult your local Agricultural Development Officer. Where severe and before grain fill completion, labeled triazole/strobilurin fungicides may be recommended subject to official regional label compliance.",
            "te": "అనుమతించబడిన మందుల కోసం మీ వ్యవసాయ అధికారిని సంప్రదించండి. స్థానిక నిబంధనల ప్రకారం సిఫార్సు చేసిన ఫంగిసైడ్లను మాత్రమే వాడాలి.",
            "hi": "अनुमोदित कवकनाशी के लिए अपने कृषि अधिकारी से परामर्श लें। नियमों के अनुसार अनुशंसित दवाओं का ही सीमित उपयोग करें।"
        },
        "official_source": "Directorate of Maize Research (DMR) / ICAR Field Advisory",
        "cultural_actions": [
            "Incorporate residue post-harvest or practice conservation tillage with rotation.",
            "Rotate field with non-graminaceous crops (soybean, groundnut, pulses).",
            "Maintain optimal plant spacing to allow adequate sunlight penetration and air circulation."
        ]
    }
}

def estimate_maize_lesion_severity(cv_img: np.ndarray):
    """
    Estimates lesion spread percentage and agronomic severity stage for maize leaves.
    Returns (lesion_pct: float, stage: str).
    """
    if cv_img is None:
        return 0.0, "healthy_or_incubation"

    hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
    h, w, _ = cv_img.shape
    total_pixels = h * w

    # Leaf foliage mask (green + chlorotic yellow + necrotic brown)
    lower_foliage = np.array([12, 12, 25])
    upper_foliage = np.array([95, 255, 255])
    mask_foliage = cv2.inRange(hsv, lower_foliage, upper_foliage)
    foliage_count = int(cv2.countNonZero(mask_foliage))
    if foliage_count < 100:
        foliage_count = total_pixels

    # Necrotic / disease lesion mask:
    # 1. Dark brown / reddish brown / rust pustules
    lower_brown = np.array([5, 30, 20])
    upper_brown = np.array([24, 255, 180])
    mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)

    # 2. Dark necrotic spots / black lesions
    lower_dark = np.array([0, 0, 10])
    upper_dark = np.array([180, 255, 60])
    mask_dark = cv2.inRange(hsv, lower_dark, upper_dark)
    mask_dark = cv2.bitwise_and(mask_dark, mask_foliage)

    # 3. Tan / grayish necrotic spots (gray leaf spot / northern leaf blight)
    lower_tan = np.array([10, 15, 60])
    upper_tan = np.array([32, 110, 190])
    mask_tan = cv2.inRange(hsv, lower_tan, upper_tan)

    combined_lesions = cv2.bitwise_or(mask_brown, mask_dark)
    combined_lesions = cv2.bitwise_or(combined_lesions, mask_tan)
    combined_lesions = cv2.bitwise_and(combined_lesions, mask_foliage)
    lesion_pixels = int(cv2.countNonZero(combined_lesions))

    lesion_pct = round((lesion_pixels / float(foliage_count)) * 100.0, 1)

    if lesion_pct < 1.0:
        stage = "healthy_or_incubation"
    elif lesion_pct < 5.0:
        stage = "early"
    elif lesion_pct < 20.0:
        stage = "moderate"
    else:
        stage = "severe"

    return lesion_pct, stage

class MaizePredictor:
    def __init__(self, weights_path: str = None):
        # Resolve relative to the project root, not the folder uvicorn was started from
        self.weights_path = Path(weights_path) if weights_path else Path(__file__).resolve().parents[3] / "models" / "maize_mobilenetv2.pth"
        self.device = torch.device("cpu")
        self.model = None
        self.is_loaded = False
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        self.load_model()

    def load_model(self):
        try:
            model = models.mobilenet_v2(weights=None)
            in_features = model.classifier[1].in_features
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.2),
                nn.Linear(in_features, len(CLASSES))
            )
            if self.weights_path.exists():
                state_dict = torch.load(self.weights_path, map_location=self.device)
                model.load_state_dict(state_dict)
                model.eval()
                self.model = model
                self.is_loaded = True
                print(f"Loaded maize MobileNetV2 weights from {self.weights_path}")
            else:
                print(f"Warning: Model weights not found at {self.weights_path}. Running in demo fallback mode.")
        except Exception as e:
            print(f"Error loading model weights: {e}")
            self.is_loaded = False

    def predict(
        self,
        image_bytes: bytes,
        is_demo_mode: bool = False,
        field_id: Optional[str] = None,
        field_confirmed: bool = False,
        sensor: Optional[Any] = None
    ) -> Dict[str, Any]:
        t0 = time.perf_counter()

        if not self.is_loaded or is_demo_mode:
            # Deterministic, transparent demonstration response
            latency = (time.perf_counter() - t0) * 1000.0
            return self._build_demo_response(latency)

        try:
            # Estimate lesion severity and stage from leaf pixels
            cv_img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
            lesion_pct, severity_stage = estimate_maize_lesion_severity(cv_img)

            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tensor = self.transform(image).unsqueeze(0).to(self.device)

            with torch.no_grad():
                logits = self.model(tensor)
                probs = torch.softmax(logits, dim=1).squeeze(0).numpy()

            latency_ms = (time.perf_counter() - t0) * 1000.0

            pred_idx = int(probs.argmax())
            pred_class = CLASSES[pred_idx]
            max_prob = float(probs[pred_idx])

            # Abstention & Uncertainty Handling
            is_uncertain = max_prob < 0.65
            uncertainty_reason = None
            if is_uncertain:
                uncertainty_reason = {
                    "en": f"Confidence score ({round(max_prob * 100, 1)}%) is below the safe threshold (65%). Visual evidence is inconclusive.",
                    "te": f"విశ్వసనీయత స్కోరు ({round(max_prob * 100, 1)}%) సురక్షిత పరిమితి (65%) కంటే తక్కువగా ఉంది. మరింత పరిశీలన అవసరం.",
                    "hi": f"विश्वसनीयता स्कोर ({round(max_prob * 100, 1)}%) 65% सीमा से कम है। दृश्य प्रमाण अनिर्णायक हैं।"
                }

            # False-Healthy Guardrail:
            # If the model predicts 'healthy' but lesion pixels are visible (> 3.0%),
            # mark as inconclusive rather than falsely reporting 100% healthy leaf.
            if pred_class == "healthy" and lesion_pct > 3.0:
                is_uncertain = True
                uncertainty_reason = {
                    "en": f"Visual conflict: model predicted Healthy, but {lesion_pct}% necrotic lesion spread was detected. Latent fungal incubation, Northern corn leaf blight initiation, or leaf scorch suspected. Inconclusive.",
                    "te": f"దృశ్య సంకేతాల వైరుధ్యం: మోడల్ ఆరోగ్యకరమైనదిగా సూచించింది, కానీ ఆకుపై {lesion_pct}% నెక్రోటిక్ మచ్చల వ్యాప్తి గుర్తించబడింది. ప్రారంభ ఇన్ఫెక్షన్ లేదా ఆకు ఎండు తెగులు అనుమానించబడింది.",
                    "hi": f"दृश्य साक्ष्य में विसंगति: मॉडल ने स्वस्थ अनुमान लगाया, लेकिन पत्ती पर {lesion_pct}% रोगग्रस्त धब्बे पाए गए। प्रारंभिक संक्रमण या झुलसा रोग का संदेह है। अनिर्णायक।"
                }

            prob_list = []
            for i, c in enumerate(CLASSES):
                prob_list.append({
                    "label": c,
                    "name": CLASS_DISPLAY_NAMES[c]["en"],
                    "probability": round(float(probs[i]), 4),
                    "percentage": round(float(probs[i]) * 100, 1)
                })

            differentials = DIFFERENTIAL_CAUSES.get(pred_class, [])
            guidance = MANAGEMENT_GUIDANCE_DB.get(pred_class, MANAGEMENT_GUIDANCE_DB["healthy"])

            base_result = {
                "crop": "maize",
                "predicted_class": pred_class,
                "display_name": CLASS_DISPLAY_NAMES[pred_class],
                "confidence": round(max_prob, 4),
                "is_uncertain": is_uncertain,
                "uncertainty_reason": uncertainty_reason,
                "all_probabilities": prob_list,
                "model_version": "mobilenet_v2_v1.0",
                "source_mode": "model_inference",
                "latency_ms": round(latency_ms, 2),
                "differential_possibilities": differentials,
                "management_guidance": guidance,
                "lesion_pct": lesion_pct,
                "severity_stage": severity_stage
            }
            def lookup(cls_name: str):
                return (
                    CLASS_DISPLAY_NAMES.get(cls_name, CLASS_DISPLAY_NAMES["healthy"]),
                    MANAGEMENT_GUIDANCE_DB.get(cls_name, MANAGEMENT_GUIDANCE_DB["healthy"])
                )

            try:
                from backend.app.vision.decision_pipeline import run_decision_pipeline
            except ImportError:
                try:
                    from app.vision.decision_pipeline import run_decision_pipeline
                except ImportError:
                    from decision_pipeline import run_decision_pipeline

            return run_decision_pipeline(base_result, image_bytes, sensor, field_confirmed, lookup)
        except Exception as e:
            latency_ms = (time.perf_counter() - t0) * 1000.0
            print(f"Inference error: {e}")
            return self._build_demo_response(latency_ms, error=str(e))

    def _build_demo_response(self, latency_ms: float, error: str = None) -> Dict[str, Any]:
        pred_class = "common_rust"
        return {
            "crop": "maize",
            "predicted_class": pred_class,
            "display_name": CLASS_DISPLAY_NAMES[pred_class],
            "confidence": 0.88,
            "is_uncertain": False,
            "uncertainty_reason": None,
            "all_probabilities": [
                {"label": "common_rust", "name": "Common Rust", "probability": 0.88, "percentage": 88.0},
                {"label": "northern_leaf_blight", "name": "Northern Corn Leaf Blight", "probability": 0.07, "percentage": 7.0},
                {"label": "gray_leaf_spot", "name": "Gray Leaf Spot", "probability": 0.03, "percentage": 3.0},
                {"label": "healthy", "name": "Healthy Maize Leaf", "probability": 0.02, "percentage": 2.0}
            ],
            "model_version": "demo_workflow_v1.0",
            "source_mode": "demonstration",
            "latency_ms": round(latency_ms, 2),
            "differential_possibilities": DIFFERENTIAL_CAUSES[pred_class],
            "management_guidance": MANAGEMENT_GUIDANCE_DB[pred_class],
            "note": "Transparent Demonstration Mode — not an actual model inference." if not error else f"Fallback due to: {error}",
            "lesion_pct": 14.2,
            "severity_stage": "moderate"
        }
