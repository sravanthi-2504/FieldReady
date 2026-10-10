import { SupportedLanguage } from '../types';

export interface TranslationDictionary {
  app_title: string;
  app_subtitle: string;
  tagline: string;
  select_language: string;
  telugu: string;
  hindi: string;
  english: string;
  continue_btn: string;
  back_btn: string;
  cancel_btn: string;
  save_btn: string;
  retake_btn: string;
  confirm_btn: string;
  offline_badge: string;
  online_badge: string;
  synced_badge: string;
  pending_sync_badge: string;

  // Bottom Navigation
  nav_home: string;
  nav_inspect: string;
  nav_history: string;
  nav_weather: string;
  nav_sync: string;

  // Voice guide prompts
  voice_greeting: string;
  voice_home_prompt: string;
  voice_field_prompt: string;
  voice_crop_prompt: string;
  voice_capture_prompt: string;
  voice_quality_prompt: string;
  voice_crop_verify_prompt: string;
  voice_assessment_prompt: string;
  voice_questions_prompt: string;
  voice_guidance_prompt: string;
  voice_sampling_prompt: string;
  voice_saved_prompt: string;
  voice_repeat: string;
  voice_listening: string;
  voice_tap_to_speak: string;
  voice_stop: string;

  // Home actions
  action_check_health: string;
  action_my_fields: string;
  action_history: string;
  action_weather_sensors: string;
  action_offline_sync: string;
  action_settings: string;
  recent_inspection_heading: string;
  no_inspections_yet: string;

  // Fields
  fields_title: string;
  create_new_field: string;
  field_name_label: string;
  field_name_placeholder: string;
  acreage_label: string;
  crop_type_label: string;
  capture_gps_label: string;
  gps_captured: string;
  save_field_btn: string;
  select_this_field: string;
  no_fields_created: string;

  // Crops
  choose_crop_title: string;
  maize_title: string;
  maize_desc: string;
  banana_title: string;
  banana_desc: string;
  cotton_title: string;
  cotton_desc: string;
  supported_status: string;
  experimental_status: string;
  planned_status: string;
  crop_warning_unsupported: string;

  // Camera / Capture
  capture_title: string;
  camera_btn: string;
  gallery_btn: string;
  or_try_demo: string;
  demo_healthy: string;
  demo_rust: string;
  demo_blight: string;
  demo_spot: string;
  leaf_capture_hint: string;

  // Quality Gate
  quality_title: string;
  quality_passed: string;
  quality_failed: string;
  blur_check_label: string;
  lighting_check_label: string;
  dimensions_label: string;
  quality_advice: string;
  proceed_to_diagnosis: string;

  // Crop Verification
  crop_verify_title: string;
  crop_verify_question: string;
  crop_verify_confirm: string;
  crop_verify_switch: string;
  farmer_verification_notice: string;

  // Assessment
  assessment_title: string;
  prediction_label: string;
  confidence_label: string;
  uncertain_alert_title: string;
  uncertain_alert_desc: string;
  provenance_model_label: string;
  provenance_demo_label: string;
  probability_breakdown: string;
  differential_heading: string;
  differential_desc: string;
  ask_questions_btn: string;
  view_management_btn: string;

  // Questions
  questions_title: string;
  q1_title: string;
  q1_opt1: string;
  q1_opt2: string;
  q1_opt3: string;
  q2_title: string;
  q2_opt1: string;
  q2_opt2: string;
  q2_opt3: string;
  q3_title: string;
  q3_opt1: string;
  q3_opt2: string;
  q3_opt3: string;
  q4_title: string;
  q4_opt1: string;
  q4_opt2: string;
  q4_opt3: string;
  skip_questions: string;

  // Guidance
  guidance_title: string;
  cultural_practices_heading: string;
  chemical_safety_heading: string;
  chemical_disclaimer: string;
  official_source_label: string;
  record_field_sample_btn: string;

  // Sampling
  sampling_title: string;
  sampling_desc: string;
  sample_count_label: string;
  symptomatic_count_label: string;
  uncertain_count_label: string;
  sample_summary_format: string;
  notes_label: string;
  notes_placeholder: string;
  finish_inspection_btn: string;

  // History & Monitoring
  history_title: string;
  filter_all: string;
  revisit_field_btn: string;
  compare_visits_title: string;
  no_history_records: string;

  // Weather & Sensors
  weather_sensors_title: string;
  weather_section: string;
  sensor_section: string;
  temperature: string;
  humidity: string;
  rainfall: string;
  wind: string;
  weather_provenance_note: string;
  sensor_simulated_alert: string;

  // Offline & Sync
  offline_sync_title: string;
  device_storage_label: string;
  pending_records_count: string;
  sync_now_btn: string;
  clear_data_btn: string;
  clear_confirm_text: string;

  // Verified Pesticide & IDM Management
  pesticide_heading: string;
  pesticide_verified_badge: string;
  pesticide_withheld_badge: string;
  pesticide_healthy_badge: string;
  pesticide_statutory_warning: string;
  pesticide_dose_per_liter: string;
  pesticide_rate_per_acre: string;
  pesticide_phi: string;
  pesticide_rei: string;
  pesticide_ppe: string;
  pesticide_precautions: string;
  pesticide_source_label: string;

  // Lookalike Rust Differentiation
  lookalike_heading: string;
  lookalike_subheading: string;
  lookalike_common_rust: string;
  lookalike_southern_rust: string;
  lookalike_pustule_location: string;
  lookalike_pustule_morphology: string;
  lookalike_favorable_temp: string;
  lookalike_favorable_humidity: string;
  lookalike_rub_test: string;
  lookalike_model_status: string;

  // Multi-Leaf Plant Assessment
  plant_assessment_title: string;
  plant_total_leaves: string;
  plant_valid_leaves: string;
  plant_excluded_leaves: string;
  plant_consensus_title: string;
  plant_disagreement_alert: string;
  plant_leaf_num: string;
  plant_capture_add_leaf: string;
  plant_mode_single: string;
  plant_mode_multi: string;
  plant_assess_btn: string;
}


export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  te: {
    app_title: "ఫీల్డ్రెడీ",
    app_subtitle: "వాయిస్-గైడెడ్ పంట ఆరోగ్య ఇంటెలిజెన్స్",
    tagline: "సాక్ష్యం నుండి చర్య వరకు — ఆఫ్‌లైన్ రక్షణతో",
    select_language: "మీ ప్రాధాన్య భాషను ఎంచుకోండి",
    telugu: "తెలుగు",
    hindi: "हिन्दी",
    english: "English",
    continue_btn: "ముందుకు సాగండి",
    back_btn: "వెనుకకు",
    cancel_btn: "రద్దు చేయండి",
    save_btn: "సేవ్ చేయండి",
    retake_btn: "మళ్లీ ఫోటో తీయండి",
    confirm_btn: "నిర్ధారించండి",
    offline_badge: "ఆఫ్‌లైన్ మోడ్ (పరికరం)",
    online_badge: "ఆన్‌లైన్ కనెక్ట్ అయింది",
    synced_badge: "సర్వర్‌తో సింక్ అయింది",
    pending_sync_badge: "సింక్ కోసం వేచి ఉంది",
    nav_home: "హోమ్",
    nav_inspect: "తనిఖీ",
    nav_history: "చరిత్ర",
    nav_weather: "వాతావరణం",
    nav_sync: "సింక్",

    voice_greeting: "నమస్కారం! ఫీల్డ్రెడీకి స్వాగతం. మీ పంట ఆరోగ్యాన్ని పరిశీలించడానికి నేను మీకు ఒక్కో దశలో సహాయం చేస్తాను. ముందుగా మీ భాషను ఎంచుకోండి.",
    voice_home_prompt: "హోమ్ స్క్రీన్‌కు స్వాగతం. తనిఖీని ప్రారంభించడానికి ఆకుపచ్చ 'పంట ఆరోగ్యం తనిఖీ' బటన్‌పై నొక్కండి.",
    voice_field_prompt: "మీరు తనిఖీ చేయాలనుకుంటున్న పొలాన్ని ఎంచుకోవడానికి 'ఈ పొలాన్ని ఎంచుకోండి' ఆకుపచ్చ బటన్‌పై నొక్కండి, లేదా కొత్త పొలాన్ని నమోదు చేయండి.",
    voice_crop_prompt: "మీరు తనిఖీ చేయాలనుకుంటున్న పంట కార్డుపై నొక్కండి: మొక్కజొన్న లేదా అరటి. రెండింటికీ ధృవీకరించబడిన AI మోడల్ మద్దతు ఉంది.",
    voice_capture_prompt: "బాధిత ఆకు యొక్క స్పష్టమైన ఫోటోను కెమెరాతో తీయండి లేదా గ్యాలరీ నుండి ఎంచుకోండి.",
    voice_quality_prompt: "ఫోటో నాణ్యత తనిఖీ పూర్తయింది. ముందుకు సాగడానికి ఆకుపచ్చ 'ఈ ఫోటోతో కొనసాగించండి' బటన్‌పై నొక్కండి.",
    voice_crop_verify_prompt: "ఆకు లక్షణాలు పరిశీలించబడ్డాయి. కొనసాగడానికి ఆకుపచ్చ 'ధృవీకరించి కొనసాగించండి' బటన్‌పై నొక్కండి.",
    voice_assessment_prompt: "పంట ఆరోగ్య ఫలితం సిద్ధమైంది. వివరాలు వినండి లేదా పొలంలో నమూనాలను నమోదు చేయడానికి ఆకుపచ్చ 'పొలంలో నమూనాలను నమోదు చేయండి' బటన్‌పై నొక్కండి.",
    voice_questions_prompt: "మరింత ఖచ్చితమైన విశ్లేషణ కోసం ఈ చిన్న ప్రశ్నలకు సమాధానం ఇవ్వండి.",
    voice_guidance_prompt: "నిర్వహణ సూచనలు సిద్ధంగా ఉన్నాయి. విస్తృతిని నమోదు చేయడానికి ఆకుపచ్చ 'పొలంలో నమూనాలను నమోదు చేయండి' బటన్‌పై నొక్కండి.",
    voice_sampling_prompt: "మొక్కల సంఖ్యను నమోదు చేయండి. తనిఖీని ముగించడానికి ఆకుపచ్చ 'తనిఖీని ముగించండి & సేవ్ చేయండి' బటన్‌పై నొక్కండి.",
    voice_saved_prompt: "తనిఖీ విజయవంతంగా సేవ్ చేయబడింది. మీరు తదుపరి పర్యటనలో పోల్చవచ్చు.",
    voice_repeat: "మళ్లీ చెప్పండి",
    voice_listening: "వింటున్నాను... మాట్లాడండి",
    voice_tap_to_speak: "మాట్లాడటానికి నొక్కండి",
    voice_stop: "ఆపండి",

    action_check_health: "పంట ఆరోగ్యం తనిఖీ",
    action_my_fields: "నా పొలాలు",
    action_history: "తనిఖీల చరిత్ర",
    action_weather_sensors: "వాతావరణం & సెన్సార్లు",
    action_offline_sync: "ఆఫ్‌లైన్ & సింక్ స్థితి",
    action_settings: "సహాయం & సెట్టింగులు",
    recent_inspection_heading: "ఇటీవలి పొలం తనిఖీ",
    no_inspections_yet: "ఇంకా తనిఖీలు నమోదు కాలేదు. కొత్త తనిఖీని ప్రారంభించండి.",

    fields_title: "పొలాల నిర్వహణ",
    create_new_field: "కొత్త పొలాన్ని చేర్చండి",
    field_name_label: "పొలం పేరు / గురుతు",
    field_name_placeholder: "ఉదా: తూర్పు చేను మొక్కజొన్న",
    acreage_label: "విస్తీర్ణం (ఎకరాలు)",
    crop_type_label: "పంట",
    capture_gps_label: "పొలం GPS స్థానాన్ని గుర్తించండి",
    gps_captured: "GPS స్థానం గుర్తించబడింది",
    save_field_btn: "పొలాన్ని సేవ్ చేయండి",
    select_this_field: "ఈ పొలాన్ని ఎంచుకోండి",
    no_fields_created: "పొలాలు ఏవీ లేవు. దయచేసి ఒక పొలాన్ని జోడించండి.",

    choose_crop_title: "పంటను ఎంచుకోండి",
    maize_title: "మొక్కజొన్న (Maize)",
    maize_desc: "ఆరోగ్యవంతమైన ఆకు, కుంకుమ తెగులు, బ్లైట్, గ్రే లీఫ్ స్పాట్ — మోడల్ మద్దతు ఉంది",
    banana_title: "అరటి (Banana)",
    banana_desc: "ఆరోగ్యవంతమైన ఆకు, బ్లాక్ సిగటోకా, బాక్టీరియల్ విల్ట్ — మోడల్ మద్దతు ఉంది",
    cotton_title: "ప్రత్తి (Cotton)",
    cotton_desc: "విస్తరణకు సిద్ధంగా ఉంది — ఇంకా డయాగ్నస్టిక్ మోడల్ సర్టిఫై కాలేదు",
    supported_status: "మోడల్ ధృవీకరించబడింది",
    experimental_status: "పరిమిత డెమో మోడ్",
    planned_status: "రాబోయే ప్రణాళిక",
    crop_warning_unsupported: "ఈ పంటకు AI డయాగ్నస్టిక్స్ ఇంకా ధృవీకరించబడలేదు. తప్పుడు అంచనాలు నివారించడానికి తనిఖీ నిలిపివేయబడింది.",

    capture_title: "ఆకు ఫోటో తీయండి",
    camera_btn: "కెమెరాతో తీయండి",
    gallery_btn: "గ్యాలరీ నుండి ఎంచుకోండి",
    or_try_demo: "లేదా పరీక్ష కోసం శాంపిల్ ఆకును ప్రయత్నించండి:",
    demo_healthy: "ఆరోగ్యకరమైన ఆకు",
    demo_rust: "కుంకుమ తెగులు (Rust)",
    demo_blight: "ఆకు ఎండు (Blight)",
    demo_spot: "బూడిద మచ్చ (Spot)",
    leaf_capture_hint: "ఆకులోని మచ్చలు మధ్యలో ఉండేలా ఫోన్ స్థిరంగా పట్టుకోండి.",

    quality_title: "చిత్ర నాణ్యత తనిఖీ",
    quality_passed: "నాణ్యత బాగుంది — తనిఖీకి సిద్ధం",
    quality_failed: "ఫోటో స్పష్టత సరిపోదు — మళ్లీ తీయండి",
    blur_check_label: "స్పష్టత / మసక స్కోర్",
    lighting_check_label: "వెలుతురు స్థాయి",
    dimensions_label: "చిత్ర పరిమాణం",
    quality_advice: "స్పష్టమైన ఫలితాల కోసం వెలుతురులో కదలకుండా ఫోటో తీయండి.",
    proceed_to_diagnosis: "ఆరోగ్య నిర్ధారణకు వెళ్లండి",

    crop_verify_title: "పంట నిర్ధారణ",
    crop_verify_question: "ఈ ఫోటో ఎంచుకున్న పంట (మొక్కజొన్న)కు చెందినదేనా?",
    crop_verify_confirm: "అవును, ఇది మొక్కజొన్న ఆకు",
    crop_verify_switch: "కాదు, వేరే పంట మార్చండి",
    farmer_verification_notice: "గమనిక: రైతు నిర్ధారణ అనేది నేరుగా దృశ్య ధృవీకరణ కాదు. ఇది సరైన మోడల్‌ను వర్తింపజేయడానికి సహాయపడుతుంది.",

    assessment_title: "పంట ఆరోగ్య అంచనా",
    prediction_label: "గుర్తించిన పరిస్థితి",
    confidence_label: "మోడల్ విశ్వసనీయత",
    uncertain_alert_title: "అనిశ్చిత ఫలితం (హెచ్చరిక)",
    uncertain_alert_desc: "విశ్వసనీయత స్కోరు 65% కంటే తక్కువ ఉంది. దీనిని ఖచ్చితమైన నిర్ధారణగా భావించవద్దు.",
    provenance_model_label: "మొబైల్నెట్ V2 మోడల్ అంచనా (వాస్తవ అనుమితి)",
    provenance_demo_label: "పరీక్షా డెమో ఫలితం (మోడల్ అనుమితి కాదు)",
    probability_breakdown: "తరగతి సంభావ్యతల వివరాలు",
    differential_heading: "ఇతర ప్రత్యామ్నాయ కారణాలు (డిఫరెన్షియల్ డయాగ్నసిస్)",
    differential_desc: "ఈ లక్షణాలు వాతావరణం, ఎరువులు లేదా పోషకాల లోపం వల్ల కూడా రావచ్చు:",
    ask_questions_btn: "లక్షణాల సమాధానాలు ఇవ్వండి",
    view_management_btn: "నిర్వహణ సూచనలు చూడండి",

    questions_title: "లక్షణాల అదనపు ప్రశ్నలు",
    q1_title: "లక్షణాలు ఎప్పుడు కనిపించడం మొదలయ్యాయి?",
    q1_opt1: "గత 2-3 రోజులలో",
    q1_opt2: "గత వారం రోజులుగా",
    q1_opt3: "రెండు వారాలకు పైగా",
    q2_title: "ఇటీవల ఎరువులు లేదా పురుగుమందులు పిచికారీ చేశారా?",
    q2_opt1: "అవును, గత 3 రోజులలో",
    q2_opt2: "లేదు, చేయలేదు",
    q2_opt3: "గుర్తులేదు",
    q3_title: "ఇటీవల వాతావరణ పరిస్థితులు ఎలా ఉన్నాయి?",
    q3_opt1: "ఎక్కువ వర్షం / ఎక్కువ తేమ",
    q3_opt2: "తీవ్రమైన ఎండ / పొడి వాతావరణం",
    q3_opt3: "సాధారణ వాతావరణం",
    q4_title: "పక్కన ఉన్న ఇతర మొక్కలలో కూడా ఇవే మచ్చలు ఉన్నాయా?",
    q4_opt1: "అవును, చాలా మొక్కలలో ఉన్నాయి",
    q4_opt2: "లేదు, ఇక్కడొక్కటే ఉంది",
    q4_opt3: "ఇంకా పరిశీలించలేదు",
    skip_questions: "ప్రశ్నలను దాటవేసి ముందుకు వెళ్లండి",

    guidance_title: "సాక్ష్య ఆధారిత నిర్వహణ సూచనలు",
    cultural_practices_heading: "వ్యవసాయ పద్ధతులు మరియు యాజమాన్యం",
    chemical_safety_heading: "రసాయన మందుల భద్రతా హెచ్చరిక",
    chemical_disclaimer: "గమనిక: మోడల్ ఫలితం ఆధారంగా మాత్రమే రసాయన మందులను వాడవద్దు. మీ ప్రాంతీయ వ్యవసాయ అధికారి లేదా కేవీకే శాస్త్రవేత్తల అధికారిక సిఫార్సుల మేరకు మాత్రమే మందులను నిర్ణయించండి.",
    official_source_label: "ఆధారిత వనరు:",
    record_field_sample_btn: "పొలంలో మొక్కల సంఖ్యను నమోదు చేయండి",

    sampling_title: "పొలం శాంప్లింగ్ రికార్డు",
    sampling_desc: "ఒకే మొక్క ఆధారంగా కాకుండా పొలంలో వేర్వేరు ప్రాంతాల్లో నమూనాలు తీయండి.",
    sample_count_label: "పరిశీలించిన మొత్తం మొక్కల సంఖ్య",
    symptomatic_count_label: "లక్షణాలు కనిపించిన మొక్కలు",
    uncertain_count_label: "సందేహాస్పదంగా ఉన్న మొక్కలు",
    sample_summary_format: "పరిశీలించిన {total} మొక్కలలో {symptomatic} మొక్కలలో లక్షణాలు కనిపించాయి",
    notes_label: "రైతు గమనికలు",
    notes_placeholder: "ఉదా: కాలువ దగ్గర ఉన్న మొక్కలలో ఎక్కువ మచ్చలు ఉన్నాయి...",
    finish_inspection_btn: "తనిఖీని సేవ్ చేసి ముగించండి",

    history_title: "తనిఖీల చరిత్ర మరియు పర్యవేక్షణ",
    filter_all: "అన్ని పొలాలు",
    revisit_field_btn: "మళ్లీ సందర్శించండి",
    compare_visits_title: "కాలక్రమానుసార పర్యటనల పోలిక",
    no_history_records: "తనిఖీ రికార్డులు ఏవీ లేవు.",

    weather_sensors_title: "వాతావరణం మరియు సెన్సార్ సమాచారం",
    weather_section: "బాహ్య వాతావరణ సమాచారం (ఓపెన్-మెటియో)",
    sensor_section: "పొలం సెన్సార్ రీడింగ్‌లు",
    temperature: "ఉష్ణోగ్రత",
    humidity: "గాలిలో తేమ",
    rainfall: "వర్షపాతం",
    wind: "గాలి వేగం",
    weather_provenance_note: "ఈ సమాచారం ప్రాంతీయ వాతావరణ అంచనా మాత్రమే; నేల తేమ లేదా ఆకు తేమ కొలత కాదు.",
    sensor_simulated_alert: "డెమో ప్రదర్శన సమాచారం — ఇది వాస్తవ సెన్సార్ కొలత కాదు.",

    offline_sync_title: "ఆఫ్‌లైన్ నిల్వ & సర్వర్ సింక్",
    device_storage_label: "పరికరం లోకల్ స్టోరేజ్ (IndexedDB)",
    pending_records_count: "సింక్ కావలసిన రికార్డులు",
    sync_now_btn: "ఇప్పుడే సర్వర్‌తో సింక్ చేయండి",
    clear_data_btn: "డేటాను క్లియర్ చేయండి",
    clear_confirm_text: "మీ పరికరంలోని సేవ్ చేసిన అన్ని రికార్డులు తొలగించబడతాయి. కొనసాగించాలా?",

    pesticide_heading: "ధృవీకరించబడిన సస్యరక్షణ మార్గదర్శకాలు (CIBRC / ICAR-IIMR)",
    pesticide_verified_badge: "CIBRC రిజిస్టర్డ్",
    pesticide_withheld_badge: "రసాయనాలు నిలిపివేయబడ్డాయి (అనిశ్చిత ఫలితం)",
    pesticide_healthy_badge: "రసాయన మందులు అవసరం లేదు",
    pesticide_statutory_warning: "చట్టబద్ధమైన హెచ్చరిక: లేబుల్ సూచనల ప్రకారం మాత్రమే రసాయనాలు వాడాలి. సరైన రక్షణ దుస్తులు (PPE) ధరించండి మరియు రక్షిత కాలపరిమితి (PHI) పాటించండి.",
    pesticide_dose_per_liter: "లీటరు నీటికి మోతాదు:",
    pesticide_rate_per_acre: "ఎకరానికి మోతాదు:",
    pesticide_phi: "కోతకు ముందు నిరీక్షణ సమయం (PHI):",
    pesticide_rei: "తిరిగి పొలంలోకి ప్రవేశించే సమయం (REI):",
    pesticide_ppe: "వ్యక్తిగత రక్షణ పరికరాలు (PPE):",
    pesticide_precautions: "పర్యావరణ జాగ్రత్తలు:",
    pesticide_source_label: "ధృవీకరణ అధికారం:",

    lookalike_heading: "కుంకుమ తెగుళ్ల తేడాలు: కామన్ రస్ట్ వర్సెస్ సదరన్ రస్ట్",
    lookalike_subheading: "ఆకు లక్షణాలు మరియు వాతావరణ ఆధారంగా పోలిక",
    lookalike_common_rust: "సాధారణ కుంకుమ తెగులు (Puccinia sorghi)",
    lookalike_southern_rust: "సదరన్ రస్ట్ (Puccinia polysora)",
    lookalike_pustule_location: "మచ్చల ప్రదేశం:",
    lookalike_pustule_morphology: "మచ్చల ఆకారం & రంగు:",
    lookalike_favorable_temp: "అనుకూల ఉష్ణోగ్రత:",
    lookalike_favorable_humidity: "తేమ అవసరం:",
    lookalike_rub_test: "చేతి పరీక్ష (Rub Test): ఆకుపై వేలితో తుడిస్తే పొడి రాలితే కామన్ రస్ట్.",
    lookalike_model_status: "మోడల్ స్థితి: ప్రస్తుత చెక్‌పాయింట్ 4 తరగతులపై శిక్షణ పొందింది; సదరన్ రస్ట్ ప్రమాణాలు ICAR విస్తరణ మార్గదర్శకాల ఆధారంగా అందించబడ్డాయి.",

    plant_assessment_title: "మొత్తం మొక్క సమగ్ర అంచనా (మల్టీ-లీఫ్)",
    plant_total_leaves: "సమర్పించిన మొత్తం ఆకులు:",
    plant_valid_leaves: "విశ్లేషించిన సరైన ఆకులు:",
    plant_excluded_leaves: "తిరస్కరించబడిన ఆకులు:",
    plant_consensus_title: "మొక్క స్థాయి ఏకాభిప్రాయ నిర్ధారణ:",
    plant_disagreement_alert: "హెచ్చరిక: ఆకుల మధ్య లక్షణాల తేడా ఉంది! వివిధ ఆకులు వేర్వేరు వ్యాధులను సూచిస్తున్నాయి.",
    plant_leaf_num: "ఆకు",
    plant_capture_add_leaf: "ఈ మొక్క నుండి మరొక ఆకు జోడించండి (+)",
    plant_mode_single: "ఒకే ఆకు తనిఖీ",
    plant_mode_multi: "మొక్క సమగ్ర తనిఖీ (బహుళ ఆకులు)",
    plant_assess_btn: "మొక్క ఆరోగ్యాన్ని అంచనా వేయండి"
  },

  hi: {
    app_title: "फील्डरेडी",
    app_subtitle: "आवाज़-निर्देशित फसल स्वास्थ्य आसूचना",
    tagline: "साक्ष्य से कार्यवाही तक — ऑफ़लाइन सुरक्षा के साथ",
    select_language: "अपनी पसंदीदा भाषा चुनें",
    telugu: "తెలుగు",
    hindi: "हिन्दी",
    english: "English",
    continue_btn: "आगे बढ़ें",
    back_btn: "पीछे जाएं",
    cancel_btn: "रद्द करें",
    save_btn: "सुरक्षित करें",
    retake_btn: "दोबारा फोटो लें",
    confirm_btn: "पुष्टि करें",
    offline_badge: "ऑफ़लाइन मोड (डिवाइस)",
    online_badge: "ऑनलाइन कनेक्टेड",
    synced_badge: "सर्वर से सिंक हो गया",
    pending_sync_badge: "सिंक की प्रतीक्षा में",
    nav_home: "होम",
    nav_inspect: "निरीक्षण",
    nav_history: "इतिहास",
    nav_weather: "मौसम",
    nav_sync: "सिंक",

    voice_greeting: "नमस्ते! फील्डरेडी में आपका स्वागत है। मैं आपकी फसल की जाँच में एक-एक कदम पर मदद करूँगा। सबसे पहले अपनी भाषा चुनें।",
    voice_home_prompt: "होम स्क्रीन पर आपका स्वागत है। जाँच शुरू करने के लिए हरे 'फसल स्वास्थ्य जाँचें' बटन पर दबाएँ।",
    voice_field_prompt: "जिस खेत का निरीक्षण करना है उसे चुनने के लिए 'इस खेत को चुनें' हरे बटन पर दबाएँ, या नया खेत जोड़ें।",
    voice_crop_prompt: "जिस फसल की जाँच करनी है उस कार्ड पर दबाएँ: मक्का या केला। दोनों के लिए प्रमाणित AI मॉडल उपलब्ध है।",
    voice_capture_prompt: "प्रभावित पत्ती की स्पष्ट तस्वीर कैमरे से लें या गैलरी से चुनें।",
    voice_quality_prompt: "फोटो की गुणवत्ता जाँची गई। आगे बढ़ने के लिए हरे 'इस फोटो के साथ आगे बढ़ें' बटन पर दबाएँ।",
    voice_crop_verify_prompt: "पत्ती के लक्षणों की पुष्टि हुई। जारी रखने के लिए हरे 'पुष्टि करें और आगे बढ़ें' बटन पर दबाएँ।",
    voice_assessment_prompt: "फसल जाँच परिणाम तैयार है। रिपोर्ट सुनें या खेत में नमूने दर्ज करने के लिए हरे 'खेत नमूने दर्ज करें' बटन पर दबाएँ।",
    voice_questions_prompt: "बेहतर समझ के लिए इन छोटे सवालों के जवाब दें।",
    voice_guidance_prompt: "प्रबंधन सलाह तैयार है। खेत में फैलाव दर्ज करने के लिए हरे 'खेत नमूने दर्ज करें' बटन पर दबाएँ।",
    voice_sampling_prompt: "जाँचे गए पौधों की संख्या दर्ज करें। समाप्त करने के लिए हरे 'निरीक्षण पूरा करें और सहेजें' बटन पर दबाएँ।",
    voice_saved_prompt: "निरीक्षण सफलतापूर्वक सुरक्षित हो गया। आप अगली यात्रा में इसकी तुलना कर सकते हैं।",
    voice_repeat: "दोहराएँ",
    voice_listening: "सुन रहा हूँ... बोलिए",
    voice_tap_to_speak: "बोलने के लिए दबाएँ",
    voice_stop: "रोकें",

    action_check_health: "फसल स्वास्थ्य जाँचें",
    action_my_fields: "मेरे खेत",
    action_history: "निरीक्षण इतिहास",
    action_weather_sensors: "मौसम एवं सेंसर",
    action_offline_sync: "ऑफ़लाइन एवं सिंक स्थिति",
    action_settings: "मदद एवं सेटिंग्स",
    recent_inspection_heading: "हालिया खेत निरीक्षण",
    no_inspections_yet: "अभी तक कोई निरीक्षण दर्ज नहीं हुआ। नया निरीक्षण शुरू करें।",

    fields_title: "खेत प्रबंधन",
    create_new_field: "नया खेत जोड़ें",
    field_name_label: "खेत का नाम / पहचान",
    field_name_placeholder: "उदा: पूरब वाला मक्का खेत",
    acreage_label: "क्षेत्रफल (एकड़)",
    crop_type_label: "फसल",
    capture_gps_label: "खेत की GPS स्थिति प्राप्त करें",
    gps_captured: "GPS स्थिति प्राप्त हो गई",
    save_field_btn: "खेत सुरक्षित करें",
    select_this_field: "इस खेत को चुनें",
    no_fields_created: "कोई खेत दर्ज नहीं है। कृपया एक खेत जोड़ें।",

    choose_crop_title: "फसल का चयन करें",
    maize_title: "मक्का (Corn / Maize)",
    maize_desc: "स्वस्थ पत्ती, रतुआ (Rust), झुलसा (Blight), धब्बा (Spot) — मॉडल समर्थित",
    banana_title: "केला (Banana)",
    banana_desc: "स्वस्थ पत्ती, ब्लैक सिगाटोका, बैक्टीरियल विल्ट — मॉडल समर्थित",
    cotton_title: "कपास (Cotton)",
    cotton_desc: "भविष्य के विस्तार हेतु — अभी नैदानिक मॉडल प्रमाणित नहीं",
    supported_status: "मॉडल सत्यापित",
    experimental_status: "सीमित डेमो मोड",
    planned_status: "आगामी योजना",
    crop_warning_unsupported: "इस फसल के लिए AI निदान अभी प्रमाणित नहीं है। गलत अनुमान से बचने के लिए जाँच रोक दी गई है।",

    capture_title: "पत्ती की फोटो लें",
    camera_btn: "कैमरा खोलें",
    gallery_btn: "गैलरी से चुनें",
    or_try_demo: "या परीक्षण के लिए नमूना पत्ती आजमाएँ:",
    demo_healthy: "स्वस्थ पत्ती",
    demo_rust: "कॉमन रस्ट (रतुआ)",
    demo_blight: "लीफ ब्लाइट (झुलसा)",
    demo_spot: "ग्रे लीफ स्पॉट",
    leaf_capture_hint: "पत्ती के धब्बों को बीच में रखते हुए फोन स्थिर पकड़ें।",

    quality_title: "फोटो गुणवत्ता परीक्षण",
    quality_passed: "गुणवत्ता अच्छी है — जाँच के लिए तैयार",
    quality_failed: "फोटो साफ़ नहीं है — दोबारा लें",
    blur_check_label: "धुंधलापन (Blur) स्कोर",
    lighting_check_label: "रोशनी स्तर",
    dimensions_label: "फोटो का आकार",
    quality_advice: "सटीक परिणाम के लिए अच्छी रोशनी में स्थिर हाथ से फोटो लें।",
    proceed_to_diagnosis: "स्वास्थ्य निदान पर जाएँ",

    crop_verify_title: "फसल सत्यापन",
    crop_verify_question: "क्या यह फोटो चुनी गई फसल (मक्का) की ही है?",
    crop_verify_confirm: "हाँ, यह मक्के की पत्ती है",
    crop_verify_switch: "नहीं, फसल बदलें",
    farmer_verification_notice: "सूचना: किसान द्वारा पुष्टि कोई स्वचालित दृश्य सत्यापन नहीं है। यह सही मॉडल लागू करने में मदद करती है।",

    assessment_title: "फसल स्वास्थ्य परिणाम",
    prediction_label: "पहचानी गई स्थिति",
    confidence_label: "मॉडल का विश्वास स्तर",
    uncertain_alert_title: "अनिश्चित परिणाम (सावधानी)",
    uncertain_alert_desc: "विश्वास स्तर 65% से कम है। इसे पक्का रोग न मानें। विशेषज्ञ से सलाह लें।",
    provenance_model_label: "MobileNetV2 मॉडल अनुमान (वास्तविक इन्फरेंस)",
    provenance_demo_label: "परीक्षण डेमो परिणाम (वास्तविक मॉडल नहीं)",
    probability_breakdown: "संभाव्यता का विवरण",
    differential_heading: "अन्य संभावित कारण (डिफरेंशियल डायग्नोसिस)",
    differential_desc: "ये लक्षण मौसम, खाद या पानी के तनाव से भी हो सकते हैं:",
    ask_questions_btn: "लक्षण प्रश्नों के उत्तर दें",
    view_management_btn: "प्रबंधन सलाह देखें",

    questions_title: "लक्षण संबंधी अतिरिक्त सवाल",
    q1_title: "लक्षण कब दिखना शुरू हुए?",
    q1_opt1: "पिछले 2-3 दिनों में",
    q1_opt2: "पिछले एक सप्ताह से",
    q1_opt3: "दो सप्ताह से अधिक",
    q2_title: "क्या हाल ही में कीटनाशक या खाद का छिड़काव किया था?",
    q2_opt1: "हाँ, पिछले 3 दिनों में",
    q2_opt2: "नहीं, नहीं किया",
    q2_opt3: "याद नहीं",
    q3_title: "हाल का मौसम कैसा रहा है?",
    q3_opt1: "अधिक बारिश / बहुत उमस",
    q3_opt2: "कड़क धूप / सूखा",
    q3_opt3: "सामान्य मौसम",
    q4_title: "क्या आसपास के पौधों में भी ऐसे ही लक्षण हैं?",
    q4_opt1: "हाँ, कई पौधों में दिख रहे हैं",
    q4_opt2: "नहीं, सिर्फ इसी पौधे पर हैं",
    q4_opt3: "अभी जाँचा नहीं है",
    skip_questions: "सवाल छोड़कर आगे बढ़ें",

    guidance_title: "साक्ष्य-आधारित प्रबंधन मार्गदर्शन",
    cultural_practices_heading: "कृषि कार्य एवं स्वच्छता उपाय",
    chemical_safety_heading: "रासायनिक दवा सुरक्षा चेतावनी",
    chemical_disclaimer: "ध्यान दें: केवल मॉडल परिणाम देखकर कीटनाशक न छिड़कें। दवा का चुनाव स्थानीय कृषि अधिकारी या केवीके की आधिकारिक सलाह के आधार पर ही करें।",
    official_source_label: "आधिकारिक स्रोत:",
    record_field_sample_btn: "खेत में पौधों का नमूना दर्ज करें",

    sampling_title: "खेत सैंपलिंग रिकॉर्ड",
    sampling_desc: "केवल एक पौधे के बजाय खेत के अलग-अलग हिस्सों से पौधे जाँचें।",
    sample_count_label: "जाँचे गए कुल पौधों की संख्या",
    symptomatic_count_label: "लक्षण दिखने वाले पौधे",
    uncertain_count_label: "संदेहास्पद पौधे",
    sample_summary_format: "जाँचे गए {total} पौधों में से {symptomatic} में लक्षण पाए गए",
    notes_label: "किसान की टिप्पणी",
    notes_placeholder: "उदा: नाली के पास वाले पौधों में ज्यादा धब्बे हैं...",
    finish_inspection_btn: "निरीक्षण सुरक्षित करें और समाप्त करें",

    history_title: "निरीक्षण इतिहास एवं निगरानी",
    filter_all: "सभी खेत",
    revisit_field_btn: "दोबारा जाएँ",
    compare_visits_title: "समय अनुसार यात्राओं की तुलना",
    no_history_records: "कोई पिछला रिकॉर्ड नहीं मिला।",

    weather_sensors_title: "मौसम एवं सेंसर संदर्भ",
    weather_section: "बाहरी मौसम डेटा (Open-Meteo)",
    sensor_section: "खेत सेंसर टेलीमेट्री",
    temperature: "तापमान",
    humidity: "सापेक्ष आर्द्रता",
    rainfall: "वर्षा",
    wind: "हवा की गति",
    weather_provenance_note: "यह डेटा केवल क्षेत्रीय मौसम अनुमान है; पत्ती या मिट्टी की प्रत्यक्ष माप नहीं।",
    sensor_simulated_alert: "सिम्युलेटेड डेमो डेटा — यह वास्तविक सेंसर रीडिंग नहीं है।",

    offline_sync_title: "ऑफ़लाइन संग्रहण एवं सिंक",
    device_storage_label: "डिवाइस लोकल स्टोरेज (IndexedDB)",
    pending_records_count: "सिंक होने बाकी रिकॉर्ड",
    sync_now_btn: "अभी सर्वर से सिंक करें",
    clear_data_btn: "डेटा साफ़ करें",
    clear_confirm_text: "डिवाइस में सुरक्षित सभी रिकॉर्ड हट जाएँगे। क्या आप जारी रखना चाहते हैं?",

    pesticide_heading: "सत्यापित पौध संरक्षण दिशानिर्देश (CIBRC / ICAR-IIMR)",
    pesticide_verified_badge: "CIBRC पंजीकृत",
    pesticide_withheld_badge: "दवाएं रोकी गईं (अनिश्चित परिणाम)",
    pesticide_healthy_badge: "रासायनिक उपचार की आवश्यकता नहीं",
    pesticide_statutory_warning: "वैधानिक चेतावनी: केवल आधिकारिक उत्पाद लेबल के अनुसार ही रसायन का प्रयोग करें। सुरक्षा उपकरण (PPE) पहनें और प्रतीक्षा अवधि (PHI) का पालन करें।",
    pesticide_dose_per_liter: "प्रति लीटर पानी में मात्रा:",
    pesticide_rate_per_acre: "प्रति एकड़ मात्रा:",
    pesticide_phi: "तुड़ाई पूर्व प्रतीक्षा अवधि (PHI):",
    pesticide_rei: "पुनः प्रवेश समय (REI):",
    pesticide_ppe: "सुरक्षा उपकरण (PPE):",
    pesticide_precautions: "पर्यावरणीय सावधानियां:",
    pesticide_source_label: "सत्यापन प्राधिकरण:",

    lookalike_heading: "रतुआ अंतर: कॉमन रस्ट बनाम सदर्न रस्ट",
    lookalike_subheading: "पत्ती लक्षणों एवं मौसम के आधार पर तुलना",
    lookalike_common_rust: "सामान्य रतुआ (Puccinia sorghi)",
    lookalike_southern_rust: "दक्षिणी रतुआ (Puccinia polysora)",
    lookalike_pustule_location: "फफोले की स्थिति:",
    lookalike_pustule_morphology: "फफोले का आकार व रंग:",
    lookalike_favorable_temp: "अनुकूल तापमान:",
    lookalike_favorable_humidity: "आर्द्रता आवश्यकता:",
    lookalike_rub_test: "उंगली से पोंछने का परीक्षण: उंगली पर पाउडर छूटे तो कॉमन रस्ट।",
    lookalike_model_status: "मॉडल स्थिति: वर्तमान मॉडल 4 वर्गों पर प्रशिक्षित है; सदर्न रस्ट मानदंड ICAR विस्तार दिशानिर्देशों द्वारा प्रदान किए गए हैं।",

    plant_assessment_title: "पौधे का समग्र मूल्यांकन (मल्टी-लीफ)",
    plant_total_leaves: "कुल जांची गई पत्तियां:",
    plant_valid_leaves: "सत्यापित पत्तियां:",
    plant_excluded_leaves: "अस्वीकृत पत्तियां:",
    plant_consensus_title: "पौधा स्तर आम सहमति निदान:",
    plant_disagreement_alert: "चेतावनी: पत्तियों में लक्षणों का अंतर है! विभिन्न पत्तियां अलग-अलग रोग दर्शा रही हैं।",
    plant_leaf_num: "पत्ती",
    plant_capture_add_leaf: "इस पौधे की अन्य पत्ती जोड़ें (+)",
    plant_mode_single: "एकल पत्ती जांच",
    plant_mode_multi: "पौधा समग्र जांच (एकाधिक पत्तियां)",
    plant_assess_btn: "पौधे का समग्र स्वास्थ्य आंकें"
  },

  en: {
    app_title: "FieldReady",
    app_subtitle: "Voice-Guided Crop Health Intelligence",
    tagline: "Evidence-to-Action — Offline-First Resilience",
    select_language: "Select Your Preferred Language",
    telugu: "తెలుగు",
    hindi: "हिन्दी",
    english: "English",
    continue_btn: "Continue",
    back_btn: "Back",
    cancel_btn: "Cancel",
    save_btn: "Save",
    retake_btn: "Retake Photo",
    confirm_btn: "Confirm",
    offline_badge: "Offline Mode (Local)",
    online_badge: "Online Connected",
    synced_badge: "Synced to Server",
    pending_sync_badge: "Waiting to Sync",
    nav_home: "Home",
    nav_inspect: "Inspect",
    nav_history: "History",
    nav_weather: "Weather",
    nav_sync: "Sync",

    voice_greeting: "Welcome to AgriRhythm FieldReady. I will guide you step by step to inspect your crop health. First, please select your language.",
    voice_home_prompt: "Welcome to the home dashboard. Tap the green 'Check Crop Health' button to start an inspection.",
    voice_field_prompt: "Select your target field by tapping the green 'Select This Field: {name} & Continue' button, or register a new field.",
    voice_crop_prompt: "Tap the crop you are inspecting: Maize or Banana. Both are supported by genuine MobileNetV2 models.",
    voice_capture_prompt: "Take a steady photo of the affected leaf or select an image from your gallery.",
    voice_quality_prompt: "Image quality evaluation is complete. Tap the green 'Proceed with this Photo' button to continue.",
    voice_crop_verify_prompt: "Botanical leaf features verified. Tap the green 'Confirm & Continue' button to proceed to diagnosis.",
    voice_assessment_prompt: "Crop health assessment is ready. Listen to the report, then tap the green 'Record Field Sampling' button to record prevalence.",
    voice_questions_prompt: "Answer these short optional questions to refine symptom context.",
    voice_guidance_prompt: "Management guidance is ready. Tap the green 'Record Field Sampling' button to record prevalence.",
    voice_sampling_prompt: "Record the number of plants inspected across different field spots. Tap the green 'Finish & Save Inspection' button to complete.",
    voice_saved_prompt: "Inspection saved successfully to your device. You can revisit and compare over time.",
    voice_repeat: "Repeat",
    voice_listening: "Listening... speak now",
    voice_tap_to_speak: "Tap to Speak",
    voice_stop: "Stop",

    action_check_health: "Check Crop Health",
    action_my_fields: "My Fields",
    action_history: "Inspection History",
    action_weather_sensors: "Weather & Sensors",
    action_offline_sync: "Offline & Sync Status",
    action_settings: "Help & Settings",
    recent_inspection_heading: "Recent Field Inspection",
    no_inspections_yet: "No inspections recorded yet. Start a new crop health inspection.",

    fields_title: "Field Management",
    create_new_field: "Create New Field",
    field_name_label: "Field Name / Plot ID",
    field_name_placeholder: "e.g. North Plot Maize",
    acreage_label: "Acreage (Acres)",
    crop_type_label: "Crop",
    capture_gps_label: "Capture Field GPS Coordinates",
    gps_captured: "GPS Coordinates Captured",
    save_field_btn: "Save Field",
    select_this_field: "Select This Field",
    no_fields_created: "No fields created yet. Please create a field.",

    choose_crop_title: "Select Crop",
    maize_title: "Maize (Corn)",
    maize_desc: "Healthy, Common Rust, Leaf Blight, Gray Leaf Spot — Model-Supported",
    banana_title: "Banana",
    banana_desc: "Healthy, Black Sigatoka, Bacterial Wilt — MobileNetV2 Supported",
    cotton_title: "Cotton",
    cotton_desc: "Extension-Ready Architecture — Not Certified for AI Diagnosis",
    supported_status: "Model Verified",
    experimental_status: "Limited Demo Mode",
    planned_status: "Extension-Ready",
    crop_warning_unsupported: "AI diagnostics are not yet verified for this crop. Diagnosis halted to avoid false guidance.",

    capture_title: "Capture Leaf Photograph",
    camera_btn: "Open Camera",
    gallery_btn: "Choose from Gallery",
    or_try_demo: "Or test with a verified sample leaf:",
    demo_healthy: "Healthy Leaf",
    demo_rust: "Common Rust",
    demo_blight: "Leaf Blight",
    demo_spot: "Gray Leaf Spot",
    leaf_capture_hint: "Hold steady, keep the symptomatic lesion centered in good daylight.",

    quality_title: "Image Quality Gate",
    quality_passed: "Photo Quality Good — Ready for Assessment",
    quality_failed: "Photo Quality Insufficient — Retake Recommended",
    blur_check_label: "Sharpness / Blur Variance",
    lighting_check_label: "Luminance Level",
    dimensions_label: "Resolution",
    quality_advice: "For accurate results, hold steady in daylight and avoid blurry motion.",
    proceed_to_diagnosis: "Proceed to Health Assessment",

    crop_verify_title: "Crop Verification",
    crop_verify_question: "Does this photograph belong to the selected crop (Maize)?",
    crop_verify_confirm: "Yes, this is a Maize leaf",
    crop_verify_switch: "No, switch crop",
    farmer_verification_notice: "Notice: Farmer confirmation is an operational check, not an automated botanical verification. It ensures the correct crop model is applied.",

    assessment_title: "Crop Health Assessment",
    prediction_label: "Predicted Condition",
    confidence_label: "Model Confidence",
    uncertain_alert_title: "Inconclusive Result (Caution)",
    uncertain_alert_desc: "Confidence is below 65%. Visual evidence is inconclusive. Do not treat as confirmed disease.",
    provenance_model_label: "MobileNetV2 Model Inference (Genuine)",
    provenance_demo_label: "Demonstration Result (Workflow Demo)",
    probability_breakdown: "Class Probability Distribution",
    differential_heading: "Alternative Differential Causes",
    differential_desc: "Similar visual symptoms may be caused by abiotic factors or look-alike conditions:",
    ask_questions_btn: "Answer Symptom Questions",
    view_management_btn: "View Management Guidance",

    questions_title: "Differential Symptom Questions",
    q1_title: "When did leaf symptoms first appear?",
    q1_opt1: "In the last 2-3 days",
    q1_opt2: "About a week ago",
    q1_opt3: "More than two weeks ago",
    q2_title: "Did you recently apply pesticide, herbicide, or fertilizer?",
    q2_opt1: "Yes, in the last 3 days",
    q2_opt2: "No recent spray",
    q2_opt3: "Not sure",
    q3_title: "What has recent field weather been like?",
    q3_opt1: "Prolonged rain / high humidity",
    q3_opt2: "Intense heat / prolonged dry spell",
    q3_opt3: "Normal moderate weather",
    q4_title: "Are neighboring plants showing similar symptoms?",
    q4_opt1: "Yes, widespread across plot",
    q4_opt2: "No, isolated to few plants",
    q4_opt3: "Not yet checked",
    skip_questions: "Skip Questions & Proceed",

    guidance_title: "Evidence-to-Action Management Guidance",
    cultural_practices_heading: "Agronomic & Cultural Practices",
    chemical_safety_heading: "Chemical Safety Disclaimer",
    chemical_disclaimer: "Caution: Never spray chemical pesticides solely based on an AI model result. Chemical selection requires confirmation with your local Agricultural Extension Officer or registered product label.",
    official_source_label: "Official Source:",
    record_field_sample_btn: "Record Field Inspection Sample",

    sampling_title: "Field Sampling & Monitoring",
    sampling_desc: "Inspect multiple locations across the field rather than only the most affected leaf.",
    sample_count_label: "Total Plants Inspected in Sample",
    symptomatic_count_label: "Plants Showing Symptoms",
    uncertain_count_label: "Uncertain / Ambiguous Plants",
    sample_summary_format: "{symptomatic} of {total} inspected plants showed symptoms in this sample",
    notes_label: "Field Observations & Notes",
    notes_placeholder: "e.g. Higher incidence near low drainage area...",
    finish_inspection_btn: "Save Inspection Record",

    history_title: "Inspection History & Monitoring",
    filter_all: "All Fields",
    revisit_field_btn: "Revisit Field",
    compare_visits_title: "Chronological Visit Comparison",
    no_history_records: "No inspection visits recorded yet.",

    weather_sensors_title: "Weather & Sensor Context",
    weather_section: "External Weather (Open-Meteo API)",
    sensor_section: "Field Sensor Telemetry",
    temperature: "Temperature",
    humidity: "Relative Humidity",
    rainfall: "Precipitation",
    wind: "Wind Speed",
    weather_provenance_note: "Regional atmospheric weather estimate. Not an in-situ leaf wetness or soil moisture sensor reading.",
    sensor_simulated_alert: "SIMULATED DEMO DATA — NOT A REAL SENSOR MEASUREMENT.",

    offline_sync_title: "Offline Storage & Cloud Sync",
    device_storage_label: "Device Local Storage (IndexedDB)",
    pending_records_count: "Pending Records Awaiting Sync",
    sync_now_btn: "Sync to Server Now",
    clear_data_btn: "Reset Local Storage",
    clear_confirm_text: "All local field and inspection records will be erased. Are you sure?",

    pesticide_heading: "Verified Disease & Pesticide Management (CIBRC / ICAR-IIMR)",
    pesticide_verified_badge: "CIBRC Registered",
    pesticide_withheld_badge: "Chemicals Withheld (Uncertain Diagnosis)",
    pesticide_healthy_badge: "No Pesticide Required",
    pesticide_statutory_warning: "Statutory Warning: Chemical recommendations are derived strictly from CIBRC registered labels and ICAR-IIMR protocols. Read product label before use. Follow exact PPE and disposal instructions.",
    pesticide_dose_per_liter: "Dose per Liter:",
    pesticide_rate_per_acre: "Rate per Acre:",
    pesticide_phi: "Pre-Harvest Interval (PHI):",
    pesticide_rei: "Re-Entry Interval (REI):",
    pesticide_ppe: "Required PPE:",
    pesticide_precautions: "Environmental Precautions:",
    pesticide_source_label: "Verification Authority:",

    lookalike_heading: "Maize Rust Differential: Common Rust vs. Southern Rust",
    lookalike_subheading: "Side-by-side morphological & epidemiological diagnostic criteria",
    lookalike_common_rust: "Common Rust (Puccinia sorghi)",
    lookalike_southern_rust: "Southern Rust (Puccinia polysora)",
    lookalike_pustule_location: "Pustule Distribution:",
    lookalike_pustule_morphology: "Morphology & Color:",
    lookalike_favorable_temp: "Favorable Temperature:",
    lookalike_favorable_humidity: "Humidity / Wetness:",
    lookalike_rub_test: "Field Rub Test: Pustules wipe off easily as powdery reddish-brown spore dust on Common Rust.",
    lookalike_model_status: "Model Status: The active checkpoint is trained on 4 certified classes. Southern Rust differentiation criteria are derived from ICAR-IIMR extension compendiums.",

    plant_assessment_title: "Whole-Plant Health Assessment (Multi-Leaf)",
    plant_total_leaves: "Total Leaves Submitted:",
    plant_valid_leaves: "Valid Leaves Analyzed:",
    plant_excluded_leaves: "Leaves Excluded (Quality/Gate):",
    plant_consensus_title: "Plant-Level Consensus Verdict:",
    plant_disagreement_alert: "Disagreement Detected: Leaves from this plant exhibit conflicting symptoms. Field inspection recommended before any treatment.",
    plant_leaf_num: "Leaf",
    plant_capture_add_leaf: "Add Another Leaf From This Plant (+)",
    plant_mode_single: "Single Leaf Check",
    plant_mode_multi: "Whole Plant Assessment",
    plant_assess_btn: "Assess Plant Health"
  }
};

