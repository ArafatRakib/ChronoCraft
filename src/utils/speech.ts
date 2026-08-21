import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { capacitorBridge } from './capacitorNativeBridge';

/**
 * Expands abbreviated time units for TTS (e.g. "0m 30s Timer" -> "30 seconds Timer")
 * Prevents TTS from pronouncing "m" as "meters" and "s" as "south".
 */
function sanitizeTextForSpeech(text: string): string {
  if (!text) return '';
  
  return text
    // 1. Remove 0m / 0h prefixes
    .replace(/^0[hm]\s+/i, '')
    .replace(/\b0[hm]\s+/i, '')
    // 2. Expand hour abbreviations
    .replace(/\b1\s*h\b/gi, '1 hour')
    .replace(/(\d+)\s*h\b/gi, '$1 hours')
    // 3. Expand minute abbreviations
    .replace(/\b1\s*m\b/gi, '1 minute')
    .replace(/(\d+)\s*m\b/gi, '$1 minutes')
    // 4. Expand second abbreviations
    .replace(/\b1\s*s\b/gi, '1 second')
    .replace(/(\d+)\s*s\b/gi, '$1 seconds');
}


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

    // Expand all abbreviations (e.g. "10s" -> "10 seconds", "5m" -> "5 minutes")
    const spokenText = sanitizeTextForSpeech(text);

    // 1. Try Native Android TTS via Capacitor
    if (capacitorBridge.isNative()) {
      try {
        if (priority) {
          await TextToSpeech.stop().catch(() => {});
        }
        await TextToSpeech.speak({
          text: spokenText,
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
        });
        return;
      } catch (err) {
        console.warn('Native TTS failed, falling back to Web Speech:', err);
      }
    }

    // 2. Web Speech Synthesis API Fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        if (priority) {
          window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(spokenText);
        if (!this.voice) {
          this.initVoice();
        }
        if (this.voice) {
          utterance.voice = this.voice;
        }
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        this.currentUtterance = utterance;
        utterance.onend = () => {
          this.currentUtterance = null;
        };
        utterance.onerror = () => {
          this.currentUtterance = null;
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Web Speech API error:', e);
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
    const cleanName = sanitizeTextForSpeech(timerName);
    this.speak(`Halfway through ${cleanName}.`, false);
  }

  public announceTimerFinished(timerName: string) {
    const cleanName = sanitizeTextForSpeech(timerName);
    this.speak(`Time is up for ${cleanName}!`, true);
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
