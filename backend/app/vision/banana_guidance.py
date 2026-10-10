"""
Agronomic Management Guidance for Banana Leaf Diseases
Sources: ICAR-National Research Centre for Banana (NRCB), Tiruchirappalli,
ICAR-Indian Institute of Horticultural Research (IIHR), and TNAU Agritech Portal.
Strict adherence to certified agricultural extension guidelines without fabricated chemical doses.
"""

BANANA_CLASSES = ["healthy", "black_sigatoka", "bacterial_wilt"]

BANANA_CLASS_DISPLAY_NAMES = {
    "healthy": {
        "en": "Healthy Banana Leaf",
        "te": "ఆరోగ్యకరమైన అరటి ఆకు",
        "hi": "स्वस्थ केले की पत्ती"
    },
    "black_sigatoka": {
        "en": "Black Sigatoka / Black Leaf Streak (Pseudocercospora fijiensis)",
        "te": "నల్ల సిగటోకా తెగులు (బ్లాక్ సిగటోకా)",
        "hi": "ब्लैक सिगाटोका (काला धब्बा रोग)"
    },
    "bacterial_wilt": {
        "en": "Banana Bacterial Wilt (Xanthomonas vasicola pv. musacearum)",
        "te": "అరటి బాక్టీరియల్ విల్ట్ (బాక్టీరియా ఎండు తెగులు)",
        "hi": "केला जीवाणु उकठा (बैक्टीरियल विल्ट)"
    },
    "cordana": {
        "en": "Cordana Leaf Spot (Cordana musae)",
        "te": "కార్డానా ఆకు మచ్చ తెగులు",
        "hi": "कॉर्डाना पत्ती धब्बा रोग"
    },
    "pestalotiopsis": {
        "en": "Pestalotiopsis Leaf Spot (Pestalotiopsis sp.)",
        "te": "పెస్టలోటియోప్సిస్ ఆకు మచ్చ తెగులు",
        "hi": "पेस्टालोटियोप्सिस पत्ती धब्बा रोग"
    }
}

BANANA_DIFFERENTIALS = {
    "black_sigatoka": [
        {
            "condition": "Yellow Sigatoka (Pseudocercospora musae)",
            "similarity": "Initial streaks and yellow halos on older leaves.",
            "differentiation": "Black Sigatoka produces darker reddish-brown to black streaks visible early on underside of leaves, and spreads faster than yellow sigatoka."
        },
        {
            "condition": "Cordana Leaf Spot (Cordana musae)",
            "similarity": "Large oval necrotic spots with yellow borders.",
            "differentiation": "Cordana spots are typically larger, zonate with concentric rings, often occurring at leaf margins."
        },
        {
            "condition": "Potassium Deficiency Marginal Scorch",
            "similarity": "Rapid yellowing and necrosis of older leaf tips and edges.",
            "differentiation": "Nutrient deficiency affects entire leaf margins uniformly without discrete reddish-brown streak lesions."
        }
    ],
    "bacterial_wilt": [
        {
            "condition": "Fusarium Wilt / Panama Disease (Fusarium oxysporum f. sp. cubense)",
            "similarity": "Severe wilting and yellowing of lower leaves.",
            "differentiation": "Bacterial wilt shows internal floral/bunch pocket rot and bacterial ooze from cut pseudostem within 5 minutes, unlike fungal vascular browning of Panama disease."
        },
        {
            "condition": "Drought / Heat Stress Collapse",
            "similarity": "Drooping and buckling of leaf petioles.",
            "differentiation": "Drought stress recovers with irrigation; bacterial wilt exhibits irreversible yellowing and rapid plant death."
        }
    ],
    "healthy": [
        {
            "condition": "Early Incubation of Leaf Streak",
            "similarity": "Leaf currently green and asymptomatic, but latent infection can incubate 14-21 days in humid conditions.",
            "differentiation": "Regular weekly deleafing scouting during rainy or overcast spells."
        }
    ]
}

BANANA_MANAGEMENT_GUIDANCE_DB = {
    "healthy": {
        "summary": {
            "en": "Banana foliage is vigorous and clean with no necrotic streaks or wilt symptoms.",
            "te": "అరటి ఆకు ఎటువంటి తెగులు మచ్చలు లేదా ఎండు లక్షణాలు లేకుండా ఆరోగ్యంగా ఉంది.",
            "hi": "केले की पत्ती स्वस्थ है, इसमें किसी प्रकार के काले धब्बे या मुरझाने के लक्षण नहीं हैं।"
        },
        "what_it_means": {
            "en": "Canopy photosynthesis is optimal for bunch development. Maintain balanced nutrition.",
            "te": "గెలల పెరుగుదలకు కిరణజన్య సంయోగక్రియ అనుకూలంగా ఉంది. సమతుల్య పోషణ కొనసాగించండి.",
            "hi": "घौद के विकास के लिए पत्ती स्वस्थ है। संतुलित पोषण जारी रखें।"
        },
        "immediate_actions": {
            "en": [
                "Ensure proper field drainage; avoid stagnant water around mat basins.",
                "Remove dry senescent lower leaves to improve air circulation.",
                "Continue periodic scouting at multiple points across the plantation every 7-10 days."
            ],
            "te": [
                "అరటి మొదళ్ళ చుట్టూ నీరు నిలవకుండా మురుగు కాలువలను శుభ్రం చేయండి.",
                "గాలి వెలుతురు సోకేలా ఎండిన కింది ఆకులను తొలగించండి.",
                "తోటలో క్రమం తప్పకుండా ప్రతి 7-10 రోజులకు ఒకసారి ఆకులను పరిశీలించండి."
            ],
            "hi": [
                "पौधों के थालों के पास जलभराव न होने दें, जल निकासी ठीक रखें।",
                "हवा के संचार के लिए निचली सूखी पत्तियों को हटाएँ।",
                "हर 7-10 दिनों में बाग का नियमित निरीक्षण जारी रखें।"
            ]
        },
        "preventive_care": {
            "en": [
                "Maintain recommended potassium (K) nutrition to enhance leaf tissue toughness.",
                "Use certified disease-free tissue culture plantlets for new plantations.",
                "Practice regular weed sanitation along border rows."
            ],
            "te": [
                "ఆకుల బలం కోసం సిఫార్సు చేసిన పొటాష్ ఎరువులను సమతుల్యంగా వేయండి.",
                "కొత్త తోటలకు ధృవీకరించిన టిష్యూ కల్చర్ మొక్కలను మాత్రమే ఎంచుకోండి.",
                "గట్లపై కలుపు లేకుండా పరిశుభ్రంగా ఉంచండి."
            ],
            "hi": [
                "पत्तियों की मजबूती हेतु अनुशंसित पोटाश उर्वरक का प्रयोग करें।",
                "नए रोपण हेतु प्रमाणित रोगमुक्त टिश्यू कल्चर पौधों का उपयोग करें।",
                "मेड़ों पर खरपतवार नियंत्रण बनाए रखें।"
            ]
        },
        "reinspect_days": 7,
        "reinspect_text": {
            "en": "Re-inspect in 7 to 10 days for regular growth and leaf emergence monitoring.",
            "te": "సాధారణ పర్యవేక్షణ కోసం 7 నుండి 10 రోజులలో మళ్లీ పరిశీలించండి.",
            "hi": "नियमित विकास निगरानी के लिए 7 से 10 दिनों में पुनः निरीक्षण करें।"
        },
        "seek_help_conditions": {
            "en": "If sudden yellowing or leaf collapse appears across multiple plants, consult your local KVK horticulturist.",
            "te": "ఒక్కసారిగా ఎక్కువ చెట్లలో ఆకులు పసుపు రంగుకు మారి వాలిపోతే వెంటనే స్థానిక ఉద్యానవన అధికారిని సంప్రదించండి.",
            "hi": "यदि अचानक कई पौधों में पीलापन या पत्तियाँ झुकने लगें, तो तुरंत नजदीकी केवीके विशेषज्ञ से संपर्क करें।"
        },
        "chemical_advice": {
            "en": "No fungicide or bactericide application is recommended for healthy plants.",
            "te": "ఆరోగ్యకరమైన తోటలకు ఎటువంటి రసాయన మందులు వాడవలసిన అవసరం లేదు.",
            "hi": "स्वस्थ पौधों के लिए किसी भी रासायनिक छिड़काव की आवश्यकता नहीं है।"
        },
        "official_source": "ICAR-National Research Centre for Banana (NRCB) Good Agricultural Practices",
        "cultural_actions": [
            "Ensure proper drainage and avoid waterlogging.",
            "Prune dry senescent leaves regularly.",
            "Maintain balanced soil nutrition based on soil health card."
        ],
        "stage_guidance": {
            "healthy_or_incubation": {
                "en": "Canopy is clear of disease lesions (< 1% lesion tissue). Maintain standard good agricultural practices and weekly scouting.",
                "te": "ఆకుపై ఎటువంటి తెగులు మచ్చలు లేవు (< 1%). మంచి సాగు పద్ధతులను మరియు వారపు పరిశీలనను కొనసాగించండి.",
                "hi": "पत्ती पर रोग के लक्षण नहीं हैं (< 1%)। सामान्य कृषि प्रबंधन और साप्ताहिक निरीक्षण जारी रखें।"
            },
            "early": {
                "en": "Early visual alert: Minimal spots detected (1-5%). Monitor closely for rapid streak expansion over the next 4-7 days.",
                "te": "ప్రారంభ హెచ్చరిక: స్వల్ప మచ్చలు గుర్తించబడ్డాయి (1-5%). రాబోయే 4-7 రోజుల్లో మచ్చలు విస్తరిస్తున్నాయో లేదో గమనించండి.",
                "hi": "शुरुआती चेतावनी: हल्के धब्बे दिखे (1-5%)। अगले 4-7 दिनों में धब्बों के फैलाव पर नज़र रखें।"
            }
        }
    },
    "black_sigatoka": {
        "summary": {
            "en": "Pseudocercospora fijiensis fungal infection detected. High risk in warm, humid tropical conditions.",
            "te": "సూడోసెర్కోస్పోరా ఫిజియెన్సిస్ శిలీంధ్ర సంక్రమణ గుర్తించబడింది. తేమ మరియు ఉష్ణోగ్రత ఎక్కువగా ఉన్నప్పుడు తీవ్రంగా వ్యాపిస్తుంది.",
            "hi": "स्यूडोसर्कोस्पोरा फिजिएन्सिस कवक संक्रमण पाया गया। गर्म एवं नम मौसम में यह तेजी से फैलता है।"
        },
        "what_it_means": {
            "en": "Causes rapid premature leaf death, undersized fruit bunches, and early ripening during transit.",
            "te": "ఆకులు త్వరగా ఎండిపోయి రాలిపోతాయి, గెలలు చిన్నవిగా ఉండి దిగుబడి తీవ్రంగా తగ్గుతుంది.",
            "hi": "पत्तियाँ समय से पहले सूख जाती हैं, घौद का आकार छोटा रहता है और पैदावार घट जाती है।"
        },
        "immediate_actions": {
            "en": [
                "Practice systematic deleafing: remove and destroy severely spotted leaf tips/segments.",
                "Deposit excised infected leaves on the ground with upper surface facing down to limit spore dispersal.",
                "Improve plantation drainage to lower relative humidity within the canopy."
            ],
            "te": [
                "తీవ్రంగా మచ్చలు ఉన్న ఆకులను లేదా ఆకు భాగాలను కత్తిరించి తోట నుండి వేరుచేయండి.",
                "తెగులు సోకిన ఆకులను భూమిపై బోర్లించి వేయడం ద్వారా గాలిలోకి బీజాలు వ్యాపించకుండా నివారించండి.",
                "తోటలో తేమ తగ్గేలా మురుగు నీటి కాలువలను సరిచేయండి."
            ],
            "hi": [
                "अधिक संक्रमित पत्तियों या पत्ती के हिस्सों को काटकर नष्ट करें।",
                "काटी गई पत्तियों को जमीन पर उल्टा रखें ताकि बीजाणु हवा में न उड़ें।",
                "बाग में नमी कम करने के लिए जल निकासी सुधारे।"
            ]
        },
        "preventive_care": {
            "en": [
                "Maintain optimal spacing (minimum 1.8m x 1.8m) to promote canopy ventilation.",
                "Control broadleaf weeds that trap moisture around pseudostem bases.",
                "Rotate with non-host crops and select tolerant cultivars recommended by NRCB."
            ],
            "te": [
                "గాలి ప్రసరణ బాగుండేలా తగిన మొక్కల దూరం (కనీసం 1.8 మీ x 1.8 మీ) పాటించండి.",
                "మొక్కల మొదళ్ల వద్ద తేమ నిల్వ ఉండకుండా కలుపును ఎప్పటికప్పుడు తొలగించండి.",
                "NRCB సిఫార్సు చేసిన తెగులు తట్టుకునే రకాలను ఎంపిక చేసుకోండి."
            ],
            "hi": [
                "उचित दूरी (कम से कम 1.8 मी x 1.8 मी) रखें ताकि धूप और हवा मिल सके।",
                "पौधों के आधार के पास खरपतवार नियंत्रण रखें।",
                "एनआरसीबी द्वारा अनुशंसित सहिष्णु किस्मों का चयन करें।"
            ]
        },
        "reinspect_days": 4,
        "reinspect_text": {
            "en": "Re-inspect in 4 to 5 days to evaluate if young unfurling leaves show new reddish streaks.",
            "te": "కొత్తగా విచ్చుకునే లేత ఆకులపై ఎర్రటి గీతలు కనిపిస్తున్నాయో లేదో 4 నుండి 5 రోజుల్లో మళ్లీ పరిశీలించండి.",
            "hi": "नई निकलने वाली पत्तियों पर धब्बे आ रहे हैं या नहीं, यह देखने के लिए 4 से 5 दिनों में पुनः जाँच करें।"
        },
        "seek_help_conditions": {
            "en": "If more than 5 functional leaves per plant show extensive necrosis before shooting, contact your District Horticultural Officer.",
            "te": "గెల వేయడానికి ముందే చెట్టుకు 5 కంటే ఎక్కువ ఆకులు ఎండిపోతే వెంటనే జిల్లా ఉద్యానవన అధికారిని సంప్రదించండి.",
            "hi": "घौद आने से पहले यदि प्रति पौधा 5 से अधिक पत्तियाँ सूखने लगें, तो तुरंत उद्यान अधिकारी से संपर्क करें।"
        },
        "chemical_advice": {
            "en": "Consult local Horticultural Extension Officer before spraying. University recommendations cite labeled systemic triazoles (e.g. Propiconazole 25% EC @ 1 mL/L) or mineral oil formulations applied strictly per official state package of practices.",
            "te": "మందుల పిచికారీకి ముందు ఉద్యానవన అధికారి సలహా తప్పనిసరి. విశ్వవిద్యాలయ సిఫార్సుల ప్రకారం ప్రోపికోనజోల్ 25% EC (1 మి.లీ/లీ) ఖనిజ నూనెతో కలిపి నిబంధనల ప్రకారం వాడవచ్చు.",
            "hi": "छिड़काव से पहले उद्यान अधिकारी से सलाह लें। मानक विश्वविद्यालय दिशानिर्देशों के अनुसार प्रोपिकोनाजोल 25% EC (1 मि.ली/ली) का सीमित छिड़काव किया जा सकता है।"
        },
        "official_source": "ICAR-NRCB Integrated Disease Management & TNAU Banana Advisory",
        "cultural_actions": [
            "Deleaf infected leaf portions systematically.",
            "Improve drainage and reduce canopy humidity.",
            "Avoid overhead irrigation that wets foliage."
        ],
        "stage_guidance": {
            "early": {
                "en": "Early Stage (Lesions < 5%): Faint reddish-brown streaks on leaf undersides. Practice tip-pruning of spotted leaves and improve drainage to reduce humidity.",
                "te": "ప్రారంభ దశ (మచ్చలు < 5%): ఆకు వెనుక లేత ఎర్రటి గీతలు. మచ్చలు ఉన్న ఆకు భాగాలను కత్తిరించండి మరియు తోటలో తేమ తగ్గేలా మురుగు కాలువలను సరిచేయండి.",
                "hi": "प्रारंभिक अवस्था (धब्बे < 5%): पत्ती के नीचे हल्के लाल-भूरे धब्बे। धब्बेदार हिस्सों को काटें और नमी कम करने हेतु जल निकासी सुधारें।"
            },
            "moderate": {
                "en": "Moderate Stage (5% - 20%): Streaks coalescing into dark brown necrotic spots with yellow halos. Systematic deleafing required; consult horticulture officer before fungicide spray.",
                "te": "మధ్యస్థ దశ (5% - 20%): మచ్చలు కలిసిపోయి పసుపు రంగు వలయాలతో నల్లగా మారుతున్నాయి. తీవ్రంగా దెబ్బతిన్న ఆకులను తొలగించండి; మందుల పిచికారీకి ముందు ఉద్యానవన అధికారిని సంప్రదించండి.",
                "hi": "मध्यम अवस्था (5% - 20%): धब्बे आपस में मिलकर काले हो रहे हैं। अधिक प्रभावित पत्तियों को काटें; कवकनाशी छिड़काव से पहले उद्यान अधिकारी से सलाह लें।"
            },
            "severe": {
                "en": "Severe Stage (> 20%): Broad necrotic leaf blighting. Immediate field sanitation, leaf destruction, and official agricultural extension intervention required.",
                "te": "తీవ్ర దశ (> 20%): ఆకులు విస్తారంగా ఎండిపోవడం. వెంటనే తోట పరిశుభ్రత, ఎండిన ఆకులను నాశనం చేయడం మరియు ఉద్యానవన అధికారి సలహా అవసరం.",
                "hi": "गंभीर अवस्था (> 20%): पत्तियाँ व्यापक रूप से झुलस चुकी हैं। तुरंत बाग की सफाई करें, पत्तियाँ नष्ट करें और कृषि विशेषज्ञ से संपर्क करें।"
            }
        }
    },
    "bacterial_wilt": {
        "summary": {
            "en": "Banana Bacterial Wilt (Xanthomonas) suspected. Extremely contagious vascular disease.",
            "te": "అరటి బాక్టీరియల్ విల్ట్ (జాంతోమోనాస్) సంక్రమణ అనుమానించబడింది. ఇది అత్యంత వేగంగా వ్యాపించే సంక్రమణ తెగులు.",
            "hi": "केला जीवाणु उकठा (जैंथोमोनास) का संदेह है। यह एक अत्यधिक संक्रामक रोग है।"
        },
        "what_it_means": {
            "en": "Causes vascular clogging, complete plant wilting, and bunch rotting. Can spread to adjacent mats rapidly.",
            "te": "మొక్కల నాళాలు మూసుకుపోయి చెట్టు పూర్తిగా ఎండిపోతుంది, గెలలు కుళ్ళిపోతాయి.",
            "hi": "संवहनी ऊतक बंद हो जाते हैं, पूरा पौधा सूख जाता है और फल सड़ जाते हैं।"
        },
        "immediate_actions": {
            "en": [
                "STRICT QUARANTINE: Do not move suckers, soil, or knives from this mat to other plants.",
                "Sterilize all cutting tools (machetes/hoes) with 20% household bleach or flame after every plant.",
                "Uproot and bury the entire infected mat on-site with agricultural lime; do NOT chop into waterways."
            ],
            "te": [
                "కఠిన నిబంధనలు: ఈ చెట్టు నుండి పిలకలు, మట్టి లేదా కత్తులను ఇతర చెట్లకు తీసుకెళ్లవద్దు.",
                "తోట పనిముట్లను బ్లీచింగ్ ద్రావణంలో లేదా నిప్పులో కాల్చి ఎప్పటికప్పుడు శుద్ధి చేయండి.",
                "వ్యాధి సోకిన చెట్టును మొదలుతో సహా తవ్వి సున్నం వేసి గుంతలో పాతిపెట్టండి."
            ],
            "hi": [
                "कड़ा नियंत्रण: संक्रमित पौधे से पुत्ती, मिट्टी या औजार अन्य पौधों में न ले जाएँ।",
                "उपकरणों को ब्लीच के घोल या आग से हर पौधे के बाद रोगाणुरहित करें।",
                "संक्रमित पौधे को जड़ सहित उखाड़कर चूने के साथ गड्ढे में दबाएँ।"
            ]
        },
        "preventive_care": {
            "en": [
                "Remove male buds (de-budding) immediately after bunch completion using a forked stick (not a knife) to prevent insect vector transmission.",
                "Source suckers only from officially certified wilt-free nurseries.",
                "Fence affected areas to prevent grazing animals from spreading bacteria."
            ],
            "te": [
                "కీటకాల ద్వారా వ్యాపించకుండా గెల పూర్తయిన వెంటనే మగ పూతను కత్తి లేకుండా కర్రతో విరిచి వేయండి.",
                "తెగులు లేని ధృవీకరించిన నర్సరీల నుండి మాత్రమే నాటడానికి పిలకలు సేకరించండి.",
                "జంతువులు తోటలోకి రాకుండా కంచె వేయండి."
            ],
            "hi": [
                "कीटों द्वारा फैलाव रोकने के लिए घौद बनने के बाद नर फूल को डंडे से तोड़ दें।",
                "केवल प्रमाणित नर्सरी से ही स्वस्थ पौध प्राप्त करें।",
                "पशुओं द्वारा फैलाव रोकने के लिए बाड़ लगाएँ।"
            ]
        },
        "reinspect_days": 2,
        "reinspect_text": {
            "en": "Scout neighboring plants within 24 to 48 hours for yellowing or premature fruit ripening.",
            "te": "పక్క చెట్లలో పసుపు రంగు లేదా కాయలు ముందుగానే పక్వానికి వస్తున్నాయా అని 24-48 గంటల్లో మళ్లీ తనిఖీ చేయండి.",
            "hi": "आसपास के पौधों की 24 से 48 घंटों में तुरंत जाँच करें।"
        },
        "seek_help_conditions": {
            "en": "MANDATORY EXTENSION ALERT: Immediately report suspect bacterial wilt to your District Agriculture/Horticulture Officer for official quarantine protocol.",
            "te": "తప్పనిసరి హెచ్చరిక: క్వారంటైన్ నిబంధనల ప్రకారం వెంటనే మీ జిల్లా ఉద్యానవన అధికారికి ఈ వ్యాధిని నివేదించండి.",
            "hi": "अनिवार्य सूचना: संगरोध प्रोटोकॉल के लिए तुरंत अपने जिला कृषि/उद्यान अधिकारी को सूचित करें।"
        },
        "chemical_advice": {
            "en": "There is NO chemical cure for bacterial wilt. Antibiotic or chemical sprays are ineffective. Rigorous eradication, sanitation, and tool sterilization are the only official containment methods.",
            "te": "బాక్టీరియల్ విల్ట్‌కు ఎటువంటి రసాయన మందులు పనిచేయవు. వ్యాధి సోకిన చెట్లను తొలగించడం మరియు పనిముట్లను శుద్ధి చేయడం మాత్రమే ఏకైక పరిష్కారం.",
            "hi": "जीवाणु उकठा के लिए कोई रासायनिक दवा काम नहीं करती। पौधों को नष्ट करना और औजारों को रोगाणुरहित करना ही एकमात्र उपाय है।"
        },
        "official_source": "FAO / ICAR-NRCB Banana Bacterial Wilt Containment & Quarantine Guidelines",
        "cultural_actions": [
            "Sterilize all cutting tools with bleach or flame.",
            "Uproot and bury infected mats with lime.",
            "De-bud with forked sticks to prevent insect transmission."
        ],
        "stage_guidance": {
            "early": {
                "en": "Early Stage: Petiole drooping and marginal yellowing. Immediately isolate mat and sterilize all cutting tools with bleach or fire.",
                "te": "ప్రారంభ దశ: ఆకు తొడిమలు వాలడం మరియు అంచులు పసుపుగా మారడం. వెంటనే ఆ చెట్టును వేరుచేయండి మరియు పనిముట్లను బ్లీచింగ్ లేదా నిప్పుతో శుద్ధి చేయండి.",
                "hi": "प्रारंभिक अवस्था: पत्ती के डंठल झुकना और किनारे पीले होना। तुरंत उस पौधे को अलग करें और औजारों को रोगाणुरहित करें।"
            },
            "moderate": {
                "en": "Moderate to Severe Stage: Canopy collapse, vascular browning, and premature bunch rotting. Uproot and bury the entire mat with lime. Strict quarantine.",
                "te": "మధ్యస్థం నుండి తీవ్ర దశ: చెట్టు పూర్తిగా వాలిపోవడం, గెలలు కుళ్ళడం. సున్నం వేసి చెట్టును మొదలుతో సహా గుంతలో పాతిపెట్టండి. కఠిన క్వారంటైన్ పాటించండి.",
                "hi": "मध्यम से गंभीर अवस्था: पौधा पूरी तरह मुरझाना, फल सड़ना। पूरे पौधे को जड़ से उखाड़कर चूने के साथ गड्ढे में दबाएँ। कड़ा संगरोध रखें।"
            },
            "severe": {
                "en": "Severe Stage: Canopy collapse, vascular browning, and premature bunch rotting. Uproot and bury the entire mat with lime. Strict quarantine.",
                "te": "తీవ్ర దశ: చెట్టు పూర్తిగా వాలిపోవడం, గెలలు కుళ్ళడం. సున్నం వేసి చెట్టును మొదలుతో సహా గుంతలో పాతిపెట్టండి. కఠిన క్వారంటైన్ పాటించండి.",
                "hi": "गंभीर अवस्था: पौधा पूरी तरह मुरझाना, फल सड़ना। पूरे पौधे को जड़ से उखाड़कर चूने के साथ गड्ढे में दबाएँ। कड़ा संगरोध रखें।"
            }
        }
    }
}
