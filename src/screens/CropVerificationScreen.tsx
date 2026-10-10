import React from 'react';
import { ArrowLeft, Check, AlertTriangle, RefreshCw, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';
import { SupportedLanguage, CropVerifyResult } from '../types';

/**
 * Crop verification screen.
 *
 * Bug fixed: the header showed the detected crop (banana) while the confirm
 * text was hard-coded to "maize". Now there is ONE source of truth, `crop`,
 * and every label and sentence is built from it.
 *
 * Props are deliberately simple. Wire them to your existing state:
 *   crop        - what the app currently believes ('banana' | 'maize')
 *   mismatch    - true only if the model disagrees with the crop the farmer picked
 *   detected    - what the model thinks (only needed when mismatch is true)
 */
export type Crop = 'banana' | 'maize';
export type Lang = 'en' | 'te' | 'hi';

export const CROP_NAME: Record<Crop, Record<Lang, string>> = {
  banana: { en: 'Banana', te: 'అరటి', hi: 'केला' },
  maize: { en: 'Maize', te: 'మొక్కజొన్న', hi: 'मक्का' },
};

export const T = {
  title: { en: 'Confirm your crop', te: 'మీ పంటను నిర్ధారించండి', hi: 'अपनी फसल की पुष्टि करें' },
  confirm: {
    en: (c: string) => `Yes, this is a ${c} leaf`,
    te: (c: string) => `అవును, ఇది ${c} ఆకు`,
    hi: (c: string) => `हाँ, यह ${c} की पत्ती है`,
  },
  change: { en: 'No, change crop', te: 'కాదు, పంటను మార్చండి', hi: 'नहीं, फसल बदलें' },
  mismatch: {
    en: (picked: string, seen: string) => `You chose ${picked}, but the photo looks more like ${seen}. Which is right?`,
    te: (picked: string, seen: string) => `మీరు ${picked} ఎంచుకున్నారు, కానీ ఫోటో ${seen} లాగా ఉంది. ఏది సరైనది?`,
    hi: (picked: string, seen: string) => `आपने ${picked} चुना, लेकिन फोटो ${seen} जैसी दिखती है। कौन सा सही है?`,
  },
  not_leaf: {
    en: 'The uploaded photo does not appear to contain a plant leaf (insufficient foliage detected). Please take a photo of a crop leaf.',
    te: 'అప్‌లోడ్ చేసిన చిత్రంలో మొక్క ఆకు కనిపించడం లేదు. దయచేసి పంట ఆకు యొక్క స్పష్టమైన ఫోటో తీయండి.',
    hi: 'अपलोड की गई फ़ोटो में पौधे की पत्ती नहीं दिख रही है। कृपया फसल की पत्ती की स्पष्ट फ़ोटो लें।',
  },
  unsupported: {
    en: 'Only Maize and Banana are certified for AI disease diagnosis in this release.',
    te: 'ఈ విడుదలలో కేవలం మొక్కజొన్న మరియు అరటి పంటలకు మాత్రమే AI రోగ నిర్ధారణ అందుబాటులో ఉంది.',
    hi: 'इस संस्करण में केवल मक्का और केला के लिए AI रोग निदान प्रमाणित है।',
  },
};

export interface Props {
  crop: Crop | string;
  lang?: Lang;
  currentLanguage?: SupportedLanguage;
  mismatch?: boolean;
  detected?: Crop;
  previewUrl?: string;
  verifyResult?: CropVerifyResult;
  isLoading?: boolean;
  onConfirm: (crop: Crop) => void;
  onChooseOther?: () => void;
  onChangeCrop?: () => void;
  onRetake?: () => void;
  onBack?: () => void;
}

export function CropVerificationScreen({
  crop,
  lang,
  currentLanguage,
  mismatch,
  detected,
  previewUrl,
  verifyResult,
  isLoading = false,
  onConfirm,
  onChooseOther,
  onChangeCrop,
  onRetake,
  onBack,
}: Props) {
  const activeLang: Lang = (lang || currentLanguage || 'en') as Lang;
  const rawCropStr = (crop || '').toLowerCase().trim();
  const isCotton = rawCropStr === 'cotton';
  const normalizedCrop: Crop = rawCropStr === 'banana' ? 'banana' : 'maize';

  const isNotLeaf = verifyResult && !verifyResult.is_plant_leaf;
  const isMismatch = mismatch ?? Boolean(
    verifyResult && (
      verifyResult.status === 'crop_mismatch' ||
      verifyResult.status === 'crop_mismatch_warning' ||
      verifyResult.decision === 'halt_mismatch' ||
      verifyResult.decision === 'warn_mismatch_allow_override'
    )
  );

  const detectedFromBackend = verifyResult?.detected_crop && (verifyResult.detected_crop === 'banana' || verifyResult.detected_crop === 'maize')
    ? (verifyResult.detected_crop as Crop)
    : undefined;
  const effectiveDetected: Crop | undefined = detected ?? detectedFromBackend;

  const picked = CROP_NAME[normalizedCrop][activeLang];
  const other: Crop = normalizedCrop === 'banana' ? 'maize' : 'banana';
  const seen = CROP_NAME[effectiveDetected ?? other][activeLang];

  const handleChooseOther = onChooseOther || onChangeCrop || (() => {});

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h2 className="text-lg font-bold text-gray-900">{T.title[activeLang]}</h2>
        <div className="w-9" />
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-16/9 flex items-center justify-center shadow-xs relative">
          <img src={previewUrl} alt="Leaf preview" className="w-full h-full object-contain" />
          {verifyResult && (
            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md bg-black/60 text-white flex items-center gap-1.5">
              <span>{verifyResult.foliage_coverage_pct}% Foliage</span>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card p-6 text-center space-y-3 bg-white border border-gray-200">
          <div className="w-10 h-10 border-4 border-[#1E5631]/20 border-t-[#1E5631] rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-gray-900">
            {activeLang === 'te' ? 'ఆకు పత్రహరితాన్ని విశ్లేషిస్తోంది...' : activeLang === 'hi' ? 'पत्ती की जाँच हो रही है...' : 'Analyzing Botanical Foliage Features...'}
          </div>
        </div>
      )}

      {/* Case 1: Rejection - Not a Plant Leaf */}
      {!isLoading && isNotLeaf && (
        <div className="card p-5 space-y-4 border-2 border-red-300 bg-red-50/60 animate-in fade-in">
          <div className="flex items-center gap-2 text-red-900 font-extrabold text-xs uppercase tracking-wider">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>{activeLang === 'te' ? 'మొక్క ఆకు గుర్తించబడలేదు' : activeLang === 'hi' ? 'पौधे की पत्ती नहीं मिली' : 'Plant Leaf Not Detected'}</span>
          </div>
          <p className="text-xs text-red-800 leading-relaxed font-medium">
            {verifyResult?.message?.[activeLang] || T.not_leaf[activeLang]}
          </p>
          {verifyResult && (
            <div className="bg-white/80 border border-red-200 rounded-xl p-3 text-xs text-gray-700">
              <span className="font-bold">Foliage Coverage Detected: </span>
              <span className="text-red-600 font-bold">{verifyResult.foliage_coverage_pct}%</span>
            </div>
          )}
          <div className="space-y-2 pt-1">
            {onRetake && (
              <button onClick={onRetake} className="btn-primary w-full shadow-md text-sm bg-red-700 hover:bg-red-800">
                <RotateCcw size={18} />
                <span>{activeLang === 'te' ? 'మళ్లీ ఫోటో తీయండి' : activeLang === 'hi' ? 'दोबारा फ़ोटो लें' : 'Retake Photo'}</span>
              </button>
            )}
            {onBack && (
              <button onClick={onBack} className="btn-secondary w-full text-xs">
                <span>{activeLang === 'te' ? 'వెనుకకు' : activeLang === 'hi' ? 'पीछे' : 'Back'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Case 2: Unsupported Crop (e.g. Cotton) */}
      {!isLoading && !isNotLeaf && isCotton && (
        <div className="card p-5 space-y-4 border-2 border-amber-400 bg-amber-50/60 animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
            <ShieldAlert size={18} className="text-amber-600 shrink-0" />
            <span>{activeLang === 'te' ? 'పంట రోగ నిర్ధారణ అందుబాటులో లేదు' : activeLang === 'hi' ? 'फसल रोग निदान उपलब्ध नहीं है' : 'Crop Diagnosis Not Certified'}</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            {T.unsupported[activeLang]}
          </p>
          <div className="space-y-2 pt-1">
            <button onClick={handleChooseOther} className="btn-primary w-full shadow-md text-sm">
              <RefreshCw size={18} />
              <span>{T.change[activeLang]}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Verification Card */}
      {!isLoading && !isNotLeaf && !isCotton && (
        <div className="card p-5 space-y-4 border-2 border-emerald-600/30 bg-emerald-50/20">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
            <CheckCircle2 size={18} className="text-[#1E5631] shrink-0" />
            <span>
              {activeLang === 'te' ? 'బొటానికల్ ఆకు జాతి పరిశీలన' : activeLang === 'hi' ? 'वानस्पतिक पत्ती प्रजाति अवलोकन' : 'Botanical Leaf Verification'}
              {verifyResult ? ` (${verifyResult.foliage_coverage_pct}% Foliage)` : ''}
            </span>
          </div>

          <div style={{ fontSize: 22, fontWeight: 700 }} className="text-gray-900">
            {picked}
          </div>

          <p className="text-[11px] text-gray-500">
            Botanical leaf morphology and visual venation verification ensuring honest botanical policy.
          </p>

          {isMismatch && (
            <p
              role="alert"
              style={{ background: '#fff4d6', padding: 12, borderRadius: 10 }}
              className="text-xs text-amber-900 font-medium leading-relaxed border border-amber-200"
            >
              {T.mismatch[activeLang](picked, seen)}
            </p>
          )}

          {/* Both buttons use single source of truth, so they can never disagree with the header */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => onConfirm(normalizedCrop)}
              className="btn-primary w-full shadow-md text-sm"
            >
              <Check size={18} />
              <span>{T.confirm[activeLang](picked)}</span>
            </button>

            {isMismatch && effectiveDetected && effectiveDetected !== normalizedCrop && (
              <button
                onClick={() => onConfirm(effectiveDetected)}
                className="btn-secondary w-full text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100/60"
              >
                <Check size={16} />
                <span>{T.confirm[activeLang](seen)}</span>
              </button>
            )}

            <button
              onClick={handleChooseOther}
              className="btn-secondary w-full text-xs"
            >
              <span>{T.change[activeLang]}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CropVerificationScreen;
