import React from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, Eye, Sun, Maximize2 } from 'lucide-react';
import { QualityResult, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  previewUrl?: string;
  qualityResult?: QualityResult;
  isLoading: boolean;
  onRetake: () => void;
  onProceed: () => void;
}

export const QualityGateScreen: React.FC<Props> = ({
  currentLanguage,
  previewUrl,
  qualityResult,
  isLoading,
  onRetake,
  onProceed
}) => {
  const dict = translations[currentLanguage];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-[#1E5631]/20 border-t-[#1E5631] animate-spin" />
        <div>
          <h3 className="text-base font-bold text-gray-900">{dict.quality_title}...</h3>
          <p className="text-xs text-gray-500 mt-1">Checking image blur, lighting, and resolution</p>
        </div>
      </div>
    );
  }

  const passed = qualityResult?.passed ?? true;
  const feedbackText = qualityResult?.farmer_feedback
    ? qualityResult.farmer_feedback[currentLanguage] || qualityResult.farmer_feedback.en
    : dict.quality_advice;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onRetake}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{dict.quality_title}</h2>
        <div className="w-9" />
      </div>

      {/* Image Preview Thumbnail */}
      {previewUrl && (
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-16/9 flex items-center justify-center shadow-xs">
          <img src={previewUrl} alt="Evaluated leaf" className="w-full h-full object-contain" />
        </div>
      )}

      {/* Quality Gate Status Banner */}
      <div className={`card p-4 border-2 space-y-2 ${
        passed ? 'border-emerald-500 bg-emerald-50/50' : 'border-amber-400 bg-amber-50/50'
      }`}>
        <div className="flex items-center gap-2">
          {passed ? (
            <CheckCircle2 size={22} className="text-emerald-700 shrink-0" />
          ) : (
            <AlertTriangle size={22} className="text-amber-700 shrink-0" />
          )}
          <span className={`text-sm font-extrabold ${passed ? 'text-emerald-900' : 'text-amber-900'}`}>
            {passed ? dict.quality_passed : dict.quality_failed}
          </span>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed font-medium">
          {feedbackText}
        </p>
      </div>

      {/* Heuristic Breakdown Cards */}
      {qualityResult && (
        <div className="grid grid-cols-3 gap-2">
          {/* Sharpness / Blur */}
          <div className="card p-3 text-center space-y-1">
            <div className="w-7 h-7 rounded-lg bg-gray-100 mx-auto flex items-center justify-center text-gray-600">
              <Eye size={16} />
            </div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase">{dict.blur_check_label}</div>
            <div className={`text-xs font-bold ${qualityResult.is_blurry ? 'text-amber-600' : 'text-emerald-700'}`}>
              {qualityResult.is_blurry ? 'Blurry' : 'Sharp'}
            </div>
            <div className="text-[10px] text-gray-400">Score: {qualityResult.blur_score}</div>
          </div>

          {/* Lighting */}
          <div className="card p-3 text-center space-y-1">
            <div className="w-7 h-7 rounded-lg bg-gray-100 mx-auto flex items-center justify-center text-gray-600">
              <Sun size={16} />
            </div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase">{dict.lighting_check_label}</div>
            <div className={`text-xs font-bold capitalize ${
              qualityResult.lighting_status === 'good' ? 'text-emerald-700' : 'text-amber-600'
            }`}>
              {qualityResult.lighting_status}
            </div>
            <div className="text-[10px] text-gray-400">Luma: {qualityResult.brightness_score}</div>
          </div>

          {/* Resolution */}
          <div className="card p-3 text-center space-y-1">
            <div className="w-7 h-7 rounded-lg bg-gray-100 mx-auto flex items-center justify-center text-gray-600">
              <Maximize2 size={16} />
            </div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase">{dict.dimensions_label}</div>
            <div className="text-xs font-bold text-gray-800">
              {qualityResult.dimensions[0]}×{qualityResult.dimensions[1]}
            </div>
            <div className="text-[10px] text-gray-400">Ratio: {qualityResult.aspect_ratio}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onProceed}
          className="btn-primary w-full shadow-md text-sm"
        >
          <span>{dict.proceed_to_diagnosis}</span>
          <ArrowRight size={18} />
        </button>

        {!passed && (
          <button
            onClick={onRetake}
            className="btn-secondary w-full text-xs"
          >
            <RefreshCw size={16} />
            <span>{dict.retake_btn}</span>
          </button>
        )}
      </div>
    </div>
  );
};
