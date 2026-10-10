import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, BookOpen, AlertOctagon, Sprout, ShieldCheck, Calendar, PhoneCall } from 'lucide-react';
import { AssessmentResult, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  assessment?: AssessmentResult;
  onProceedToSampling: () => void;
  onBack: () => void;
}

export const GuidanceScreen: React.FC<Props> = ({
  currentLanguage,
  assessment,
  onProceedToSampling,
  onBack
}) => {
  const dict = translations[currentLanguage];
  const guidance = assessment?.management_guidance as any;

  // Localized summary
  const summaryText: string =
    (typeof guidance?.summary === 'object' && guidance?.summary[currentLanguage]) ||
    guidance?.summary ||
    '';

  // Immediate actions
  const immediateActions: string[] =
    (guidance?.immediate_actions && guidance.immediate_actions[currentLanguage]) ||
    guidance?.cultural_actions ||
    [];

  // Preventive care
  const preventiveCare: string[] =
    (guidance?.preventive_care && guidance.preventive_care[currentLanguage]) ||
    [];

  // Re-inspection timeline
  const reinspectDays = guidance?.reinspect_days || (assessment?.predicted_class === 'healthy' ? 7 : 3);
  const reinspectText: string =
    (guidance?.reinspect_text && guidance.reinspect_text[currentLanguage]) ||
    (currentLanguage === 'te'
      ? `${reinspectDays} రోజుల తర్వాత మళ్లీ తనిఖీ చేయండి.`
      : currentLanguage === 'hi'
      ? `${reinspectDays} दिनों के बाद पुनः निरीक्षण करें।`
      : `Re-inspect in ${reinspectDays} days.`);

  // Seek help conditions
  const seekHelpConditions: string =
    (guidance?.seek_help_conditions && guidance.seek_help_conditions[currentLanguage]) ||
    (currentLanguage === 'te'
      ? 'లక్షణాలు వేగంగా వ్యాపిస్తే వెంటనే స్థానిక వ్యవసాయ అధికారి లేదా KVK శాస్త్రవేత్తను సంప్రదించండి.'
      : currentLanguage === 'hi'
      ? 'यदि लक्षण तेजी से फैलें तो तुरंत स्थानीय कृषि अधिकारी या केवीके से संपर्क करें।'
      : 'If symptoms spread rapidly, contact your local Agricultural Extension Officer or KVK immediately.');

  // Chemical advice
  const chemicalAdvice: string =
    (typeof guidance?.chemical_advice === 'object' && guidance?.chemical_advice[currentLanguage]) ||
    guidance?.chemical_advice ||
    '';

  const officialSource: string =
    guidance?.official_source ||
    'ICAR-Indian Institute of Maize Research (IIMR) & State Agricultural University Advisory';

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
        <h2 className="text-lg font-bold text-gray-900">{dict.guidance_title}</h2>
        <div className="w-9" />
      </div>

      {/* Condition Summary */}
      {summaryText && (
        <div className="card p-4 bg-emerald-50/50 border-emerald-200/80 space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#1E5631]">
            {currentLanguage === 'te' ? 'వ్యవసాయ పరిశీలన సారాంశం' : currentLanguage === 'hi' ? 'कृषि मूल्यांकन सारांश' : 'Agronomic Assessment Summary'}
          </div>
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-medium">
            {summaryText}
          </p>
        </div>
      )}

      {/* Immediate Cultural & Agronomic Practices */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1E5631] uppercase tracking-wider">
          <Sprout size={16} />
          <span>{dict.cultural_practices_heading}</span>
        </div>

        <ul className="space-y-2 pt-1">
          {immediateActions.map((act, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
              <CheckCircle2 size={16} className="text-[#1E5631] shrink-0 mt-0.5" />
              <span>{act}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Preventive Care */}
      {preventiveCare.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">
            <ShieldCheck size={16} />
            <span>
              {currentLanguage === 'te' ? 'దీర్ఘకాలిక నివారణ చర్యలు' : currentLanguage === 'hi' ? 'दीर्घकालिक निवारक उपाय' : 'Preventive Field Care'}
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

      {/* Re-inspection Timeline & Conditions to Seek Help */}
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

      {/* Strict Chemical Safety Warning Box */}
      <div className="card border-2 border-red-200 bg-red-50/50 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-red-900 font-extrabold text-xs uppercase tracking-wider">
          <AlertOctagon size={18} className="text-red-600 shrink-0" />
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

      {/* Official Source & Reference */}
      {officialSource && (
        <div className="card p-3 bg-gray-50 flex items-start gap-2 text-[11px] text-gray-600">
          <BookOpen size={15} className="text-gray-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-700">{dict.official_source_label} </span>
            <span>{officialSource}</span>
          </div>
        </div>
      )}

      {/* Action CTA */}
      <div className="pt-2">
        <button
          onClick={onProceedToSampling}
          className="btn-primary w-full shadow-md text-sm"
        >
          <span>{dict.record_field_sample_btn}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
