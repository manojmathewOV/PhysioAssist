/**
 * Browser stand-in for react-native-tts (native only). Aliased in
 * webpack.config.js. Implements the subset audioFeedbackService uses on top of
 * the Web Speech API; without it every spoken cue rejected on web.
 */
const listeners = {
  'tts-start': new Set(),
  'tts-finish': new Set(),
  'tts-cancel': new Set(),
};
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
let rate = 0.5;
let pitch = 1;

const emit = (event) => listeners[event]?.forEach((fn) => fn({}));

const Tts = {
  getInitStatus: () => Promise.resolve('success'),
  setDefaultRate: (value) => {
    rate = value;
    return Promise.resolve();
  },
  setDefaultPitch: (value) => {
    pitch = value;
    return Promise.resolve();
  },
  setDefaultLanguage: () => Promise.resolve(),
  speak(text) {
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      return Promise.resolve();
    }
    const utterance = new SpeechSynthesisUtterance(String(text));
    // react-native-tts rate 0.5 is normal speed; Web Speech uses 1.0
    utterance.rate = Math.max(0.1, Math.min(10, rate * 2));
    utterance.pitch = pitch;
    utterance.onstart = () => emit('tts-start');
    utterance.onend = () => emit('tts-finish');
    utterance.onerror = () => emit('tts-cancel');
    synth.speak(utterance);
    return Promise.resolve();
  },
  stop() {
    if (synth?.speaking) {
      synth.cancel();
      emit('tts-cancel');
    }
    return Promise.resolve(true);
  },
  addEventListener(event, fn) {
    listeners[event]?.add(fn);
  },
  removeEventListener(event, fn) {
    listeners[event]?.delete(fn);
  },
};

export default Tts;
