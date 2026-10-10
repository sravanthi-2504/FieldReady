/**
 * Deterministic Workflow State Machine for AgriRhythm: FieldReady
 * Manages states, transitions, back navigation, speech synthesis, and push-to-talk speech recognition.
 *
 * Telugu fixes in this version:
 *  - Voices are loaded asynchronously (getVoices() is empty on first call in Chrome).
 *  - Voice matching normalises "te_IN" / "te-IN" and falls back to any "te*" voice.
 *  - If the device has NO voice for the language, we report `voiceMissing` instead of
 *    letting the default English voice silently mangle Telugu script.
 *  - Small delay after cancel() (Chrome drops a speak() fired right after cancel()).
 *  - Long prompts are split into sentences (Chrome stops long utterances after ~15s).
 *  - Autoplay-block errors ("not-allowed") are surfaced via `speechBlocked`.
 */

import { WorkflowState, SupportedLanguage } from '../../types';
import { translations } from '../../i18n/translations';

export interface VoiceInstruction {
  state: WorkflowState;
  instructionKey: keyof typeof translations.en;
  nextState?: WorkflowState;
  prevState?: WorkflowState;
}

export const WORKFLOW_CONFIG: Record<WorkflowState, { next?: WorkflowState; prev?: WorkflowState; promptKey: keyof typeof translations.en }> = {
  WELCOME: { next: 'LANGUAGE_SELECTION', promptKey: 'voice_greeting' },
  LANGUAGE_SELECTION: { next: 'HOME', prev: 'WELCOME', promptKey: 'voice_greeting' },
  HOME: { next: 'FIELD_SELECTION_OR_CREATION', promptKey: 'voice_home_prompt' },
  FIELD_SELECTION_OR_CREATION: { next: 'CROP_SELECTION', prev: 'HOME', promptKey: 'voice_field_prompt' },
  CROP_SELECTION: { next: 'IMAGE_CAPTURE', prev: 'FIELD_SELECTION_OR_CREATION', promptKey: 'voice_crop_prompt' },
  IMAGE_CAPTURE: { next: 'IMAGE_QUALITY_CHECK', prev: 'CROP_SELECTION', promptKey: 'voice_capture_prompt' },
  IMAGE_QUALITY_CHECK: { next: 'CROP_VERIFICATION', prev: 'IMAGE_CAPTURE', promptKey: 'voice_quality_prompt' },
  CROP_VERIFICATION: { next: 'ASSESSMENT', prev: 'IMAGE_QUALITY_CHECK', promptKey: 'voice_crop_verify_prompt' },
  ASSESSMENT: { next: 'FOLLOW_UP_QUESTIONS', prev: 'CROP_VERIFICATION', promptKey: 'voice_assessment_prompt' },
  FOLLOW_UP_QUESTIONS: { next: 'MANAGEMENT_GUIDANCE', prev: 'ASSESSMENT', promptKey: 'voice_questions_prompt' },
  MANAGEMENT_GUIDANCE: { next: 'FIELD_SAMPLING', prev: 'FOLLOW_UP_QUESTIONS', promptKey: 'voice_guidance_prompt' },
  FIELD_SAMPLING: { next: 'SAVE_INSPECTION', prev: 'MANAGEMENT_GUIDANCE', promptKey: 'voice_sampling_prompt' },
  SAVE_INSPECTION: { next: 'HOME', prev: 'FIELD_SAMPLING', promptKey: 'voice_saved_prompt' },
  HISTORY: { prev: 'HOME', promptKey: 'voice_home_prompt' },
  WEATHER_SENSORS: { prev: 'HOME', promptKey: 'voice_home_prompt' },
  OFFLINE_SYNC: { prev: 'HOME', promptKey: 'voice_home_prompt' },
  HELP_SETTINGS: { prev: 'HOME', promptKey: 'voice_home_prompt' }
};

export interface VoiceStatus {
  isSpeaking: boolean;
  isListening: boolean;
  transcript?: string;
  /** true when the device has voices installed but none for the selected language */
  voiceMissing?: boolean;
  /** true when the browser blocked speech because the user has not interacted yet */
  speechBlocked?: boolean;
}

const LANG_TAGS: Record<string, string> = { te: 'te-IN', hi: 'hi-IN', en: 'en-IN' };

export class VoiceAssistant {
  private currentLanguage: SupportedLanguage = 'te';
  private isSpeaking: boolean = false;
  private isListening: boolean = false;
  private voiceMissing: boolean = false;
  private speechBlocked: boolean = false;
  private recognition: any = null;
  private voices: SpeechSynthesisVoice[] = [];
  private speakTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private lastSpokenState?: WorkflowState;
  private onStateChangeCallback?: (state: VoiceStatus) => void;

  constructor(lang: SupportedLanguage = 'te') {
    this.currentLanguage = lang;
    this.initVoices();
    this.initSpeechRecognition();
  }

  private get langTag(): string {
    return LANG_TAGS[this.currentLanguage] ?? 'en-IN';
  }

  setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
    this.voiceMissing = false;
    // Reset de-duplication so the new language is spoken immediately
    this.lastSpokenText = '';
    this.lastSpokenState = undefined;
    if (this.recognition) {
      this.recognition.lang = this.langTag;
    }
    this.refreshVoices();
    this.updateVoiceMissing();
    this.notify();
  }

  setOnStateChange(cb: (state: VoiceStatus) => void) {
    this.onStateChangeCallback = cb;
  }

  private notify(extra: Partial<VoiceStatus> = {}) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isSpeaking: this.isSpeaking,
        isListening: this.isListening,
        voiceMissing: this.voiceMissing,
        speechBlocked: this.speechBlocked,
        ...extra
      });
    }
  }

  // ---------- Voices ----------

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.refreshVoices();
    // Chrome/Android populate the list asynchronously
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      this.refreshVoices();
      this.updateVoiceMissing();
      this.notify();
    });
  }

  private refreshVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) this.voices = list;
  }

  private normLang(l: string): string {
    return l.toLowerCase().replace('_', '-');
  }

  private findVoice(): SpeechSynthesisVoice | undefined {
    const tag = this.normLang(this.langTag);
    const prefix = tag.split('-')[0];
    return (
      this.voices.find(v => this.normLang(v.lang) === tag) ||
      this.voices.find(v => this.normLang(v.lang).startsWith(prefix))
    );
  }

  private updateVoiceMissing() {
    // Only claim "missing" once the browser has actually given us a voice list
    this.voiceMissing = this.voices.length > 0 && !this.findVoice();
  }

  /** Public helper so the UI can check before showing a warning */
  hasVoiceForCurrentLanguage(): boolean {
    this.refreshVoices();
    return this.voices.length === 0 ? true : !!this.findVoice();
  }

  // ---------- Text to Speech ----------

  speak(text: string, force: boolean = false) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported on this device/browser.');
      return;
    }
    if (!text) return;

    if (!force && this.isSpeaking && this.lastSpokenText === text) return;
    if (!force && this.lastSpokenText === text && (Date.now() - this.lastSpokenTime < 3500)) return;

    this.refreshVoices();
    const voice = this.findVoice();
    this.updateVoiceMissing();

    if (this.voiceMissing) {
      // Do NOT fall back to the default (English) voice: it reads Telugu script as silence/noise.
      console.warn(
        `No ${this.langTag} speech voice installed on this device. ` +
        `Install a Telugu voice (Android: Settings > Text-to-speech > Google > Install voice data > Telugu).`
      );
      this.isSpeaking = false;
      this.notify();
      return;
    }

    try {
      const synth = window.speechSynthesis;
      if (synth.speaking || synth.pending) synth.cancel();
      if (this.speakTimer) clearTimeout(this.speakTimer);

      this.lastSpokenText = text;
      this.lastSpokenTime = Date.now();

      // Chrome ignores a speak() issued in the same tick as cancel()
      this.speakTimer = setTimeout(() => {
        const chunks = text.split(/(?<=[.!?।])\s+/).filter(c => c.trim().length > 0);
        chunks.forEach((chunk, i) => {
          const utterance = new SpeechSynthesisUtterance(chunk);
          utterance.lang = this.langTag;
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          if (voice) utterance.voice = voice;

          if (i === 0) {
            utterance.onstart = () => {
              this.isSpeaking = true;
              this.speechBlocked = false;
              this.notify();
            };
          }
          if (i === chunks.length - 1) {
            utterance.onend = () => {
              this.isSpeaking = false;
              this.notify();
            };
          }
          utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
            // 'canceled' / 'interrupted' are normal when we replace an utterance
            if (e.error === 'not-allowed') {
              this.speechBlocked = true; // browser autoplay policy: needs a tap first
            } else if (e.error !== 'canceled' && e.error !== 'interrupted') {
              console.warn('Speech synthesis error:', e.error);
            }
            this.isSpeaking = false;
            this.notify();
          };
          synth.speak(utterance);
        });
      }, 60);
    } catch (err) {
      console.warn('Failed to invoke speechSynthesis:', err);
      this.isSpeaking = false;
      this.notify();
    }
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (this.speakTimer) clearTimeout(this.speakTimer);
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.notify();
    }
  }

  // ---------- Push-to-Talk Speech Recognition ----------

  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // Push-to-talk only
      this.recognition.interimResults = false;
      this.recognition.lang = this.langTag;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.notify();
      };
      this.recognition.onend = () => {
        this.isListening = false;
        this.notify();
      };
      this.recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        this.isListening = false;
        this.notify();
      };
    }
  }

  startListening(onResult: (text: string) => void) {
    if (!this.recognition) {
      console.warn('SpeechRecognition not supported in this browser.');
      return;
    }

    this.stopSpeaking();
    this.recognition.lang = this.langTag; // always match the current language

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      this.notify({ transcript });
      onResult(transcript);
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Could not start recognition:', err);
      this.isListening = false;
      this.notify();
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {}
      this.isListening = false;
      this.notify();
    }
  }

  speakCurrentState(state: WorkflowState, force: boolean = false) {
    const config = WORKFLOW_CONFIG[state];
    if (config) {
      if (!force && this.lastSpokenState === state && (Date.now() - this.lastSpokenTime < 3500)) {
        return;
      }
      this.lastSpokenState = state;
      const dict = translations[this.currentLanguage];
      const prompt = dict[config.promptKey];
      if (prompt) {
        this.speak(prompt, force);
      }
    }
  }
}
