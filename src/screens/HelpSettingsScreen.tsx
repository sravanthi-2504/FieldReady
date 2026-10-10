import React from 'react';
import { ArrowLeft, BookOpen, Cpu, ShieldCheck, Languages, Check, ExternalLink } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onBack: () => void;
}

export const HelpSettingsScreen: React.FC<Props> = ({
  currentLanguage,
  onSelectLanguage,
  onBack
}) => {
  const dict = translations[currentLanguage];

  return (
    <div className="pb-28 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{dict.action_settings}</h2>
        <div className="w-9" />
      </div>

      {/* Language Switcher */}
      <div className="card p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
          <Languages size={16} className="text-[#1E5631]" />
          <span>{dict.select_language}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'te', label: 'తెలుగు' },
            { id: 'hi', label: 'हिन्दी' },
            { id: 'en', label: 'English' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onSelectLanguage(item.id as SupportedLanguage)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                currentLanguage === item.id
                  ? 'border-[#1E5631] bg-emerald-50 text-[#1E5631]'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5-Minute Examiner Demo Script Walkthrough */}
      <div className="card p-4 space-y-3 border-2 border-emerald-600/30 bg-emerald-50/20">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#1E5631] uppercase tracking-wider">
          <BookOpen size={16} />
          <span>Examiner 5-Minute Demo Checklist</span>
        </div>

        <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside leading-relaxed">
          <li><strong>Onboarding:</strong> Open app, hear Telugu/Hindi greeting, show manual tap fallback.</li>
          <li><strong>Select Field:</strong> Choose or create a field plot with optional GPS capture.</li>
          <li><strong>Select Crop:</strong> Choose Maize (model-verified). Show Cotton safeguard halt.</li>
          <li><strong>Quality Gate:</strong> Upload or pick sample leaf. View blur & lighting checks.</li>
          <li><strong>Crop Verification:</strong> Confirm crop before inference.</li>
          <li><strong>Assessment:</strong> View MobileNetV2 prediction, confidence bar, and abstention safeguard.</li>
          <li><strong>Guidance:</strong> Review safe cultural practices and verified chemical disclaimer.</li>
          <li><strong>Offline Test:</strong> Toggle Wi-Fi off, refresh app, view cached records in IndexedDB.</li>
        </ol>
      </div>

      {/* Machine Learning Model Performance Summary */}
      <div className="card p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
          <Cpu size={16} className="text-[#1E5631]" />
          <span>ML Architecture & Evaluation Benchmark</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-[10px] text-gray-500 font-semibold block">Architecture</span>
            <span className="font-bold text-gray-900">MobileNetV2</span>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-[10px] text-gray-500 font-semibold block">Held-out Accuracy (Maize / Banana)</span>
            <span className="font-bold text-emerald-700">91.67% / 92.86%</span>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-[10px] text-gray-500 font-semibold block">Macro-F1 (Maize / Banana)</span>
            <span className="font-bold text-emerald-700">0.9177 / 0.9141</span>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="text-[10px] text-gray-500 font-semibold block">Avg CPU Latency (Maize / Banana)</span>
            <span className="font-bold text-gray-900">37.6 / 34.2 ms</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 pt-1">
          Detailed metrics, confusion matrix, and split methodology documented in <code className="bg-gray-100 px-1 rounded">docs/EXAMINER_EVALUATION.md</code>.
        </p>
      </div>

      {/* Agronomic Disclaimer */}
      <div className="card p-4 bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-gray-800">
          <ShieldCheck size={16} className="text-[#1E5631]" />
          <span>Agronomic Advisory Policy</span>
        </div>
        <p>
          AgriRhythm: FieldReady is a decision-support and scouting tool. It does not replace an agricultural officer, laboratory diagnosis, or physical agronomy extension evaluation.
        </p>
      </div>
    </div>
  );
};
