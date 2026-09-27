/**
 * Browser stand-in for react-native-sound (which imports React Native internals
 * and can't be bundled for web). Aliased in webpack.config.js. Implements the
 * subset audioFeedbackService uses on top of HTMLAudioElement.
 */
class Sound {
  static MAIN_BUNDLE = '';
  static setCategory() {}

  constructor(filename, _basePath, onLoad) {
    this.audio = typeof Audio !== 'undefined' ? new Audio(`/sounds/${filename}`) : null;
    if (onLoad) {
      setTimeout(() => onLoad(this.audio ? null : new Error('Audio unavailable')), 0);
    }
  }

  setVolume(volume) {
    if (this.audio) this.audio.volume = volume;
    return this;
  }

  play(onEnd) {
    if (!this.audio) {
      onEnd?.(false);
      return this;
    }
    this.audio.onended = () => onEnd?.(true);
    this.audio.play().catch(() => onEnd?.(false));
    return this;
  }

  stop(callback) {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    callback?.();
    return this;
  }

  release() {
    this.audio = null;
  }
}

module.exports = Sound;
module.exports.default = Sound;
