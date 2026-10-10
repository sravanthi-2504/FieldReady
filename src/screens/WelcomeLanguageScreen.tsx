import React from 'react';
import { Languages, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';
import { VoiceAssistant } from '../features/voice/voiceStateMachine';

interface Props {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onContinue: () => void;
  assistant: VoiceAssistant;
}

export const WelcomeLanguageScreen: React.FC<Props> = ({
  currentLanguage,
  onSelectLanguage,
  onContinue,
  assistant
}) => {
  const dict = translations[currentLanguage];

  const CONFIRMATION_PHRASES: Record<SupportedLanguage, string> = {
    te: 'మీరు తెలుగును ఎంచుకున్నారు. ఇప్పుడు మీ పంటను ఎంచుకుని, ఆకును స్పష్టంగా ఫోటో తీయండి.',
    hi: 'आपने हिन्दी चुनी है। अब अपनी फसल चुनें और पत्ती की साफ़ तस्वीर लें।',
    en: 'You have selected English. Now select your crop and take a clear leaf photo.'
  };

  const handleLanguageClick = (lang: SupportedLanguage) => {
    assistant.stopSpeaking();
    onSelectLanguage(lang);
    assistant.setLanguage(lang);
    assistant.speak(CONFIRMATION_PHRASES[lang], true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="pt-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#1E5631] text-white shadow-lg mb-4">
          <img src="/assets/icon.svg" alt="FieldReady Logo" className="w-16 h-16 rounded-2xl" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E5631] tracking-tight">
          AgriRhythm
        </h1>
        <p className="text-lg font-bold text-[#2D6A4F] mt-0.5">
          FieldReady
        </p>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 px-4 leading-relaxed">
          {dict.tagline}
        </p>
      </div>

      {/* Language Selection Cards */}
      <div className="my-6">
        <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Languages size={16} className="text-[#1E5631]" />
          <span>{dict.select_language}</span>
        </div>

        <div className="space-y-3">
          {/* Telugu */}
          <button
            onClick={() => handleLanguageClick('te')}
            className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all active:scale-[0.98] ${
              currentLanguage === 'te'
                ? 'border-[#1E5631] bg-emerald-50/60 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div>
              <div className="text-xl font-bold text-gray-900">తెలుగు</div>
              <div className="text-xs text-gray-500 font-medium">Telugu (ఆంధ్రప్రదేశ్ & తెలంగాణ)</div>
            </div>
            {currentLanguage === 'te' && (
              <div className="w-8 h-8 rounded-full bg-[#1E5631] text-white flex items-center justify-center">
                <Check size={18} />
              </div>
            )}
          </button>

          {/* Hindi */}
          <button
            onClick={() => handleLanguageClick('hi')}
            className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all active:scale-[0.98] ${
              currentLanguage === 'hi'
                ? 'border-[#1E5631] bg-emerald-50/60 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div>
              <div className="text-xl font-bold text-gray-900">हिन्दी</div>
              <div className="text-xs text-gray-500 font-medium">Hindi (उत्तर एवं मध्य भारत)</div>
            </div>
            {currentLanguage === 'hi' && (
              <div className="w-8 h-8 rounded-full bg-[#1E5631] text-white flex items-center justify-center">
                <Check size={18} />
              </div>
            )}
          </button>

          {/* English */}
          <button
            onClick={() => handleLanguageClick('en')}
            className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all active:scale-[0.98] ${
              currentLanguage === 'en'
                ? 'border-[#1E5631] bg-emerald-50/60 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div>
              <div className="text-lg font-bold text-gray-900">English</div>
              <div className="text-xs text-gray-500 font-medium">Examiner & Technical Fallback</div>
            </div>
            {currentLanguage === 'en' && (
              <div className="w-8 h-8 rounded-full bg-[#1E5631] text-white flex items-center justify-center">
                <Check size={18} />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Footer / Continue CTA */}
      <div className="space-y-3 pb-4">
        <button
          onClick={onContinue}
          className="btn-primary w-full shadow-md text-base"
        >
          <span>{dict.continue_btn}</span>
          <ArrowRight size={18} />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
          <ShieldCheck size={14} className="text-[#1E5631]" />
          <span>Offline-First • No Paid Cloud Required • Farmer Evidence-to-Action</span>
        </div>
      </div>
    </div>
  );
};
