import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, Save, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  fieldName?: string;
  crop: string;
  sampleCount: number;
  symptomaticCount: number;
  uncertainCount: number;
  notes: string;
  onCountsChange: (sample: number, symptomatic: number, uncertain: number) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export const FieldSamplingScreen: React.FC<Props> = ({
  currentLanguage,
  fieldName,
  crop,
  sampleCount,
  symptomaticCount,
  uncertainCount,
  notes,
  onCountsChange,
  onNotesChange,
  onSave,
  onBack
}) => {
  const dict = translations[currentLanguage];

  const updateSample = (delta: number) => {
    const next = Math.max(1, sampleCount + delta);
    onCountsChange(next, Math.min(symptomaticCount, next), Math.min(uncertainCount, next));
  };

  const updateSymptomatic = (delta: number) => {
    const next = Math.max(0, Math.min(sampleCount, symptomaticCount + delta));
    onCountsChange(sampleCount, next, uncertainCount);
  };

  const updateUncertain = (delta: number) => {
    const next = Math.max(0, Math.min(sampleCount - symptomaticCount, uncertainCount + delta));
    onCountsChange(sampleCount, symptomaticCount, next);
  };

  const formattedSummary = dict.sample_summary_format
    .replace('{total}', String(sampleCount))
    .replace('{symptomatic}', String(symptomaticCount));

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
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">{dict.sampling_title}</h2>
          <span className="text-[11px] font-semibold text-[#1E5631]">
            {fieldName || 'Selected Field'} • {crop}
          </span>
        </div>
        <div className="w-9" />
      </div>

      <p className="text-xs text-gray-600 leading-relaxed px-1">
        {dict.sampling_desc}
      </p>

      {/* Real Sample Count Banner */}
      <div className="card p-4 border-2 border-[#1E5631]/30 bg-emerald-50/30 text-center space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Representative Sample Statement
        </div>
        <div className="text-base font-extrabold text-[#1E5631]">
          {formattedSummary}
        </div>
        <div className="text-[11px] text-gray-500 font-medium">
          (Honest sample metric — not an unvalidated whole-field infection claim)
        </div>
      </div>

      {/* Stepper 1: Total Inspected Plants */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-gray-900">{dict.sample_count_label}</div>
          <div className="text-[11px] text-gray-500">Recommended: 15–30 plants</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateSample(-5)}
            className="w-9 h-9 rounded-xl bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700"
          >
            <Minus size={16} />
          </button>
          <span className="font-extrabold text-base w-6 text-center">{sampleCount}</span>
          <button
            onClick={() => updateSample(5)}
            className="w-9 h-9 rounded-xl bg-[#1E5631] text-white active:scale-95 flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Stepper 2: Symptomatic Plants */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-amber-900">{dict.symptomatic_count_label}</div>
          <div className="text-[11px] text-gray-500">Leaves with spots/lesions</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateSymptomatic(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700"
          >
            <Minus size={16} />
          </button>
          <span className="font-extrabold text-base w-6 text-center text-amber-700">{symptomaticCount}</span>
          <button
            onClick={() => updateSymptomatic(1)}
            className="w-9 h-9 rounded-xl bg-amber-600 text-white active:scale-95 flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Stepper 3: Uncertain Plants */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-gray-700">{dict.uncertain_count_label}</div>
          <div className="text-[11px] text-gray-500">Ambiguous / look-alike symptoms</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateUncertain(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700"
          >
            <Minus size={16} />
          </button>
          <span className="font-extrabold text-base w-6 text-center text-gray-700">{uncertainCount}</span>
          <button
            onClick={() => updateUncertain(1)}
            className="w-9 h-9 rounded-xl bg-gray-600 text-white active:scale-95 flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Farmer Observations / Notes */}
      <div className="card p-4 space-y-2">
        <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
          <FileText size={15} />
          <span>{dict.notes_label}</span>
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={dict.notes_placeholder}
          className="w-full p-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#1E5631] text-xs leading-relaxed"
        />
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={onSave}
          className="btn-primary w-full shadow-md text-sm"
        >
          <Save size={18} />
          <span>{dict.finish_inspection_btn}</span>
        </button>
      </div>
    </div>
  );
};
