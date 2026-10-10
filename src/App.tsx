import React, { useState, useEffect, useMemo } from 'react';
import {
  WorkflowState,
  SupportedLanguage,
  FieldRecord,
  InspectionRecord,
  QualityResult,
  AssessmentResult,
  DifferentialAnswers,
  CropVerifyResult
} from './types';
import { dbService } from './services/db';
import { apiService } from './services/api';
import { VoiceAssistant, WORKFLOW_CONFIG } from './features/voice/voiceStateMachine';
import { VoiceGuideBar } from './features/voice/VoiceGuideBar';
import { translations } from './i18n/translations';

// Screens
import { WelcomeLanguageScreen } from './screens/WelcomeLanguageScreen';
import { HomeScreen } from './screens/HomeScreen';
import { FieldSelectScreen } from './screens/FieldSelectScreen';
import { CropSelectScreen } from './screens/CropSelectScreen';
import { CaptureScreen } from './screens/CaptureScreen';
import { QualityGateScreen } from './screens/QualityGateScreen';
import { CropVerificationScreen } from './screens/CropVerificationScreen';
import { AssessmentScreen } from './screens/AssessmentScreen';
import { DifferentialQuestionsScreen } from './screens/DifferentialQuestionsScreen';
import { GuidanceScreen } from './screens/GuidanceScreen';
import { FieldSamplingScreen } from './screens/FieldSamplingScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { WeatherSensorsScreen } from './screens/WeatherSensorsScreen';
import { OfflineSyncScreen } from './screens/OfflineSyncScreen';
import { HelpSettingsScreen } from './screens/HelpSettingsScreen';

// Navigation icons
import { Home, ScanLine, Clock, CloudSun, Database } from 'lucide-react';

export const App: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => dbService.getSavedLanguage());
  const [currentState, setCurrentState] = useState<WorkflowState>('WELCOME');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Data collections
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Active workflow state
  const [selectedField, setSelectedField] = useState<FieldRecord | undefined>();
  const [selectedCrop, setSelectedCrop] = useState<string>('maize');
  const [capturedBlob, setCapturedBlob] = useState<Blob | File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [qualityResult, setQualityResult] = useState<QualityResult | undefined>();
  const [isQualityLoading, setIsQualityLoading] = useState<boolean>(false);
  const [cropVerifyResult, setCropVerifyResult] = useState<CropVerifyResult | undefined>();
  const [isCropVerifyLoading, setIsCropVerifyLoading] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | undefined>();
  const [isAssessmentLoading, setIsAssessmentLoading] = useState<boolean>(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [differentialAnswers, setDifferentialAnswers] = useState<DifferentialAnswers>({});
  const [sampleCount, setSampleCount] = useState<number>(20);
  const [symptomaticCount, setSymptomaticCount] = useState<number>(4);
  const [uncertainCount, setUncertainCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const dict = translations[currentLanguage];

  // Voice Assistant Singleton
  const assistant = useMemo(() => new VoiceAssistant(currentLanguage), []);

  // Update assistant language and html lang attribute when changed
  useEffect(() => {
    assistant.setLanguage(currentLanguage);
    dbService.setSavedLanguage(currentLanguage);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage, assistant]);

  // Network online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load IndexedDB records
  const refreshLocalData = async () => {
    try {
      const [allFields, allInspections, pendingCount] = await Promise.all([
        dbService.getFields(),
        dbService.getInspections(),
        dbService.getPendingSyncCount()
      ]);
      setFields(allFields);
      setInspections(allInspections);
      setPendingSyncCount(pendingCount);

      // Default sample field if brand new install
      if (allFields.length === 0) {
        const sampleField: FieldRecord = {
          id: 'field-demo-01',
          name: 'Main Plot (ప్రధాన చేను)',
          crop: 'maize',
          acreage: 2.5,
          planting_date: '2026-06-15',
          created_at: new Date().toISOString()
        };
        await dbService.saveField(sampleField);
        setFields([sampleField]);
      }
    } catch (err) {
      console.warn('IndexedDB initial load error:', err);
    }
  };

  useEffect(() => {
    refreshLocalData();
  }, []);

  // Speak current state instruction upon state transition
  const transitionTo = (nextState: WorkflowState, autoSpeak = true) => {
    assistant.stopSpeaking();
    setCurrentState(nextState);
    if (autoSpeak) {
      // Short delay to allow screen mounting
      setTimeout(() => {
        assistant.speakCurrentState(nextState);
      }, 300);
    }
  };

  // 1. Language Selected
  const handleSelectLanguage = (lang: SupportedLanguage) => {
    assistant.stopSpeaking();
    setCurrentLanguage(lang);
    dbService.setSavedLanguage(lang);
  };

  // 2. Start new inspection flow
  const handleStartInspection = (preselectedField?: FieldRecord) => {
    const targetField = preselectedField || fields[0];
    if (preselectedField) {
      setSelectedField(preselectedField);
      setSelectedCrop(preselectedField.crop || 'maize');
    } else {
      setSelectedField(targetField);
      setSelectedCrop(targetField?.crop || 'maize');
    }
    setCapturedBlob(undefined);
    setPreviewUrl(undefined);
    setQualityResult(undefined);
    setCropVerifyResult(undefined);
    setIsCropVerifyLoading(false);
    setAssessmentResult(undefined);
    setAssessmentError(null);
    setDifferentialAnswers({});
    setSampleCount(20);
    setSymptomaticCount(4);
    setUncertainCount(1);
    setNotes('');

    if (preselectedField) {
      // Revisit: Field is already chosen, advance directly to crop selection
      transitionTo('CROP_SELECTION');
    } else {
      transitionTo('FIELD_SELECTION_OR_CREATION');
    }
  };

  // 3. Field selected
  const handleSelectField = (field: FieldRecord) => {
    setSelectedField(field);
    setSelectedCrop(field.crop || 'maize');
    transitionTo('CROP_SELECTION');
  };

  // 4. Crop selected
  const handleCropSelected = (crop: string) => {
    setSelectedCrop(crop);
  };

  // 5. Image selected
  const handleImageSelected = async (blob: Blob | File, url: string) => {
    setCapturedBlob(blob);
    setPreviewUrl(url);
  };

  // 6. Proceed to Quality Gate
  const handleProceedToQualityCheck = async () => {
    if (!capturedBlob) return;
    transitionTo('IMAGE_QUALITY_CHECK');
    setIsQualityLoading(true);
    const result = await apiService.checkImageQuality(capturedBlob);
    setQualityResult(result);
    setIsQualityLoading(false);
  };

  // 7. Proceed to Crop Verification
  const handleProceedToCropVerification = async () => {
    transitionTo('CROP_VERIFICATION');
    if (capturedBlob) {
      setIsCropVerifyLoading(true);
      const res = await apiService.verifyCropImage(capturedBlob, selectedCrop);
      setCropVerifyResult(res);
      setIsCropVerifyLoading(false);
    }
  };

  // 8. Confirm Crop and Run Assessment
  const handleConfirmCropAndDiagnose = async (confirmedCrop?: string) => {
    if (!capturedBlob) return;
    const cropToUse = confirmedCrop || selectedCrop;
    if (confirmedCrop && confirmedCrop !== selectedCrop) {
      setSelectedCrop(confirmedCrop);
    }
    transitionTo('ASSESSMENT');
    setIsAssessmentLoading(true);
    setAssessmentError(null);
    setAssessmentResult(undefined);
    let result: AssessmentResult;
    try {
      result = await apiService.predictCropHealth(capturedBlob, cropToUse, false, selectedField?.id);
    } catch (err: any) {
      // Show the real reason (server unreachable, crop-verification gate, weights not loaded...) instead of a fake result
      setAssessmentError(err?.message || 'Server unreachable');
      setIsAssessmentLoading(false);
      return;
    }
    setAssessmentResult(result);
    setIsAssessmentLoading(false);

    // Speak initial result headline with invitation to tap Speak Report
    if (result && result.display_name) {
      const conditionName = result.display_name[currentLanguage] || result.display_name.en;
      const confPercent = Math.round(result.confidence * 100);
      if (currentLanguage === 'te') {
        assistant.speak(`రోగ నిర్ధారణ పూర్తయింది. ఫలితం: ${conditionName}. విశ్వసనీయత: ${confPercent} శాతం. పూర్తి నివేదిక వినడానికి వాయిస్ నివేదిక బటన్ నొక్కండి.`, true);
      } else if (currentLanguage === 'hi') {
        assistant.speak(`रोग जाँच पूर्ण हुई। परिणाम: ${conditionName}। विश्वास: ${confPercent} प्रतिशत। पूरी रिपोर्ट सुनने के लिए रिपोर्ट सुनें बटन दबाएँ।`, true);
      } else {
        assistant.speak(`Assessment complete. Detected: ${conditionName}. Confidence: ${confPercent} percent. Tap Speak Report for full guidance.`, true);
      }
    }
  };

  // 8b. Multi-leaf plant assessment
  const handleProceedPlantAssessment = async (leaves: Array<{ blob: Blob | File; url: string }>) => {
    transitionTo('ASSESSMENT');
    setIsAssessmentLoading(true);
    setAssessmentError(null);
    setAssessmentResult(undefined);

    try {
      const files = leaves.map(l => l.blob);
      const plantRes = await apiService.assessPlantLeaves(files, selectedCrop, undefined, selectedField?.id);

      const DISEASE_NAMES_MAP: Record<string, { en: string; te: string; hi: string }> = {
        healthy: { en: "Healthy Crop Leaf", te: "ఆరోగ్యకరమైన ఆకు", hi: "स्वस्थ पत्ती" },
        common_rust: { en: "Common Rust (Puccinia sorghi)", te: "మొక్కజొన్న కుంకుమ తెగులు (కామన్ రస్ట్)", hi: "सामान्य रतुआ (कॉमन रस्ट)" },
        southern_rust: { en: "Southern Rust (Puccinia polysora)", te: "సదరన్ రస్ట్ (దక్షిణ కుంకుమ తెగులు)", hi: "दक्षिणी रतुआ (सदर्न रस्ट)" },
        northern_leaf_blight: { en: "Northern Leaf Blight (Exserohilum turcicum)", te: "టర్సికమ్ ఆకు ఎండు తెగులు", hi: "उत्तरी पत्ती झुलसा" },
        gray_leaf_spot: { en: "Gray Leaf Spot (Cercospora zeae-maydis)", te: "బూడిద రంగు మచ్చ తెగులు", hi: "ग्रे लीफ स्पॉट" },
        black_sigatoka: { en: "Black Sigatoka (Pseudocercospora fijiensis)", te: "నల్ల సిగటోకా తెగులు", hi: "ब्लैक सिगाटोका" },
        bacterial_wilt: { en: "Bacterial Wilt (Xanthomonas vasicola)", te: "బ్యాక్టీరియల్ విల్ట్", hi: "जीवाणु म्लानि" }
      };

      const predKey = plantRes.plant_level_prediction;
      const dispName = DISEASE_NAMES_MAP[predKey] || {
        en: predKey.replace(/_/g, ' '),
        te: predKey.replace(/_/g, ' '),
        hi: predKey.replace(/_/g, ' ')
      };

      const mapped: AssessmentResult = {
        crop: plantRes.crop,
        predicted_class: predKey,
        display_name: dispName,
        confidence: plantRes.plant_level_confidence,
        is_uncertain: plantRes.is_uncertain,
        uncertainty_reason: plantRes.is_uncertain ? {
          en: plantRes.disagreement_summary || "Plant assessment is uncertain or conflicting symptoms were detected across leaves.",
          te: plantRes.disagreement_summary || "ఆకుల నడుమ తేడాలు ఉన్నాయి లేదా ఫలితం అనిశ్చితంగా ఉంది.",
          hi: plantRes.disagreement_summary || "पत्तियों में लक्षण भिन्न हैं या परिणाम अनिश्चित है।"
        } : null,
        all_probabilities: Object.entries(plantRes.average_class_probabilities).map(([lbl, p]) => ({
          label: lbl,
          name: lbl.replace(/_/g, ' '),
          probability: p,
          percentage: Math.round(p * 100)
        })),
        model_version: 'multileaf_consensus_v1.0',
        source_mode: plantRes.source_mode as any,
        latency_ms: plantRes.latency_ms,
        differential_possibilities: [
          {
            condition: "Southern Rust (Puccinia polysora)",
            similarity: "Similar orange/brown pustules on leaves.",
            differentiation: "Check if pustules are on both leaf sides (common rust) or primarily upper side (southern rust)."
          }
        ],
        management_guidance: {
          summary: plantRes.disagreement_summary || "Plant multi-leaf evaluation complete.",
          cultural_actions: [
            "Monitor upper canopy around silking stage.",
            "Avoid excessive overhead sprinkler irrigation that lengthens leaf wetness.",
            "Select certified rust-resistant hybrids for subsequent plantings."
          ],
          chemical_advice: "Follow farm-hygiene and cultural measures only. For chemical advice, consult your local Agricultural Officer or KVK.",
          official_source: "ICAR-IIMR & CIBRC Integrated Disease Management"
        },
        highlight: plantRes.leaf_assessments.find(l => l.highlight)?.highlight || null,
        pesticide_recommendation: plantRes.pesticide_recommendation,
        lookalike_comparison: plantRes.lookalike_comparison,
        plant_assessment: plantRes
      };

      setAssessmentResult(mapped);

      const conditionName = dispName[currentLanguage] || dispName.en;
      const confPercent = Math.round(plantRes.plant_level_confidence * 100);
      if (currentLanguage === 'te') {
        assistant.speak(`మొక్క సమగ్ర నిర్ధారణ పూర్తయింది. ఏకాభిప్రాయ ఫలితం: ${conditionName}. విశ్వసనీయత: ${confPercent} శాతం.`, true);
      } else if (currentLanguage === 'hi') {
        assistant.speak(`पौधे का समग्र मूल्यांकन पूर्ण हुआ। आम सहमति परिणाम: ${conditionName}। विश्वास: ${confPercent} प्रतिशत।`, true);
      } else {
        assistant.speak(`Plant-level consensus complete. Verdict: ${conditionName}. Confidence: ${confPercent} percent.`, true);
      }
    } catch (err: any) {
      setAssessmentError(err?.message || 'Plant assessment failed');
    } finally {
      setIsAssessmentLoading(false);
    }
  };


  // 9. Save Inspection Record
  const handleSaveInspection = async () => {
    if (!selectedField) return;

    let base64Url = previewUrl;
    // Attempt blob conversion for offline persistent thumbnail
    if (capturedBlob && capturedBlob instanceof Blob) {
      try {
        const reader = new FileReader();
        base64Url = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(capturedBlob);
        });
      } catch (err) {}
    }

    const newInspection: InspectionRecord = {
      id: 'insp-' + Date.now(),
      field_id: selectedField.id,
      field_name: selectedField.name,
      crop: selectedCrop,
      visited_at: new Date().toISOString(),
      sample_count: sampleCount,
      symptomatic_count: symptomaticCount,
      uncertain_count: uncertainCount,
      predicted_condition: assessmentResult?.predicted_class,
      confidence: assessmentResult?.confidence,
      provenance: assessmentResult?.source_mode === 'model_inference' ? 'mobilenet_v2_v1.0' : 'demo_workflow',
      notes: notes.trim() || undefined,
      image_data_url: base64Url,
      quality_result: qualityResult,
      assessment_result: assessmentResult,
      differential_answers: differentialAnswers,
      sync_status: 'saved_locally'
    };

    await dbService.saveInspection(newInspection);
    await refreshLocalData();

    transitionTo('HISTORY');
    if (currentLanguage === 'te') {
      assistant.speak('తనిఖీ విజయవంతంగా సేవ్ చేయబడింది. చరిత్ర స్క్రీన్‌లో మునుపటి తనిఖీలతో పోల్చండి.');
    } else if (currentLanguage === 'hi') {
      assistant.speak('निरीक्षण सफलतापूर्वक सहेजा गया। इतिहास स्क्रीन में पिछले दौरों से तुलना करें।');
    } else {
      assistant.speak('Inspection saved successfully. You can now compare visits in the history screen.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F2937] flex flex-col justify-between">
      {/* Top Voice Guide Companion Bar (shown on all screens except initial Welcome) */}
      {currentState !== 'WELCOME' && (
        <VoiceGuideBar
          assistant={assistant}
          currentLanguage={currentLanguage}
          currentState={currentState}
        />
      )}

      {/* Main Screen Router */}
      <main className="flex-1">
        {currentState === 'WELCOME' && (
          <WelcomeLanguageScreen
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onContinue={() => transitionTo('HOME')}
            assistant={assistant}
          />
        )}

        {currentState === 'HOME' && (
          <HomeScreen
            currentLanguage={currentLanguage}
            isOnline={isOnline}
            pendingSyncCount={pendingSyncCount}
            recentInspection={inspections[0]}
            fields={fields}
            onStartInspection={handleStartInspection}
            onNavigate={(screen) => transitionTo(screen)}
            onChangeLanguage={() => transitionTo('WELCOME')}
          />
        )}

        {currentState === 'FIELD_SELECTION_OR_CREATION' && (
          <FieldSelectScreen
            currentLanguage={currentLanguage}
            fields={fields}
            selectedFieldId={selectedField?.id}
            onSelectField={handleSelectField}
            onBack={() => transitionTo('HOME')}
          />
        )}

        {currentState === 'CROP_SELECTION' && (
          <CropSelectScreen
            currentLanguage={currentLanguage}
            selectedCrop={selectedCrop}
            onSelectCrop={handleCropSelected}
            onBack={() => transitionTo('FIELD_SELECTION_OR_CREATION')}
            onContinue={() => transitionTo('IMAGE_CAPTURE')}
          />
        )}

        {currentState === 'IMAGE_CAPTURE' && (
          <CaptureScreen
            currentLanguage={currentLanguage}
            crop={selectedCrop}
            imageBlob={capturedBlob}
            previewUrl={previewUrl}
            onImageSelected={handleImageSelected}
            onBack={() => transitionTo('CROP_SELECTION')}
            onProceed={handleProceedToQualityCheck}
            onProceedPlantAssessment={handleProceedPlantAssessment}
          />

        )}

        {currentState === 'IMAGE_QUALITY_CHECK' && (
          <QualityGateScreen
            currentLanguage={currentLanguage}
            previewUrl={previewUrl}
            qualityResult={qualityResult}
            isLoading={isQualityLoading}
            onRetake={() => transitionTo('IMAGE_CAPTURE')}
            onProceed={handleProceedToCropVerification}
          />
        )}

        {currentState === 'CROP_VERIFICATION' && (
          <CropVerificationScreen
            currentLanguage={currentLanguage}
            crop={selectedCrop}
            previewUrl={previewUrl}
            verifyResult={cropVerifyResult}
            isLoading={isCropVerifyLoading}
            onConfirm={handleConfirmCropAndDiagnose}
            onChangeCrop={() => transitionTo('CROP_SELECTION')}
            onRetake={() => transitionTo('IMAGE_CAPTURE')}
            onBack={() => transitionTo('IMAGE_QUALITY_CHECK')}
          />
        )}

        {currentState === 'ASSESSMENT' && (
          <AssessmentScreen
            currentLanguage={currentLanguage}
            assessment={assessmentResult}
            previewUrl={previewUrl}
            crop={selectedCrop}
            isLoading={isAssessmentLoading}
            error={assessmentError}
            onRetry={handleConfirmCropAndDiagnose}
            assistant={assistant}
            onProceedToQuestions={() => transitionTo('FOLLOW_UP_QUESTIONS')}
            onProceedToGuidance={() => transitionTo('MANAGEMENT_GUIDANCE')}
            onProceedToSampling={() => transitionTo('FIELD_SAMPLING')}
            onBack={() => transitionTo('CROP_VERIFICATION')}
          />
        )}

        {currentState === 'FOLLOW_UP_QUESTIONS' && (
          <DifferentialQuestionsScreen
            currentLanguage={currentLanguage}
            answers={differentialAnswers}
            onAnswersChange={setDifferentialAnswers}
            onProceed={() => transitionTo('MANAGEMENT_GUIDANCE')}
            onBack={() => transitionTo('ASSESSMENT')}
          />
        )}

        {currentState === 'MANAGEMENT_GUIDANCE' && (
          <GuidanceScreen
            currentLanguage={currentLanguage}
            assessment={assessmentResult}
            onProceedToSampling={() => transitionTo('FIELD_SAMPLING')}
            onBack={() => transitionTo('ASSESSMENT')}
          />
        )}

        {currentState === 'FIELD_SAMPLING' && (
          <FieldSamplingScreen
            currentLanguage={currentLanguage}
            fieldName={selectedField?.name}
            crop={selectedCrop}
            sampleCount={sampleCount}
            symptomaticCount={symptomaticCount}
            uncertainCount={uncertainCount}
            notes={notes}
            onCountsChange={(s, sym, un) => {
              setSampleCount(s);
              setSymptomaticCount(sym);
              setUncertainCount(un);
            }}
            onNotesChange={setNotes}
            onSave={handleSaveInspection}
            onBack={() => transitionTo('MANAGEMENT_GUIDANCE')}
          />
        )}

        {currentState === 'HISTORY' && (
          <HistoryScreen
            currentLanguage={currentLanguage}
            inspections={inspections}
            fields={fields}
            onRevisitField={(fieldId) => {
              const f = fields.find(item => item.id === fieldId);
              handleStartInspection(f);
            }}
            onBack={() => transitionTo('HOME')}
          />
        )}

        {currentState === 'WEATHER_SENSORS' && (
          <WeatherSensorsScreen
            currentLanguage={currentLanguage}
            onBack={() => transitionTo('HOME')}
          />
        )}

        {currentState === 'OFFLINE_SYNC' && (
          <OfflineSyncScreen
            currentLanguage={currentLanguage}
            isOnline={isOnline}
            fields={fields}
            inspections={inspections}
            onDataReset={refreshLocalData}
            onBack={() => transitionTo('HOME')}
          />
        )}

        {currentState === 'HELP_SETTINGS' && (
          <HelpSettingsScreen
            currentLanguage={currentLanguage}
            onSelectLanguage={handleSelectLanguage}
            onBack={() => transitionTo('HOME')}
          />
        )}
      </main>

      {/* Bottom Sticky Mobile Navigation Bar */}
      {currentState !== 'WELCOME' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-2 px-3 shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-around">
            {/* Home */}
            <button
              onClick={() => transitionTo('HOME')}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                currentState === 'HOME' ? 'text-[#1E5631]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Home size={20} />
              <span>{dict.nav_home}</span>
            </button>

            {/* Check / Inspect */}
            <button
              onClick={() => handleStartInspection()}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                ['FIELD_SELECTION_OR_CREATION', 'CROP_SELECTION', 'IMAGE_CAPTURE', 'IMAGE_QUALITY_CHECK', 'CROP_VERIFICATION', 'ASSESSMENT', 'FOLLOW_UP_QUESTIONS', 'MANAGEMENT_GUIDANCE', 'FIELD_SAMPLING'].includes(currentState)
                  ? 'text-[#1E5631]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ScanLine size={20} />
              <span>{dict.nav_inspect}</span>
            </button>

            {/* History */}
            <button
              onClick={() => transitionTo('HISTORY')}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                currentState === 'HISTORY' ? 'text-[#1E5631]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Clock size={20} />
              <span>{dict.nav_history}</span>
            </button>

            {/* Weather & Sensors */}
            <button
              onClick={() => transitionTo('WEATHER_SENSORS')}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                currentState === 'WEATHER_SENSORS' ? 'text-[#1E5631]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <CloudSun size={20} />
              <span>{dict.nav_weather}</span>
            </button>

            {/* Sync */}
            <button
              onClick={() => transitionTo('OFFLINE_SYNC')}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors relative ${
                currentState === 'OFFLINE_SYNC' ? 'text-[#1E5631]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Database size={20} />
              <span>{dict.nav_sync}</span>
              {pendingSyncCount > 0 && (
                <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};
