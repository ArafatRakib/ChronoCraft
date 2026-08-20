import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { capacitorBridge } from './capacitorNativeBridge';

/**
 * Speech synthesis manager for voice cues & progress announcements
 * Uses @capacitor-community/text-to-speech for Native Android and falls back to Web Speech Synthesis.
 */
class SpeechAssistant {
  private isSupported: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;
  private enabled: boolean = true;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'speechSynthesis' in window || capacitorBridge.isNative();
      if ('speechSynthesis' in window) {
        this.initVoice();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.initVoice();
        }

        // Unlock Web Audio / Speech Synthesis on user interaction
        const unlock = () => {
          try {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          } catch {}
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
      }
    }
  }

  private initVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.voice =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Samantha') ||
                v.name.includes('English'))
          ) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0] ||
          null;
      }
    } catch {}
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isVoiceEnabled(): boolean {
    return this.enabled;
  }

  public async speak(text: string, priority: boolean = false) {
    if (!this.enabled) return;

    // 1. Try Native Android TTS via Capacitor
    if (capacitorBridge.isNative()) {
      try {
        if (priority) {
          await TextToSpeech.stop().catch(() => {});
        }
        await TextToSpeech.speak({
          text,
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'alarm',
        });
        return;
      } catch {
        // Fallback to web speech
      }
    }

    // 2. Web Speech Synthesis API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        if (priority) {
          window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (!this.voice) {
          this.initVoice();
        }
        if (this.voice) {
          utterance.voice = this.voice;
        }
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Retain utterance reference to avoid Android WebView GC drop
        this.currentUtterance = utterance;
        utterance.onend = () => {
          this.currentUtterance = null;
        };
        utterance.onerror = () => {
          this.currentUtterance = null;
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback gracefully
      }
    }
  }

  public testVoice() {
    this.speak('Voice cues are active and ready.', true);
  }

  public announcePhase(phaseName: string, round: number, totalRounds: number) {
    this.speak(`${phaseName}! Round ${round} of ${totalRounds}.`, true);
  }

  public announceCountdown(seconds: number) {
    this.speak(`${seconds}`, true);
  }

  public announceHalfway(timerName: string) {
    this.speak(`Halfway through ${timerName}.`, false);
  }

  public announceTimerFinished(timerName: string) {
    this.speak(`Time is up for ${timerName}!`, true);
  }

  public cancel() {
    if (capacitorBridge.isNative()) {
      TextToSpeech.stop().catch(() => {});
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }
}

export const speechAssistant = new SpeechAssistant();
export const speechManager = speechAssistant;
