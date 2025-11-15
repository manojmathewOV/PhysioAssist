/**
 * Clinical Components Index
 *
 * Exports both V1 (Advanced) and V2 (Simplified) components
 */

// V1 - Advanced Mode (Feature-rich, detailed)
export { default as JointSelectionPanel } from './JointSelectionPanel';
export { default as ClinicalAngleDisplay } from './ClinicalAngleDisplay';

// V2 - Simple Mode (Elderly-friendly, minimal cognitive load)
export { default as JointSelectionPanelV2 } from './JointSelectionPanelV2';
export { default as MovementSelectionPanelV2 } from './MovementSelectionPanelV2';
export { default as MovementDemoScreen } from './MovementDemoScreen';
export { default as ClinicalAngleDisplayV2 } from './ClinicalAngleDisplayV2';
export { default as ProgressIndicator } from './ProgressIndicator';

// Type exports
export type { JointType, MovementType, JointConfig } from './JointSelectionPanel';
