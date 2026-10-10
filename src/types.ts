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
  detected_crop?: string;
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
