import React, { useState } from 'react';
import { Volume2, VolumeX, Mic, MicOff, RotateCcw, Sparkles } from 'lucide-react';
import { VoiceAssistant } from './voiceStateMachine';
import { SupportedLanguage, WorkflowState } from '../../types';
import { translations } from '../../i18n/translations';
import { WORKFLOW_CONFIG } from './voiceStateMachine';

interface VoiceGuideBarProps {
  assistant: VoiceAssistant;
  currentLanguage: SupportedLanguage;
  currentState: WorkflowState;
  onVoiceCommand?: (text: string) => void;
}

export const VoiceGuideBar: React.FC<VoiceGuideBarProps> = ({
  assistant,
  currentLanguage,
  currentState,
  onVoiceCommand
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [voiceMissing, setVoiceMissing] = useState(false);
  const [speechBlocked, setSpeechBlocked] = useState(false);

  React.useEffect(() => {
    assistant.setOnStateChange((state) => {
      setIsSpeaking(state.isSpeaking);
      setIsListening(state.isListening);
      if (state.voiceMissing !== undefined) setVoiceMissing(state.voiceMissing);
      if (state.speechBlocked !== undefined) setSpeechBlocked(state.speechBlocked);
      if (state.transcript) {
        setTranscript(state.transcript);
        if (onVoiceCommand) {
          onVoiceCommand(state.transcript);
        }
      }
    });
  }, [assistant, onVoiceCommand]);

  const dict = translations[currentLanguage];
  const config = WORKFLOW_CONFIG[currentState];
  const currentInstruction = config ? dict[config.promptKey] : '';

  const handleRepeat = () => {
    assistant.speak(currentInstruction);
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      assistant.stopSpeaking();
      setIsSpeaking(false);
    } else {
      assistant.speak(currentInstruction);
    }
  };

  const handleMicPush = () => {
    if (isListening) {
      assistant.stopListening();
    } else {
      assistant.startListening((text) => {
        setTranscript(text);
      });
    }
  };

  return (
    <div className="bg-[#1E5631] text-white px-4 py-3 shadow-md border-b border-[#2D6A4F] sticky top-0 z-40">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Voice Companion Indicator & Instruction */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`p-2 rounded-full ${isSpeaking ? 'bg-amber-400 text-[#1E5631] animate-pulse' : 'bg-[#2D6A4F] text-emerald-200'}`}>
            <Sparkles size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-200">
                {currentLanguage === 'te' ? 'ఫీల్డ్రెడీ వాయిస్ గైడ్' : currentLanguage === 'hi' ? 'फील्डरेडी आवाज़ मार्गदर्शक' : 'FieldReady Voice Guide'}
              </span>
              {isSpeaking && (
                <span className="inline-block w-2 h-2 rounded-full bg-amber-300 animate-ping" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-white truncate" title={currentInstruction}>
              {currentInstruction}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Repeat Button */}
          <button
            onClick={handleRepeat}
            className="p-2 rounded-lg bg-[#2D6A4F] hover:bg-[#397d5f] active:scale-95 text-white transition-all"
            title={dict.voice_repeat}
            aria-label={dict.voice_repeat}
          >
            <RotateCcw size={16} />
          </button>

          {/* Audio Speak / Stop Toggle */}
          <button
            onClick={handleToggleSpeak}
            className={`p-2 rounded-lg transition-all active:scale-95 ${
              isSpeaking ? 'bg-amber-500 text-white' : 'bg-[#2D6A4F] text-white hover:bg-[#397d5f]'
            }`}
            title={isSpeaking ? dict.voice_stop : dict.voice_repeat}
            aria-label="Toggle voice guidance"
          >
            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Push-to-Talk Mic */}
          <button
            onClick={handleMicPush}
            className={`p-2 rounded-lg transition-all active:scale-95 ${
              isListening ? 'bg-red-500 text-white animate-bounce' : 'bg-[#2D6A4F] text-white hover:bg-[#397d5f]'
            }`}
            title={isListening ? dict.voice_listening : dict.voice_tap_to_speak}
            aria-label="Push to talk"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
      </div>

      {/* Transcript feedback banner when speaking */}
      {isListening && (
        <div className="mt-2 text-center text-xs bg-red-600/90 py-1 px-2 rounded font-medium animate-pulse">
          {dict.voice_listening}
        </div>
      )}
      {transcript && !isListening && (
        <div className="mt-2 text-center text-xs bg-emerald-900/80 py-0.5 px-2 rounded text-emerald-100 truncate">
          &ldquo;{transcript}&rdquo;
        </div>
      )}

      {/* Voice missing notice banner */}
      {voiceMissing && currentLanguage === 'te' && (
        <div className="mt-2 text-xs bg-amber-400 text-gray-950 py-1 px-2.5 rounded-lg flex items-center justify-between font-semibold shadow-sm">
          <span>⚠️ పరికరంలో తెలుగు వాయిస్ లేదు (Android: Settings &gt; Text-to-speech &gt; Google &gt; Install Telugu)</span>
          <button onClick={() => setVoiceMissing(false)} className="text-xs font-bold px-1 text-gray-700">✕</button>
        </div>
      )}

      {/* Browser Autoplay blocked banner */}
      {speechBlocked && (
        <div className="mt-2 text-xs bg-amber-300 text-gray-950 py-1 px-2.5 rounded-lg flex items-center justify-between font-semibold shadow-sm">
          <span>🔊 ఆడియో వినడానికి స్క్రీన్‌పై ఒకసారి నొక్కండి (Tap screen to enable audio)</span>
          <button onClick={() => setSpeechBlocked(false)} className="text-xs font-bold px-1 text-gray-700">✕</button>
        </div>
      )}
    </div>
  );
};
