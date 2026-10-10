import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react';
import { DifferentialAnswers, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  answers: DifferentialAnswers;
  onAnswersChange: (answers: DifferentialAnswers) => void;
  onProceed: () => void;
  onBack: () => void;
}

export const DifferentialQuestionsScreen: React.FC<Props> = ({
  currentLanguage,
  answers,
  onAnswersChange,
  onProceed,
  onBack
}) => {
  const dict = translations[currentLanguage];

  const handleSelect = (key: keyof DifferentialAnswers, value: string) => {
    onAnswersChange({
      ...answers,
      [key]: value
    });
  };

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
        <h2 className="text-lg font-bold text-gray-900">{dict.questions_title}</h2>
        <div className="w-9" />
      </div>

      <p className="text-xs text-gray-600 leading-relaxed px-1">
        These short questions help distinguish diseases from spray scorch, nutrient deficiencies, or weather stress.
      </p>

      {/* Question 1: Onset */}
      <div className="card p-4 space-y-2.5">
        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#1E5631] text-[11px] flex items-center justify-center font-bold">1</span>
          <span>{dict.q1_title}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { id: 'recent', label: dict.q1_opt1 },
            { id: 'week', label: dict.q1_opt2 },
            { id: 'two_weeks', label: dict.q1_opt3 }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect('onset_time', opt.id)}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                answers.onset_time === opt.id
                  ? 'border-[#1E5631] bg-emerald-50 text-[#1E5631] font-bold'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <span>{opt.label}</span>
              {answers.onset_time === opt.id && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Question 2: Spray History */}
      <div className="card p-4 space-y-2.5">
        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#1E5631] text-[11px] flex items-center justify-center font-bold">2</span>
          <span>{dict.q2_title}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { id: 'yes', label: dict.q2_opt1 },
            { id: 'no', label: dict.q2_opt2 },
            { id: 'unsure', label: dict.q2_opt3 }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect('pesticide_fertilizer_applied', opt.id)}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                answers.pesticide_fertilizer_applied === opt.id
                  ? 'border-[#1E5631] bg-emerald-50 text-[#1E5631] font-bold'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <span>{opt.label}</span>
              {answers.pesticide_fertilizer_applied === opt.id && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Question 3: Weather */}
      <div className="card p-4 space-y-2.5">
        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#1E5631] text-[11px] flex items-center justify-center font-bold">3</span>
          <span>{dict.q3_title}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { id: 'wet_humid', label: dict.q3_opt1 },
            { id: 'hot_dry', label: dict.q3_opt2 },
            { id: 'normal', label: dict.q3_opt3 }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect('weather_condition', opt.id)}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                answers.weather_condition === opt.id
                  ? 'border-[#1E5631] bg-emerald-50 text-[#1E5631] font-bold'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <span>{opt.label}</span>
              {answers.weather_condition === opt.id && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Question 4: Neighboring Plants Pattern */}
      <div className="card p-4 space-y-2.5">
        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#1E5631] text-[11px] flex items-center justify-center font-bold">4</span>
          <span>{dict.q4_title}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { id: 'widespread', label: dict.q4_opt1 },
            { id: 'isolated', label: dict.q4_opt2 },
            { id: 'unchecked', label: dict.q4_opt3 }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect('neighboring_plants', opt.id)}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                answers.neighboring_plants === opt.id
                  ? 'border-[#1E5631] bg-emerald-50 text-[#1E5631] font-bold'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <span>{opt.label}</span>
              {answers.neighboring_plants === opt.id && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onProceed}
          className="btn-primary w-full shadow-md text-sm"
        >
          <span>{dict.continue_btn}</span>
          <ArrowRight size={18} />
        </button>

        <button
          onClick={onProceed}
          className="btn-secondary w-full text-xs"
        >
          <span>{dict.skip_questions}</span>
        </button>
      </div>
    </div>
  );
};
