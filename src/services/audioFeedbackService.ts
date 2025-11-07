import Tts from 'react-native-tts';
import Sound from 'react-native-sound';
import HapticFeedback from 'react-native-haptic-feedback';

export interface FeedbackConfig {
  enableSpeech: boolean;
  enableSound: boolean;
  enableHaptics: boolean;
  speechRate: number;
  speechPitch: number;
  volume: number;
}

export class AudioFeedbackService {
  private config: FeedbackConfig;
  private soundCache: Map<string, Sound> = new Map();
  private lastSpokenMessage: string = '';
  private lastSpokenTime: number = 0;
  private speakingQueue: string[] = [];
  private isSpeaking: boolean = false;

  // Fixed: Store listener references for proper cleanup
  private ttsStartListener: (() => void) | null = null;
  private ttsFinishListener: (() => void) | null = null;
  private ttsCancelListener: (() => void) | null = null;

  constructor(config: Partial<FeedbackConfig> = {}) {
    this.config = {
      enableSpeech: true,
      enableSound: true,
      enableHaptics: true,
      speechRate: 0.5,
      speechPitch: 1.0,
      volume: 1.0,
      ...config,
    };

    this.initializeTTS();
    this.preloadSounds();
  }

  private async initializeTTS(): Promise<void> {
    try {
      await Tts.setDefaultRate(this.config.speechRate);
      await Tts.setDefaultPitch(this.config.speechPitch);

      // Fixed: Store listener references so we can remove them later
      this.ttsStartListener = () => {
        this.isSpeaking = true;
      };

      this.ttsFinishListener = () => {
        this.isSpeaking = false;
        this.processQueue();
      };

      this.ttsCancelListener = () => {
        this.isSpeaking = false;
        this.processQueue();
      };

      // Set up TTS event listeners
      Tts.addEventListener('tts-start', this.ttsStartListener);
      Tts.addEventListener('tts-finish', this.ttsFinishListener);
      Tts.addEventListener('tts-cancel', this.ttsCancelListener);
    } catch (error) {
      console.error('Failed to initialize TTS:', error);
    }
  }

  private preloadSounds(): void {
    const soundFiles = [
      'success.mp3',
      'error.mp3',
      'beep.mp3',
      'countdown.mp3',
      'complete.mp3',
    ];

    Sound.setCategory('Playback');

    soundFiles.forEach((filename) => {
      const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.error(`Failed to load sound ${filename}:`, error);
          return;
        }
        sound.setVolume(this.config.volume);
        this.soundCache.set(filename.replace('.mp3', ''), sound);
      });
    });
  }

  /**
   * Speak a message using text-to-speech
   */
  async speak(message: string, priority: 'high' | 'normal' = 'normal'): Promise<void> {
    if (!this.config.enableSpeech || !message) return;

    // Avoid repeating the same message too quickly
    if (message === this.lastSpokenMessage && Date.now() - this.lastSpokenTime < 3000) {
      return;
    }

    if (priority === 'high') {
      // High priority messages interrupt current speech
      await Tts.stop();
      this.speakingQueue = [message, ...this.speakingQueue];
    } else {
      // Normal priority messages are queued
      this.speakingQueue.push(message);
    }

    this.lastSpokenMessage = message;
    this.lastSpokenTime = Date.now();

    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.speakingQueue.length === 0 || this.isSpeaking) return;

    const message = this.speakingQueue.shift()!;
    try {
      await Tts.speak(message);
    } catch (error) {
      console.error('TTS error:', error);
      this.isSpeaking = false;
      // Continue processing queue even if one message fails
      this.processQueue();
    }
  }

  /**
   * Play a predefined sound effect
   */
  playSound(soundName: string): void {
    if (!this.config.enableSound) return;

    const sound = this.soundCache.get(soundName);
    if (sound) {
      sound.stop(() => {
        sound.play((success) => {
          if (!success) {
            console.error(`Failed to play sound: ${soundName}`);
          }
        });
      });
    }
  }

  /**
   * Provide haptic feedback
   */
  provideHapticFeedback(
    type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light'
  ): void {
    if (!this.config.enableHaptics) return;

    const hapticTypes = {
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy',
      success: 'notificationSuccess',
      error: 'notificationError',
    };

    HapticFeedback.trigger(hapticTypes[type] as any, {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  }

  /**
   * Provide feedback for exercise events
   */
  async provideExerciseFeedback(
    event: 'repComplete' | 'phaseChange' | 'exerciseComplete' | 'formError',
    message?: string
  ): Promise<void> {
    switch (event) {
      case 'repComplete':
        this.playSound('success');
        this.provideHapticFeedback('success');
        if (message) await this.speak(message);
        break;

      case 'phaseChange':
        this.playSound('beep');
        this.provideHapticFeedback('light');
        if (message) await this.speak(message, 'high');
        break;

      case 'exerciseComplete':
        this.playSound('complete');
        this.provideHapticFeedback('success');
        if (message) await this.speak(message, 'high');
        break;

      case 'formError':
        this.playSound('error');
        this.provideHapticFeedback('error');
        if (message) await this.speak(message, 'high');
        break;
    }
  }

  /**
   * Provide countdown feedback
   */
  async countdown(seconds: number): Promise<void> {
    for (let i = seconds; i > 0; i--) {
      this.playSound('countdown');
      await this.speak(i.toString(), 'high');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    this.playSound('success');
    await this.speak('Go!', 'high');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.speechRate !== undefined) {
      Tts.setDefaultRate(newConfig.speechRate);
    }
    if (newConfig.speechPitch !== undefined) {
      Tts.setDefaultPitch(newConfig.speechPitch);
    }
    if (newConfig.volume !== undefined) {
      this.soundCache.forEach((sound) => sound.setVolume(newConfig.volume));
    }
  }

  /**
   * Stop all audio feedback
   */
  async stopAll(): Promise<void> {
    await Tts.stop();
    this.speakingQueue = [];
    this.soundCache.forEach((sound) => sound.stop());
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Fixed: Remove listeners individually (removeAllListeners doesn't exist)
    if (this.ttsStartListener) {
      Tts.removeEventListener('tts-start', this.ttsStartListener);
      this.ttsStartListener = null;
    }
    if (this.ttsFinishListener) {
      Tts.removeEventListener('tts-finish', this.ttsFinishListener);
      this.ttsFinishListener = null;
    }
    if (this.ttsCancelListener) {
      Tts.removeEventListener('tts-cancel', this.ttsCancelListener);
      this.ttsCancelListener = null;
    }

    this.soundCache.forEach((sound) => sound.release());
    this.soundCache.clear();
  }
}

// Singleton instance
export const audioFeedbackService = new AudioFeedbackService();
