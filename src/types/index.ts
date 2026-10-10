export type SupportedLanguage = 'te' | 'hi' | 'en';

export type WorkflowState =
  | 'WELCOME'
  | 'LANGUAGE_SELECTION'
  | 'HOME'
  | 'FIELD_SELECTION_OR_CREATION'
  | 'CROP_SELECTION'
  | 'IMAGE_CAPTURE'
  | 'IMAGE_QUALITY_CHECK'
  | 'CROP_VERIFICATION'
  | 'ASSESSMENT'
  | 'FOLLOW_UP_QUESTIONS'
  | 'MANAGEMENT_GUIDANCE'
  | 'FIELD_SAMPLING'
  | 'SAVE_INSPECTION'
  | 'HISTORY'
  | 'WEATHER_SENSORS'
  | 'OFFLINE_SYNC'
  | 'HELP_SETTINGS';

export interface FieldRecord {
  id: string;
  name: string;
  crop: string;
  planting_date?: string;
  acreage?: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  created_at: string;
  notes?: string;
}

export interface QualityResult {
  passed: boolean;
  status: string;
  blur_score: number;
  is_blurry: boolean;
  brightness_score: number;
  lighting_status: string;
  dimensions: [number, number];
  aspect_ratio: number;
  recommendation_code: string;
  farmer_feedback: {
    en: string;
    te: string;
    hi: string;
  };
}

export interface ClassProbability {
  label: string;
  name: string;
  probability: number;
  percentage: number;
}

export interface DifferentialPossibility {
  condition: string;
  similarity: string;
  differentiation: string;
}

export interface LocalizedText {
  en: string;
  te: string;
  hi: string;
}

export interface LocalizedList {
  en: string[];
  te: string[];
  hi: string[];
}

export interface CropVerifyResult {
  passed: boolean;
  status: string;
  is_plant_leaf: boolean;
  foliage_coverage_pct: number;
  crop_verified: boolean;
  decision: string;
  visual_verification_mode?: string;
  message: LocalizedText;
}

export interface ManagementGuidance {
  summary: string | LocalizedText;
  what_it_means?: LocalizedText;
  immediate_actions?: LocalizedList;
  preventive_care?: LocalizedList;
  reinspect_days?: number;
  reinspect_text?: LocalizedText;
  seek_help_conditions?: LocalizedText;
  cultural_actions: string[];
  chemical_advice: string | LocalizedText;
  official_source: string;
}

export interface AssessmentResult {
  crop: string;
  predicted_class: string;
  display_name: {
    en: string;
    te: string;
    hi: string;
  };
  confidence: number;
  is_uncertain: boolean;
  uncertainty_reason?: {
    en: string;
    te: string;
    hi: string;
  } | null;
  all_probabilities: ClassProbability[];
  model_version: string;
  source_mode: 'model_inference' | 'demonstration';
  latency_ms: number;
  differential_possibilities: DifferentialPossibility[];
  management_guidance: ManagementGuidance;
  note?: string;
  lesion_pct?: number;
  severity_stage?: string;
  stage_info?: {
    lesion_percent?: number | null;
    yellow_percent?: number | null;
    leaf_fraction?: number | null;
    stage?: string;
    stage_label?: LocalizedText;
    reliable?: boolean;
  };
  sensor_fusion?: {
    sensor_used: boolean;
    reason?: string;
    favourability?: Record<string, number | null>;
    reading_age_hours?: number | null;
  };
  advisory?: {
    level: 'no_action' | 'recheck' | 'cultural_only' | 'consult_officer';
    message: LocalizedText;
    evidence: {
      image_confident: boolean;
      damage_measured: boolean;
      weather_favourable: boolean;
      field_confirmed: boolean;
    };
    still_needed_for_officer_consult: string[];
    names_products_or_doses: boolean;
  };
  highlight?: Highlight | null;
  environmental_context?: {
    temperature_c?: number | null;
    humidity_pct?: number | null;
    leaf_wetness_hours_24h?: number | null;
    soil_moisture_pct?: number | null;
    source?: string;
    sensor_status?: 'online' | 'offline';
    age_hours?: number | null;
    favourability_score?: number | null;
    weather_favourable?: boolean;
  };
  pesticide_recommendation?: PesticideRecommendation | null;
  lookalike_comparison?: LookalikeComparison | null;
  plant_assessment?: PlantAssessmentResponse | null;
}

export interface ChemicalIntervention {
  id: string;
  product_name: string;
  active_ingredient: string;
  category: string;
  registration_status: 'registered' | 'extension_recommended';
  verification_source: string;
  source_url?: string;
  recommended_rate: string;
  rate_per_acre: string;
  application_method: string;
  application_timing: string;
  growth_stage_restrictions?: string;
  pre_harvest_interval_days?: number;
  re_entry_interval_hours?: number;
  ppe_requirements: string[];
  environmental_precautions?: string;
}

export interface PesticideRecommendation {
  disease: string;
  disease_name?: LocalizedText;
  scientific_name?: string;
  symptom_distinction?: LocalizedText;
  recommendation_status: 'verified' | 'extension_recommended' | 'no_pesticide_required' | 'withheld_uncertain' | 'no_verified_recommendation';
  message: LocalizedText;
  chemical_interventions: ChemicalIntervention[];
  integrated_disease_management: string[];
  source_authority?: string;
  regulatory_framework?: string;
  last_reviewed_date?: string;
  disclaimer?: string;
}

export interface LookalikePathogen {
  key: string;
  scientific_name: string;
  common_name: LocalizedText;
  pustule_color: LocalizedText;
  pustule_shape: LocalizedText;
  canopy_distribution: LocalizedText;
  temperature_optimum: string;
  humidity_requirement: string;
  seasonality: string;
  spore_morphology: string;
}

export interface LookalikeComparison {
  comparison_title: LocalizedText;
  pathogen_a: LookalikePathogen;
  pathogen_b: LookalikePathogen;
  diagnostic_field_tips: string[];
}

export interface LeafAssessmentItem {
  leaf_index: number;
  filename: string;
  is_usable: boolean;
  rejection_reason?: string | null;
  quality?: any;
  predicted_class?: string | null;
  confidence?: number | null;
  is_uncertain?: boolean | null;
  lesion_pct?: number | null;
  severity_stage?: string | null;
  highlight?: Highlight | null;
}

export interface PlantAssessmentResponse {
  plant_id: string;
  crop: string;
  total_leaves_submitted: number;
  valid_leaves_count: number;
  excluded_leaves_count: number;
  plant_level_prediction: string;
  plant_level_confidence: number;
  is_uncertain: boolean;
  has_disagreement: boolean;
  disagreement_summary?: string | null;
  class_vote_breakdown: Record<string, number>;
  average_class_probabilities: Record<string, number>;
  leaf_assessments: LeafAssessmentItem[];
  pesticide_recommendation?: PesticideRecommendation | null;
  lookalike_comparison?: LookalikeComparison | null;
  management_guidance?: any;
  source_mode: string;
  latency_ms: number;
}


export interface Highlight {
  image_data_url: string;
  lesion_percent: number;
  yellow_percent: number;
  legend: {
    title: LocalizedText;
    red: LocalizedText;
    amber: LocalizedText;
    note: LocalizedText;
  };
  basis?: string;
}

export interface DifferentialAnswers {
  onset_time?: string;
  pesticide_fertilizer_applied?: string;
  weather_condition?: string;
  neighboring_plants?: string;
}

export interface InspectionRecord {
  id: string;
  field_id: string;
  field_name?: string;
  crop: string;
  visited_at: string;
  sample_count: number;
  symptomatic_count: number;
  uncertain_count: number;
  predicted_condition?: string;
  confidence?: number;
  provenance: string;
  notes?: string;
  image_data_url?: string;
  quality_result?: QualityResult;
  assessment_result?: AssessmentResult;
  differential_answers?: DifferentialAnswers;
  sync_status: 'saved_locally' | 'waiting_to_sync' | 'synced' | 'sync_failed';
  synced_at?: string;
}

export interface WeatherData {
  temperature_c: number;
  relative_humidity_pct: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  weather_condition: string;
  provenance: string;
  retrieval_time: string;
  is_live_api: boolean;
  location_name: string;
  disclaimer: string;
}

export interface SensorReading {
  sensor_id: string;
  parameter: string;
  value: number;
  unit: string;
  timestamp: string;
  field_id?: string;
  is_simulated: boolean;
  provenance_tag: string;
  disclaimer: string;
}
