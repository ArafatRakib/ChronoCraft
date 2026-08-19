/**
 * Speech synthesis manager for voice cues & progress announcements
 */
class SpeechAssistant {
  private isSupported: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupported = true;
      this.initVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  private initVoice() {
    if (!this.isSupported) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer clean English voice
    this.voice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0] ||
      null;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isVoiceEnabled(): boolean {
    return this.enabled;
  }

  public speak(text: string, priority: boolean = false) {
    if (!this.isSupported || !this.enabled) return;

    try {
      if (priority) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback if speech synthesis is blocked
    }
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
    if (!this.isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export const speechAssistant = new SpeechAssistant();
export const speechManager = speechAssistant;
