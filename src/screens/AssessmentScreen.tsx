import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Cpu,
  Layers,
  FileQuestion,
  Volume2,
  VolumeX,
  Sprout,
  ShieldCheck,
  AlertOctagon,
  Calendar,
  PhoneCall,
  BookOpen,
  ClipboardList,
  ShieldAlert,
  Droplets,
  Thermometer,
  CloudSun,
  FlaskConical
} from 'lucide-react';


import { AssessmentResult, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';
import { VoiceAssistant } from '../features/voice/voiceStateMachine';
import AffectedAreaView from '../components/AffectedAreaView';

interface Props {
  currentLanguage: SupportedLanguage;
  assessment?: AssessmentResult;
  previewUrl?: string;
  crop?: string;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  assistant?: VoiceAssistant;
  onProceedToQuestions: () => void;
  onProceedToGuidance?: () => void;
  onProceedToSampling: () => void;
  onBack: () => void;
}

export const buildSpokenReport = (
  assessment: AssessmentResult,
  lang: SupportedLanguage
): string => {
  const name = assessment.display_name[lang] || assessment.display_name.en;
  const conf = Math.round(assessment.confidence * 100);
  const isUncertain = assessment.is_uncertain;
  const g = assessment.management_guidance as any;

  const immList = (g?.immediate_actions && g.immediate_actions[lang]) || g?.cultural_actions || [];
  const immText = Array.isArray(immList) ? immList.slice(0, 2).join('. ') : String(immList);

  const prevList = (g?.preventive_care && g.preventive_care[lang]) || [];
  const prevText = Array.isArray(prevList) ? prevList.slice(0, 2).join('. ') : (immText || 'Standard agricultural management.');

  const days = g?.reinspect_days || (assessment.predicted_class === 'healthy' ? 7 : 3);
  const lesionClauseTe = assessment.lesion_pct !== undefined && assessment.lesion_pct !== null ? ` ఆకుపై మచ్చల విస్తృతి: ${assessment.lesion_pct} శాతం.` : '';
  const lesionClauseHi = assessment.lesion_pct !== undefined && assessment.lesion_pct !== null ? ` पत्ती पर धब्बों का फैलाव: ${assessment.lesion_pct} प्रतिशत।` : '';
  const lesionClauseEn = assessment.lesion_pct !== undefined && assessment.lesion_pct !== null ? ` Lesion spread: ${assessment.lesion_pct} percent.` : '';

  const stageName = assessment.stage_info?.stage_label?.[lang] || assessment.stage_info?.stage_label?.en || '';
  const stageClauseTe = stageName ? ` దశ: ${stageName}.` : '';
  const stageClauseHi = stageName ? ` अवस्था: ${stageName}।` : '';
  const stageClauseEn = stageName ? ` Stage: ${stageName}.` : '';

  const advisoryMsg = assessment.advisory?.message?.[lang] || '';
  const advClauseTe = advisoryMsg ? ` సలహా నియమం: ${advisoryMsg}` : ' రసాయనాల వాడకానికి మీ వ్యవసాయ అధికారిని సంప్రదించండి.';
  const advClauseHi = advisoryMsg ? ` सलाह नियम: ${advisoryMsg}` : ' रासायनिक उपचार के लिए अपने कृषि अधिकारी से परामर्श लें।';
  const advClauseEn = advisoryMsg ? ` Advisory rule: ${advisoryMsg}` : ' For chemical controls, please consult your local agricultural extension officer.';

  if (lang === 'hi') {
    const uncertClause = isUncertain ? ' यह परिणाम अनिश्चित है।' : '';
    return `जाँच परिणाम: ${name}। मॉडल विश्वास: ${conf} प्रतिशत।${lesionClauseHi}${stageClauseHi}${uncertClause} तुरंत करने योग्य उपाय: ${immText}। दीर्घकालिक उपाय: ${prevText}। पुनः निरीक्षण: ${days} दिनों के बाद।${advClauseHi}`;
  } else if (lang === 'te') {
    const uncertClause = isUncertain ? ' ఈ ఫలితం అనిశ్చితంగా ఉంది.' : '';
    return `తనిఖీ ఫలితం: ${name}. మోడల్ విశ్వసనీయత: ${conf} శాతం.${lesionClauseTe}${stageClauseTe}${uncertClause} తక్షణ చర్యలు: ${immText}. నివారణ చర్యలు: ${prevText}. తిరిగి పరిశీలన: ${days} రోజుల తర్వాత.${advClauseTe}`;
  } else {
    const uncertClause = isUncertain ? ' This result is uncertain.' : '';
    return `Inspection result: ${name}. Model confidence: ${conf} percent.${lesionClauseEn}${stageClauseEn}${uncertClause} Immediate actions: ${immText}. Preventive care: ${prevText}. Reinspect in: ${days} days.${advClauseEn}`;
  }
};

export const AssessmentScreen: React.FC<Props> = ({
  currentLanguage,
  assessment,
  previewUrl,
  crop = 'maize',
  isLoading,
  error,
  onRetry,
  assistant,
  onProceedToQuestions,
  onProceedToGuidance,
  onProceedToSampling,
  onBack
}) => {
  const dict = translations[currentLanguage];
  const [showProbabilities, setShowProbabilities] = useState(false);
  const [showDifferentials, setShowDifferentials] = useState(false);
  const [isSpeakingReport, setIsSpeakingReport] = useState(false);

  if (error && !isLoading) {
    return (
      <div className="pb-28 pt-6 px-4 max-w-md mx-auto space-y-4">
        <div className="card p-5 space-y-3 border-2 border-red-300 bg-red-50/60">
          <div className="flex items-center gap-2 text-red-900 font-extrabold text-xs uppercase tracking-wider">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>
              {currentLanguage === 'te' ? 'రోగ నిర్ధారణ ఫలితం రాలేదు' : currentLanguage === 'hi' ? 'निदान परिणाम नहीं मिला' : 'Could not get a diagnosis'}
            </span>
          </div>
          <p className="text-xs text-red-800 leading-relaxed font-medium break-words">{error}</p>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            {currentLanguage === 'te'
              ? 'తప్పుడు ఫలితం చూపకుండా ఉండటానికి ఏ ఫలితాన్నీ చూపడం లేదు.'
              : currentLanguage === 'hi'
              ? 'गलत परिणाम से बचने के लिए कोई परिणाम नहीं दिखाया जा रहा है।'
              : 'No result is shown rather than a made-up one.'}
          </p>
          <div className="space-y-2 pt-1">
            {onRetry && (
              <button onClick={onRetry} className="btn-primary w-full text-sm">
                <span>{currentLanguage === 'te' ? 'మళ్లీ ప్రయత్నించండి' : currentLanguage === 'hi' ? 'दोबारा कोशिश करें' : 'Try again'}</span>
              </button>
            )}
            <button onClick={onBack} className="btn-secondary w-full text-xs">
              <ArrowLeft size={16} />
              <span>{dict.back_btn}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !assessment) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-[#1E5631]/20 border-t-[#1E5631] animate-spin" />
        <div>
          <h3 className="text-base font-bold text-gray-900">{dict.assessment_title}...</h3>
          <p className="text-xs text-gray-500 mt-1">Running MobileNetV2 leaf health inference</p>
        </div>
      </div>
    );
  }

  const displayName = assessment.display_name[currentLanguage] || assessment.display_name.en;
  const confidencePercent = Math.round(assessment.confidence * 100);
  const isHealthy = assessment.predicted_class === 'healthy';
  const guidance = assessment.management_guidance as any;

  // Localized guidance items
  const immediateActions: string[] =
    (guidance?.immediate_actions && guidance.immediate_actions[currentLanguage]) ||
    guidance?.cultural_actions ||
    [];

  const preventiveCare: string[] =
    (guidance?.preventive_care && guidance.preventive_care[currentLanguage]) ||
    [];

  const reinspectDays = guidance?.reinspect_days || (isHealthy ? 7 : 3);
  const reinspectText: string =
    (guidance?.reinspect_text && guidance.reinspect_text[currentLanguage]) ||
    (currentLanguage === 'te'
      ? `${reinspectDays} రోజుల తర్వాత మళ్లీ తనిఖీ చేయండి.`
      : currentLanguage === 'hi'
      ? `${reinspectDays} दिनों के बाद पुनः निरीक्षण करें।`
      : `Re-inspect in ${reinspectDays} days.`);

  const seekHelpConditions: string =
    (guidance?.seek_help_conditions && guidance.seek_help_conditions[currentLanguage]) ||
    (currentLanguage === 'te'
      ? 'లక్షణాలు వేగంగా వ్యాపిస్తే వెంటనే స్థానిక వ్యవసాయ అధికారి లేదా KVK శాస్త్రవేత్తను సంప్రదించండి.'
      : currentLanguage === 'hi'
      ? 'यदि लक्षण तेजी से फैलें तो तुरंत स्थानीय कृषि अधिकारी या केवीके से संपर्क करें।'
      : 'If symptoms spread rapidly, contact your local Agricultural Extension Officer or KVK immediately.');

  const chemicalAdvice: string =
    (typeof guidance?.chemical_advice === 'object' && guidance?.chemical_advice[currentLanguage]) ||
    guidance?.chemical_advice ||
    '';

  const officialSource: string =
    guidance?.official_source ||
    'ICAR-Indian Institute of Maize Research (IIMR) & State Agricultural University Advisory';

  const handleToggleSpeakReport = () => {
    if (!assistant) return;

    if (isSpeakingReport) {
      assistant.stopSpeaking();
      setIsSpeakingReport(false);
    } else {
      const speechText = buildSpokenReport(assessment, currentLanguage);
      setIsSpeakingReport(true);
      assistant.speak(speechText, true);
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* SECTION 1: Header / Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">
            {currentLanguage === 'te' ? 'పంట ఆరోగ్య నివేదిక' : currentLanguage === 'hi' ? 'फसल स्वास्थ्य रिपोर्ट' : 'Crop Health Report'}
          </h2>
          <span className="text-[10px] text-gray-500 font-medium">12-Point Comprehensive Inspection</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Main Condition Result Card */}
      <div className={`card p-5 border-2 space-y-4 ${
        assessment.is_uncertain
          ? 'border-amber-400 bg-amber-50/40'
          : isHealthy
          ? 'border-emerald-500 bg-emerald-50/40'
          : 'border-[#1E5631] bg-emerald-50/20'
      }`}>
        {/* SECTION 2 & 3: Crop Badge & Primary Detected Condition */}
        <div className="space-y-3">
          <div className="space-y-1">
            {/* SECTION 2: Verified Crop Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1E5631]/10 text-[#1E5631]">
              <ShieldCheck size={13} />
              <span>
                {crop === 'banana'
                  ? (currentLanguage === 'te' ? 'అరటి (ధృవీకరించబడింది)' : currentLanguage === 'hi' ? 'केला (पुष्टीकृत)' : 'Banana (Confirmed)')
                  : (currentLanguage === 'te' ? 'మొక్కజొన్న (ధృవీకరించబడింది)' : currentLanguage === 'hi' ? 'మక్కా (पुष्टीकृत)' : 'Maize (Confirmed)')}
              </span>
            </div>

            {/* SECTION 3: Primary Detected Condition */}
            <div className="pt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                {dict.prediction_label}
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 leading-tight">
                {displayName}
              </h3>
            </div>
          </div>

          {/* Affected Area / Leaf Photo View */}
          {previewUrl && (
            <div className="pt-1">
              <AffectedAreaView
                originalSrc={previewUrl}
                highlight={assessment.highlight}
                lang={currentLanguage}
              />
            </div>
          )}

          {/* Multi-Leaf Whole Plant Assessment Summary */}
          {assessment.plant_assessment && (
            <div className="mt-2 p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-extrabold text-emerald-950">
                  <Layers size={15} className="text-emerald-700" />
                  <span>{dict.plant_assessment_title}</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold uppercase">
                  {assessment.plant_assessment.plant_id}
                </span>
              </div>

              {/* Consensus & Disagreement Banner */}
              {assessment.plant_assessment.has_disagreement ? (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <AlertTriangle size={14} className="text-amber-700 shrink-0" />
                    <span>{dict.plant_disagreement_alert}</span>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    {assessment.plant_assessment.disagreement_summary}
                  </p>
                </div>
              ) : (
                <div className="p-2 bg-emerald-100/70 border border-emerald-200 rounded-lg text-emerald-900 flex items-center gap-1.5 text-[11px] font-semibold">
                  <CheckCircle size={14} className="text-emerald-700 shrink-0" />
                  <span>
                    {currentLanguage === 'te'
                      ? `అన్ని ${assessment.plant_assessment.valid_leaves_count} ఆకులు ఏకాభిప్రాయంతో ఒకే లక్షణాన్ని ధృవీకరించాయి.`
                      : currentLanguage === 'hi'
                      ? `सभी ${assessment.plant_assessment.valid_leaves_count} पत्तियों ने सर्वसम्मति से समान रोग की पुष्टि की।`
                      : `Unanimous agreement across all ${assessment.plant_assessment.valid_leaves_count} analyzed leaf samples.`}
                  </span>
                </div>
              )}

              {/* Leaves Count Metrics */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
                <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                  <div className="text-gray-500 font-medium">{dict.plant_total_leaves}</div>
                  <div className="font-extrabold text-gray-900 text-xs">
                    {assessment.plant_assessment.total_leaves_submitted}
                  </div>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-emerald-200">
                  <div className="text-emerald-700 font-medium">{dict.plant_valid_leaves}</div>
                  <div className="font-extrabold text-emerald-800 text-xs">
                    {assessment.plant_assessment.valid_leaves_count}
                  </div>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                  <div className="text-gray-500 font-medium">{dict.plant_excluded_leaves}</div>
                  <div className="font-extrabold text-gray-700 text-xs">
                    {assessment.plant_assessment.excluded_leaves_count}
                  </div>
                </div>
              </div>

              {/* Individual Leaves Status Chips */}
              <div className="space-y-1 pt-1 border-t border-emerald-200/60">
                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                  {currentLanguage === 'te' ? 'ఆకుల వారీ వివరాలు:' : currentLanguage === 'hi' ? 'पत्ती-वार स्थिति:' : 'Per-Leaf Breakdown:'}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {assessment.plant_assessment.leaf_assessments.map((leaf) => (
                    <div
                      key={leaf.leaf_index}
                      className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                        leaf.is_usable
                          ? 'bg-white border-emerald-100 text-gray-800'
                          : 'bg-red-50/50 border-red-200 text-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-600">#{leaf.leaf_index}</span>
                        {leaf.is_usable ? (
                          <span className="font-medium">
                            {leaf.predicted_class?.replace(/_/g, ' ')} ({Math.round((leaf.confidence || 0) * 100)}%)
                          </span>
                        ) : (
                          <span className="text-red-700 font-medium truncate max-w-[200px]">
                            {leaf.rejection_reason || 'Excluded (Quality gate)'}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        leaf.is_usable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {leaf.is_usable ? '✓ Valid' : '✕ Excluded'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* SECTION 4: Confidence Gauge + Safe Threshold Indicator */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-600">{dict.confidence_label}</span>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold ${assessment.is_uncertain ? 'text-amber-700' : 'text-[#1E5631]'}`}>
                {confidencePercent}%
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                Threshold: 65%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                assessment.is_uncertain
                  ? 'bg-amber-500'
                  : isHealthy
                  ? 'bg-emerald-600'
                  : 'bg-[#1E5631]'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* SECTION 5: Model Provenance Badge */}
        <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Cpu size={14} className="text-[#1E5631]" />
            <span>
              {assessment.source_mode === 'model_inference'
                ? dict.provenance_model_label
                : dict.provenance_demo_label}
            </span>
          </div>
          <span className="font-mono text-gray-400">
            {assessment.latency_ms} ms CPU
          </span>
        </div>

        {/* SECTION 5B: Lesion Area & Severity Stage */}
        {assessment.lesion_pct !== undefined && assessment.lesion_pct !== null && (
          <div className="bg-white/80 border border-emerald-200/80 rounded-xl p-3 text-xs space-y-1.5 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">
                {currentLanguage === 'te' ? 'ఆకుపై మచ్చల విస్తృతి:' : currentLanguage === 'hi' ? 'पत्ती पर धब्बों का फैलाव:' : 'Lesion Spread on Leaf:'}
              </span>
              <span className="font-extrabold text-[#1E5631] text-sm">{assessment.lesion_pct}%</span>
            </div>
            {assessment.severity_stage && (
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-gray-100">
                <span className="text-gray-500">
                  {currentLanguage === 'te' ? 'తీవ్రత దశ:' : currentLanguage === 'hi' ? 'तीव्रता अवस्था:' : 'Severity Stage:'}
                </span>
                <span className="font-bold uppercase tracking-wide text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  {assessment.stage_info?.stage_label
                    ? (assessment.stage_info.stage_label[currentLanguage] || assessment.stage_info.stage_label.en)
                    : assessment.severity_stage === 'trace' || assessment.severity_stage === 'healthy_or_incubation'
                    ? (currentLanguage === 'te' ? 'అతి తొలి దశ (< 3%)' : currentLanguage === 'hi' ? 'बहुत शुरुआती अवस्था (< 3%)' : 'Trace Stage (< 3%)')
                    : assessment.severity_stage === 'early'
                    ? (currentLanguage === 'te' ? 'ప్రారంభ దశ (3-12%)' : currentLanguage === 'hi' ? 'शुरुआती अवस्था (3-12%)' : 'Early Stage (3-12%)')
                    : assessment.severity_stage === 'moderate'
                    ? (currentLanguage === 'te' ? 'మధ్యస్థ దశ (12-30%)' : currentLanguage === 'hi' ? 'मध्यम अवस्था (12-30%)' : 'Moderate Stage (12-30%)')
                    : assessment.severity_stage === 'severe'
                    ? (currentLanguage === 'te' ? 'తీవ్ర దశ (> 30%)' : currentLanguage === 'hi' ? 'गंभीर अवस्था (> 30%)' : 'Severe Stage (> 30%)')
                    : (currentLanguage === 'te' ? 'సాధారణ పరిస్థితి' : currentLanguage === 'hi' ? 'सामान्य स्थिति' : 'Normal')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* PROMINENT SPEAK REPORT BUTTON */}
        <div className="pt-1">
          <button
            onClick={handleToggleSpeakReport}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
              isSpeakingReport
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-[#1E5631] text-white hover:bg-[#2D6A4F]'
            }`}
          >
            {isSpeakingReport ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>
              {isSpeakingReport
                ? (currentLanguage === 'te' ? 'వాయిస్ నివేదికను ఆపండి' : currentLanguage === 'hi' ? 'रिपोर्ट वाचन रोकें' : 'Stop Spoken Report')
                : (currentLanguage === 'te' ? '🔊 వాయిస్ నివేదిక వినండి (Speak Report)' : currentLanguage === 'hi' ? '🔊 पूरी रिपोर्ट सुनें (Speak Report)' : '🔊 Speak Full Report')}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 5C: Microclimate & Field Environmental Context (Phase 8 Integration) */}
      {assessment.environmental_context && (
        <div className="card p-4 space-y-3 bg-linear-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E5631] uppercase tracking-wider">
              <Thermometer size={16} className="text-emerald-700" />
              <span>
                {currentLanguage === 'te'
                  ? 'సూక్ష్మ-వాతావరణ & పర్యావరణ సందర్భం'
                  : currentLanguage === 'hi'
                  ? 'सूक्ष्म-जलवायु एवं पर्यावरणीय संदर्भ'
                  : 'Microclimate & Environmental Context'}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                assessment.environmental_context.sensor_status === 'online'
                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {assessment.environmental_context.sensor_status === 'online'
                ? '🟢 ESP32 Live'
                : '🟠 Sensor Offline'}
            </span>
          </div>

          {/* Metric Grid: Canopy Temp, Humidity, Leaf Wetness, Soil Moisture */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] text-gray-500">
                  {currentLanguage === 'te' ? 'కానోపీ ఉష్ణోగ్రత' : currentLanguage === 'hi' ? 'कैनोपी तापमान' : 'Canopy Temp'}
                </div>
                <div className="font-extrabold text-[#1E5631] text-sm">
                  {assessment.environmental_context.temperature_c !== null &&
                  assessment.environmental_context.temperature_c !== undefined
                    ? `${assessment.environmental_context.temperature_c}°C`
                    : '—'}
                </div>
              </div>
              <Thermometer size={18} className="text-amber-500" />
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] text-gray-500">
                  {currentLanguage === 'te' ? 'గాలి తేమ (% RH)' : currentLanguage === 'hi' ? 'हवा में नमी (% RH)' : 'Air Humidity'}
                </div>
                <div className="font-extrabold text-[#1E5631] text-sm">
                  {assessment.environmental_context.humidity_pct !== null &&
                  assessment.environmental_context.humidity_pct !== undefined
                    ? `${assessment.environmental_context.humidity_pct}%`
                    : '—'}
                </div>
              </div>
              <Droplets size={18} className="text-blue-500" />
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] text-gray-500">
                  {currentLanguage === 'te' ? 'ఆకు తడి వ్యవధి (24గ)' : currentLanguage === 'hi' ? 'पत्ती गीलापन (24घं)' : 'Leaf Wetness (24h)'}
                </div>
                <div className="font-extrabold text-[#1E5631] text-sm">
                  {assessment.environmental_context.leaf_wetness_hours_24h !== null &&
                  assessment.environmental_context.leaf_wetness_hours_24h !== undefined
                    ? `${assessment.environmental_context.leaf_wetness_hours_24h} hrs`
                    : '—'}
                </div>
              </div>
              <CloudSun size={18} className="text-emerald-500" />
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] text-gray-500">
                  {currentLanguage === 'te' ? 'నేల తేమ శాతం' : currentLanguage === 'hi' ? 'मिट्टी की नमी' : 'Soil Moisture'}
                </div>
                <div className="font-extrabold text-[#1E5631] text-sm">
                  {assessment.environmental_context.soil_moisture_pct !== null &&
                  assessment.environmental_context.soil_moisture_pct !== undefined
                    ? `${assessment.environmental_context.soil_moisture_pct}%`
                    : '—'}
                </div>
              </div>
              <Sprout size={18} className="text-teal-600" />
            </div>
          </div>

          {/* Disease Weather Favorability & Agronomic Note */}
          <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-100/90 text-[11px] space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="text-gray-700">
                {currentLanguage === 'te' ? 'వాతావరణ అనుకూలత:' : currentLanguage === 'hi' ? 'मौसम अनुकूलता:' : 'Microclimate Favourability:'}
              </span>
              <span className={assessment.environmental_context.weather_favourable ? 'text-amber-800' : 'text-emerald-800'}>
                {assessment.environmental_context.weather_favourable
                  ? (currentLanguage === 'te' ? '⚠️ తెగులు వ్యాప్తికి అత్యంత అనుకూలం' : currentLanguage === 'hi' ? '⚠️ रोग प्रसार हेतु अत्यधिक अनुकूल' : '⚠️ Favourable for Spore Spread')
                  : (currentLanguage === 'te' ? 'తక్కువ తెగులు ఒత్తిడి' : currentLanguage === 'hi' ? 'कम रोग दबाव' : 'Low Fungal Pressure')}
              </span>
            </div>
            <p className="text-gray-500 leading-relaxed text-[10px]">
              {currentLanguage === 'te'
                ? 'గమనిక: పర్యావరణ సందర్భం రోగ తీవ్రతను, సలహా నిబంధనలను అంచనా వేయడానికి మాత్రమే ఉపయోగింపబడుతుంది; ఇది చిత్ర మోడల్ నిర్ధారణను మార్చదు.'
                : currentLanguage === 'hi'
                ? 'नोट: पर्यावरणीय संदर्भ रोग के दबाव एवं सुरक्षा सलाह को सूचित करता है; यह मॉडल के मूल छवि निदान को नहीं बदलता।'
                : 'Note: Environmental microclimate context informs disease pressure and advisory gates without overriding visual leaf diagnosis.'}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 6: Uncertainty Notice (if confidence < 65%) */}

      {assessment.is_uncertain && (
        <div className="card bg-amber-50 border-2 border-amber-300 p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>{dict.uncertain_alert_title}</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            {assessment.uncertainty_reason
              ? assessment.uncertainty_reason[currentLanguage] || assessment.uncertainty_reason.en
              : dict.uncertain_alert_desc}
          </p>
        </div>
      )}

      {/* SECTION 7: Differential Diagnosis / Alternative Possibilities Collapsible */}
      <div className="card p-4 space-y-3">
        <button
          onClick={() => setShowDifferentials(!showDifferentials)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <HelpCircle size={16} className="text-amber-600" />
            <span>{dict.differential_heading}</span>
          </div>
          {showDifferentials ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDifferentials && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-600 leading-relaxed">
              {dict.differential_desc}
            </p>
            {assessment.differential_possibilities.map((diff, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1">
                <div className="font-bold text-gray-900">{diff.condition}</div>
                <div className="text-gray-600">{diff.similarity}</div>
                <div className="text-[#1E5631] font-semibold pt-1">
                  💡 {currentLanguage === 'te' ? 'ఎలా గుర్తించాలి: ' : currentLanguage === 'hi' ? 'अंतर कैसे पहचानें: ' : 'Differentiation: '}
                  {diff.differentiation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOOKALIKE RUST DIFFERENTIAL CARD (Common Rust vs Southern Rust) */}
      {(assessment.lookalike_comparison || assessment.predicted_class === 'common_rust' || assessment.predicted_class === 'southern_rust') && (
        <div className="card p-4 space-y-3 bg-linear-to-br from-amber-50/40 via-orange-50/30 to-yellow-50/40 border-2 border-amber-300 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-950">
              <HelpCircle size={16} className="text-amber-700" />
              <span>{dict.lookalike_heading}</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] font-extrabold uppercase">
              ICAR-IIMR Protocol
            </span>
          </div>

          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            {dict.lookalike_subheading}
          </p>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            {/* Common Rust Box */}
            <div className="p-3 bg-white rounded-xl border-2 border-amber-200 space-y-2 shadow-2xs">
              <div className="border-b border-amber-100 pb-1">
                <div className="font-extrabold text-amber-900 text-xs">
                  {dict.lookalike_common_rust}
                </div>
                <div className="text-[10px] italic text-gray-500 font-mono">Puccinia sorghi</div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="font-bold text-gray-700 block">{dict.lookalike_pustule_location}</span>
                  <span className="text-gray-600">
                    {currentLanguage === 'te'
                      ? 'ఆకు పైభాగం మరియు అడుగు భాగం రెండింటిపై సమానంగా కనిపిస్తాయి (Amphigenous).'
                      : currentLanguage === 'hi'
                      ? 'पत्ती की दोनों सतहों (ऊपरी और निचली) पर समान रूप से पाए जाते हैं।'
                      : 'Both leaf surfaces (amphigenous) prominently.'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-700 block">{dict.lookalike_pustule_morphology}</span>
                  <span className="text-gray-600">
                    {currentLanguage === 'te'
                      ? 'దాల్చిన చెక్క ముదురు ఎరుపు-గోధుమ రంగు; పొడవాటి గుండ్రటి మచ్చలు, త్వరగా పొడిగా రాలుతాయి.'
                      : currentLanguage === 'hi'
                      ? 'दालचीनी गहरा लाल-भूरा; लंबे अंडाकार फफोले, जल्दी पाउडर की तरह बिखरते हैं।'
                      : 'Cinnamon to reddish-brown, elongate (1–2 mm), powdery spore dust.'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-700 block">{dict.lookalike_favorable_temp}</span>
                  <span className="text-emerald-800 font-semibold">16°C – 24°C (Cool/Moderate)</span>
                </div>
              </div>
            </div>

            {/* Southern Rust Box */}
            <div className="p-3 bg-white rounded-xl border-2 border-orange-200 space-y-2 shadow-2xs">
              <div className="border-b border-orange-100 pb-1">
                <div className="font-extrabold text-orange-950 text-xs">
                  {dict.lookalike_southern_rust}
                </div>
                <div className="text-[10px] italic text-gray-500 font-mono">Puccinia polysora</div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="font-bold text-gray-700 block">{dict.lookalike_pustule_location}</span>
                  <span className="text-gray-600">
                    {currentLanguage === 'te'
                      ? 'ప్రధానంగా ఆకు పై ఉపరితలంపై మాత్రమే దట్టంగా కనిపిస్తాయి (Adaxial).'
                      : currentLanguage === 'hi'
                      ? 'मुख्य रूप से पत्ती की केवल ऊपरी सतह पर पाए जाते हैं।'
                      : 'Almost exclusively on upper leaf surface (adaxial).'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-700 block">{dict.lookalike_pustule_morphology}</span>
                  <span className="text-gray-600">
                    {currentLanguage === 'te'
                      ? 'బంగారు-నారింజ నుండి పసుపు రంగు; చాలా చిన్నవి (0.2-1 మి.మీ), గుండ్రంగా, దట్టంగా ఉంటాయి.'
                      : currentLanguage === 'hi'
                      ? 'सुनहरा-नारंगी से पीला; बहुत छोटे (0.2-1 मिमी), गोल, घने समूह।'
                      : 'Golden-orange to yellow-brown, tiny circular (0.2–1 mm), dense.'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-700 block">{dict.lookalike_favorable_temp}</span>
                  <span className="text-orange-800 font-semibold">25°C – 32°C (Warm/Hot)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Rub Test Tip */}
          <div className="p-2.5 bg-white/90 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <div>
              <span className="font-extrabold">{dict.lookalike_rub_test.split(':')[0]}: </span>
              <span>{dict.lookalike_rub_test.split(':')[1] || dict.lookalike_rub_test}</span>
            </div>
          </div>

          {/* Honest Model Status Disclosure */}
          <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-700">🔬 Model Architecture Note: </span>
            <span>{dict.lookalike_model_status}</span>
          </div>
        </div>
      )}

      {/* SECTION 8: Probability Breakdown Collapsible */}

      <div className="card p-4 space-y-3">
        <button
          onClick={() => setShowProbabilities(!showProbabilities)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <Layers size={16} className="text-[#1E5631]" />
            <span>{dict.probability_breakdown}</span>
          </div>
          {showProbabilities ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showProbabilities && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {assessment.all_probabilities.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-gray-700">
                  <span>{item.name}</span>
                  <span className="font-bold">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1E5631] rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 9: Immediate Actionable Cultural Practices */}
      <div className="card p-4 space-y-3 border border-emerald-100 bg-white">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1E5631] uppercase tracking-wider">
          <Sprout size={16} />
          <span>
            {currentLanguage === 'te' ? 'తక్షణ సాగు చర్యలు' : currentLanguage === 'hi' ? 'तुरंत करने योग्य कृषि उपाय' : 'Immediate Cultural Actions'}
          </span>
        </div>

        <ul className="space-y-2 pt-1">
          {immediateActions.map((act, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
              <CheckCircle size={15} className="text-[#1E5631] shrink-0 mt-0.5" />
              <span>{act}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* SECTION 10: Long-Term Preventive Care */}
      {preventiveCare.length > 0 && (
        <div className="card p-4 space-y-3 border border-gray-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">
            <ShieldCheck size={16} />
            <span>
              {currentLanguage === 'te' ? 'దీర్ఘకాలిక నివారణ చర్యలు' : currentLanguage === 'hi' ? 'दीर्घकालिक निवारक उपाय' : 'Long-Term Preventive Care'}
            </span>
          </div>

          <ul className="space-y-2 pt-1">
            {preventiveCare.map((act, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] shrink-0 mt-1.5" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SECTION 11: Re-inspection Timeline & Conditions to Seek Help */}
      <div className="card p-4 space-y-3 bg-amber-50/30 border border-amber-200/80">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
          <Calendar size={16} className="text-amber-700" />
          <span>
            {currentLanguage === 'te' ? 'తిరిగి పరిశీలన & పర్యవేక్షణ' : currentLanguage === 'hi' ? 'पुनः निरीक्षण एवं निगरानी' : 'Re-inspection & Field Monitoring'}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-100">
            <Calendar size={15} className="text-[#1E5631] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900">
                {currentLanguage === 'te' ? 'తదుపరి తనిఖీ గడువు: ' : currentLanguage === 'hi' ? 'निरीक्षण समयसीमा: ' : 'Timeline: '}
              </span>
              <span className="text-gray-700">{reinspectText}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-100">
            <PhoneCall size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900">
                {currentLanguage === 'te' ? 'అధికారులను ఎప్పుడు సంప్రదించాలి: ' : currentLanguage === 'hi' ? 'सहायता कब लें: ' : 'When to Seek Help: '}
              </span>
              <span className="text-gray-700">{seekHelpConditions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADVISORY GATE & STRICT NO-SPRAY POLICY CARD */}
      {assessment.advisory && (
        <div className={`card p-4 space-y-3 border-2 shadow-xs ${
          assessment.advisory.level === 'consult_officer'
            ? 'border-emerald-300 bg-emerald-50/40'
            : assessment.advisory.level === 'cultural_only'
            ? 'border-blue-300 bg-blue-50/40'
            : assessment.advisory.level === 'recheck'
            ? 'border-amber-300 bg-amber-50/40'
            : 'border-gray-200 bg-gray-50/40'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-gray-800">
              <ShieldAlert size={16} className={
                assessment.advisory.level === 'consult_officer' ? 'text-emerald-700' :
                assessment.advisory.level === 'cultural_only' ? 'text-blue-700' : 'text-amber-700'
              } />
              <span>
                {currentLanguage === 'te' ? 'సలహా నియంత్రణ ద్వారం' : currentLanguage === 'hi' ? 'सलाह नियंत्रण गेट' : 'Advisory Gate & Safety Gate'}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
              assessment.advisory.level === 'consult_officer'
                ? 'bg-emerald-200/80 text-emerald-900 border border-emerald-300'
                : assessment.advisory.level === 'cultural_only'
                ? 'bg-blue-200/80 text-blue-900 border border-blue-300'
                : assessment.advisory.level === 'recheck'
                ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {assessment.advisory.level === 'consult_officer'
                ? (currentLanguage === 'te' ? 'అధికారి సంప్రదింపు' : currentLanguage === 'hi' ? 'अधिकारी परामर्श' : 'Consult Officer')
                : assessment.advisory.level === 'cultural_only'
                ? (currentLanguage === 'te' ? 'సాగు చర్యలు మాత్రమే' : currentLanguage === 'hi' ? 'केवल कृषि उपाय' : 'Cultural Only')
                : assessment.advisory.level === 'recheck'
                ? (currentLanguage === 'te' ? 'మళ్లీ పరిశీలన' : currentLanguage === 'hi' ? 'पुनः जाँच' : 'Recheck')
                : (currentLanguage === 'te' ? 'సాధారణం' : currentLanguage === 'hi' ? 'सामान्य' : 'No Action')}
            </span>
          </div>

          <p className="text-xs text-gray-800 leading-relaxed font-medium">
            {assessment.advisory.message[currentLanguage] || assessment.advisory.message.en}
          </p>

          {/* 4 Multi-Factor Evidence Checks */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 text-[11px]">
            <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
              assessment.advisory.evidence.image_confident ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <CheckCircle size={13} className={assessment.advisory.evidence.image_confident ? 'text-emerald-600' : 'text-gray-400'} />
              <span>{currentLanguage === 'te' ? 'స్పష్టమైన ఫోటో' : currentLanguage === 'hi' ? 'स्पष्ट फोटो' : 'Confident Photo'}</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
              assessment.advisory.evidence.damage_measured ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <CheckCircle size={13} className={assessment.advisory.evidence.damage_measured ? 'text-emerald-600' : 'text-gray-400'} />
              <span>{currentLanguage === 'te' ? 'నష్టం తీవ్రత కొలత' : currentLanguage === 'hi' ? 'क्षति स्तर मापन' : 'Damage Measured'}</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
              assessment.advisory.evidence.weather_favourable ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <CheckCircle size={13} className={assessment.advisory.evidence.weather_favourable ? 'text-emerald-600' : 'text-gray-400'} />
              <span>{currentLanguage === 'te' ? 'వాతావరణ సెన్సార్' : currentLanguage === 'hi' ? 'मौसम सेंसर' : 'Favourable Weather'}</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
              assessment.advisory.evidence.field_confirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <CheckCircle size={13} className={assessment.advisory.evidence.field_confirmed ? 'text-emerald-600' : 'text-gray-400'} />
              <span>{currentLanguage === 'te' ? 'లక్షణాల నిర్ధారణ' : currentLanguage === 'hi' ? 'लक्षण पुष्टि' : 'Field Confirmed'}</span>
            </div>
          </div>

          {assessment.advisory.still_needed_for_officer_consult.length > 0 && assessment.advisory.level !== 'consult_officer' && (
            <div className="text-[11px] text-gray-600 bg-white/70 p-2 rounded-md border border-gray-100">
              <span className="font-bold text-gray-700">
                {currentLanguage === 'te' ? 'మందు సలహాకు ఇంకా కావలసినవి: ' : currentLanguage === 'hi' ? 'दवा सलाह हेतु शेष आवश्यकता: ' : 'Required for spray consult: '}
              </span>
              <span>{assessment.advisory.still_needed_for_officer_consult.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* VERIFIED PESTICIDE & IDM MANAGEMENT CARD (CIBRC / ICAR-IIMR) */}
      {assessment.pesticide_recommendation && (
        <div className={`card p-4 space-y-3 border-2 shadow-xs ${
          assessment.pesticide_recommendation.recommendation_status === 'verified'
            ? 'border-emerald-300 bg-white'
            : assessment.pesticide_recommendation.recommendation_status === 'no_pesticide_required'
            ? 'border-teal-300 bg-teal-50/40'
            : 'border-amber-300 bg-amber-50/40'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-gray-900">
              <FlaskConical size={16} className={
                assessment.pesticide_recommendation.recommendation_status === 'verified'
                  ? 'text-emerald-700'
                  : assessment.pesticide_recommendation.recommendation_status === 'no_pesticide_required'
                  ? 'text-teal-700'
                  : 'text-amber-700'
              } />
              <span>{dict.pesticide_heading}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
              assessment.pesticide_recommendation.recommendation_status === 'verified'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : assessment.pesticide_recommendation.recommendation_status === 'no_pesticide_required'
                ? 'bg-teal-100 text-teal-900 border border-teal-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              {assessment.pesticide_recommendation.recommendation_status === 'verified'
                ? dict.pesticide_verified_badge
                : assessment.pesticide_recommendation.recommendation_status === 'no_pesticide_required'
                ? dict.pesticide_healthy_badge
                : dict.pesticide_withheld_badge}
            </span>
          </div>

          <p className="text-xs text-gray-800 leading-relaxed font-medium">
            {assessment.pesticide_recommendation.message[currentLanguage] ||
             assessment.pesticide_recommendation.message.en}
          </p>

          {/* Statutory Safety Warning Banner */}
          <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <AlertOctagon size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              {dict.pesticide_statutory_warning}
            </p>
          </div>

          {/* Chemical Interventions Cards */}
          {assessment.pesticide_recommendation.chemical_interventions &&
           assessment.pesticide_recommendation.chemical_interventions.length > 0 && (
            <div className="space-y-3 pt-1">
              {assessment.pesticide_recommendation.chemical_interventions.map((chem: any, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">{chem.product_name}</h4>
                      <p className="text-[11px] text-gray-600">{chem.active_ingredient}</p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      CIBRC
                    </span>
                  </div>

                  {/* Application Rates */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <span className="text-gray-500 font-medium block">{dict.pesticide_dose_per_liter}</span>
                      <span className="font-bold text-[#1E5631]">{chem.recommended_rate}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <span className="text-gray-500 font-medium block">{dict.pesticide_rate_per_acre}</span>
                      <span className="font-bold text-[#1E5631]">{chem.rate_per_acre}</span>
                    </div>
                  </div>

                  {/* Safety intervals: PHI, REI */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <span className="text-gray-500 font-medium block">{dict.pesticide_phi}</span>
                      <span className="font-extrabold text-amber-900">
                        {chem.pre_harvest_interval_days ? `${chem.pre_harvest_interval_days} days` : 'Follow Label'}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <span className="text-gray-500 font-medium block">{dict.pesticide_rei}</span>
                      <span className="font-extrabold text-amber-900">
                        {chem.re_entry_interval_hours ? `${chem.re_entry_interval_hours} hours` : '24 hours'}
                      </span>
                    </div>
                  </div>

                  {/* PPE Requirements */}
                  {chem.ppe_requirements && chem.ppe_requirements.length > 0 && (
                    <div className="text-[11px] bg-white p-2 rounded-lg border border-gray-100">
                      <span className="font-bold text-gray-700 block">{dict.pesticide_ppe}</span>
                      <span className="text-gray-600">{chem.ppe_requirements.join(', ')}</span>
                    </div>
                  )}

                  {/* Environmental precautions */}
                  {chem.environmental_precautions && (
                    <div className="text-[11px] bg-red-50/50 p-2 rounded-lg border border-red-100 text-red-900">
                      <span className="font-bold block">{dict.pesticide_precautions}</span>
                      <span>{chem.environmental_precautions}</span>
                    </div>
                  )}

                  {/* Timing & Conditions */}
                  {chem.application_timing && (
                    <div className="text-[11px] text-gray-600 italic">
                      ℹ️ {chem.application_timing}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Integrated Disease Management (IDM) Practices */}
          {assessment.pesticide_recommendation.integrated_disease_management &&
           assessment.pesticide_recommendation.integrated_disease_management.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-gray-100 text-xs">
              <span className="font-bold text-gray-800 uppercase tracking-wide text-[10px] block">
                Integrated Disease Management (IDM):
              </span>
              <ul className="space-y-1">
                {assessment.pesticide_recommendation.integrated_disease_management.map((idm: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700">
                    <CheckCircle size={13} className="text-[#1E5631] shrink-0 mt-0.5" />
                    <span>{idm}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification Source Citation */}
          <div className="pt-1 border-t border-gray-100 text-[10px] text-gray-500 flex justify-between items-center">
            <span>{dict.pesticide_source_label} {assessment.pesticide_recommendation.source_authority || 'CIBRC & ICAR-IIMR'}</span>
            <span>Reviewed: {assessment.pesticide_recommendation.last_reviewed_date || '2026-10-10'}</span>
          </div>
        </div>
      )}

      {/* SECTION 12: Official Agricultural Citation & Strict Chemical Safety Disclaimer */}

      <div className="space-y-3">
        {/* Strict Chemical Disclaimer */}
        <div className="card border-2 border-red-200 bg-red-50/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-900 font-extrabold text-xs uppercase tracking-wider">
            <AlertOctagon size={16} className="text-red-600 shrink-0" />
            <span>{dict.chemical_safety_heading}</span>
          </div>

          <p className="text-xs text-red-800 leading-relaxed font-semibold">
            {dict.chemical_disclaimer}
          </p>

          {chemicalAdvice && (
            <div className="pt-1.5 border-t border-red-200/70 text-xs text-gray-800 leading-relaxed">
              <span className="font-bold text-gray-900">
                {currentLanguage === 'te' ? 'యూనివర్సిటీ ప్రామాణిక సూచన: ' : currentLanguage === 'hi' ? 'मानक विश्वविद्यालय संदर्भ: ' : 'Standard Extension Reference: '}
              </span>
              {chemicalAdvice}
            </div>
          )}
        </div>

        {/* Official Extension Source */}
        <div className="card p-3 bg-gray-50 flex items-start gap-2 text-[11px] text-gray-600">
          <BookOpen size={15} className="text-gray-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-700">{dict.official_source_label} </span>
            <span>{officialSource}</span>
          </div>
        </div>
      </div>

      {/* Flow Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onProceedToSampling}
          className="btn-primary w-full shadow-md text-sm"
        >
          <ClipboardList size={18} />
          <span>{dict.record_field_sample_btn}</span>
          <ArrowRight size={18} />
        </button>

        <button
          onClick={onProceedToQuestions}
          className="btn-secondary w-full text-xs"
        >
          <FileQuestion size={16} />
          <span>{dict.ask_questions_btn}</span>
        </button>
      </div>
    </div>
  );
};
