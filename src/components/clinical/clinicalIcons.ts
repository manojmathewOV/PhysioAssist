/**
 * MaterialIcons names for joints and movements, so clinical screens use the
 * app's icon font instead of emoji (which render differently on every device).
 */
import type { JointType, MovementType } from '@config/movements.config';

export const JOINT_ICONS: Record<JointType, string> = {
  shoulder: 'accessibility-new',
  elbow: 'sports-gymnastics',
  knee: 'directions-walk',
  hip: 'directions-run',
  wrist: 'back-hand',
  ankle: 'do-not-step',
  spine: 'accessibility',
  neck: 'self-improvement',
};

export const MOVEMENT_ICONS: Record<MovementType, string> = {
  flexion: 'arrow-upward',
  extension: 'arrow-downward',
  abduction: 'call-made',
  adduction: 'call-received',
  external_rotation: 'rotate-right',
  internal_rotation: 'rotate-left',
  scaption: 'north-east',
  horizontal_abduction: 'swap-horiz',
  horizontal_adduction: 'compare-arrows',
};
