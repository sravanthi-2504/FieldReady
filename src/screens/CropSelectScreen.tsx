import React, { useState } from 'react';
import { ArrowLeft, Check, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  selectedCrop: string;
  onSelectCrop: (crop: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const CropSelectScreen: React.FC<Props> = ({
  currentLanguage,
  selectedCrop,
  onSelectCrop,
  onBack,
  onContinue
}) => {
  const dict = translations[currentLanguage];
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleSelect = (cropKey: string) => {
    if (cropKey === 'cotton') {
      setWarningMessage(dict.crop_warning_unsupported);
      onSelectCrop('cotton');
    } else {
      setWarningMessage(null);
      onSelectCrop(cropKey);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{dict.choose_crop_title}</h2>
        <div className="w-9" />
      </div>

      {/* Support Matrix explanation */}
      <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3 text-xs text-emerald-900 flex items-start gap-2">
        <ShieldCheck size={18} className="text-[#1E5631] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Transparent Crop Policy: </span>
          Only classes backed by genuine ML evaluation are diagnosed. Unvalidated crops are safely halted.
        </div>
      </div>

      {/* Crop Cards */}
      <div className="space-y-3 pt-1">
        {/* Maize */}
        <div
          onClick={() => handleSelect('maize')}
          className={`card p-4 cursor-pointer transition-all active:scale-[0.99] border-2 ${
            selectedCrop === 'maize'
              ? 'border-[#1E5631] bg-emerald-50/50 shadow-sm'
              : 'border-transparent hover:border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-gray-900">{dict.maize_title}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {dict.supported_status}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed pr-2">
                {dict.maize_desc}
              </p>
            </div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              selectedCrop === 'maize' ? 'bg-[#1E5631] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              <Check size={16} />
            </div>
          </div>
        </div>

        {/* Banana */}
        <div
          onClick={() => handleSelect('banana')}
          className={`card p-4 cursor-pointer transition-all active:scale-[0.99] border-2 ${
            selectedCrop === 'banana'
              ? 'border-[#1E5631] bg-emerald-50/50 shadow-sm'
              : 'border-transparent hover:border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-gray-900">{dict.banana_title}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {dict.supported_status}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed pr-2">
                {dict.banana_desc}
              </p>
            </div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              selectedCrop === 'banana' ? 'bg-[#1E5631] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              <Check size={16} />
            </div>
          </div>
        </div>

        {/* Cotton */}
        <div
          onClick={() => handleSelect('cotton')}
          className={`card p-4 cursor-pointer transition-all active:scale-[0.99] border-2 ${
            selectedCrop === 'cotton'
              ? 'border-gray-500 bg-gray-50 shadow-sm'
              : 'border-transparent hover:border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-gray-800">{dict.cotton_title}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  {dict.planned_status}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed pr-2">
                {dict.cotton_desc}
              </p>
            </div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              selectedCrop === 'cotton' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              <Check size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Unsupported Warning Banner */}
      {warningMessage && (
        <div className="card bg-amber-50 border-amber-300 p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle size={16} className="text-amber-600" />
            <span>Diagnosis Safeguard Active</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            {warningMessage}
          </p>
        </div>
      )}

      {/* Continue Button */}
      <div className="pt-4">
        <button
          onClick={onContinue}
          disabled={selectedCrop === 'cotton'}
          className={`w-full py-3.5 px-4 font-bold rounded-2xl shadow-sm text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            selectedCrop === 'cotton'
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'btn-primary'
          }`}
        >
          <span>{dict.continue_btn}</span>
        </button>
      </div>
    </div>
  );
};
