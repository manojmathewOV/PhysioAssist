/**
 * Browser stand-in for react-native-haptic-feedback (native-only; its package
 * can't be bundled for web). Uses the Vibration API where the browser has one.
 */
const trigger = () => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(15);
  }
};

const HapticFeedback = { trigger };

module.exports = HapticFeedback;
module.exports.default = HapticFeedback;
module.exports.trigger = trigger;
