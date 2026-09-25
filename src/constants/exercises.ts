import { Exercise } from '../types/exercise';

export const EXERCISES: Record<string, Exercise> = {
  bicepCurl: {
    id: 'bicep-curl',
    primaryJoint: 'elbow',
    name: 'Bicep Curl',
    description: 'Standard bicep curl exercise for arm strength',
    category: 'strength',
    difficulty: 'beginner',
    targetMuscles: ['biceps', 'forearms'],
    equipment: ['dumbbell'],
    targetRepetitions: 12,
    targetSets: 3,
    restDuration: 60000, // 60 seconds
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold weights with palms facing forward',
      'Keep elbows close to your body',
      'Curl weights up to shoulders',
      'Lower slowly back to starting position',
    ],
    phases: [
      {
        name: 'start',
        description: 'Starting position with arms extended',
        jointRequirements: [
          {
            joint: 'left_elbow',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
          {
            joint: 'right_elbow',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
        ],
      },
      {
        name: 'curl',
        description: 'Curl phase with arms flexed',
        jointRequirements: [
          {
            joint: 'left_elbow',
            minAngle: 30,
            maxAngle: 50,
            targetAngle: 40,
          },
          {
            joint: 'right_elbow',
            minAngle: 30,
            maxAngle: 50,
            targetAngle: 40,
          },
        ],
        holdDuration: 1000, // Hold for 1 second at top
      },
    ],
  },

  shoulderPress: {
    id: 'shoulder-press',
    primaryJoint: 'shoulder',
    name: 'Shoulder Press',
    description: 'Overhead press for shoulder strength',
    category: 'strength',
    difficulty: 'intermediate',
    targetMuscles: ['shoulders', 'triceps'],
    equipment: ['dumbbell'],
    targetRepetitions: 10,
    targetSets: 3,
    restDuration: 90000, // 90 seconds
    instructions: [
      'Stand or sit with back straight',
      'Hold weights at shoulder level',
      'Press weights overhead',
      'Keep core engaged',
      'Lower back to shoulders',
    ],
    phases: [
      {
        name: 'start',
        description: 'Starting position at shoulder level',
        jointRequirements: [
          {
            joint: 'left_shoulder',
            minAngle: 80,
            maxAngle: 100,
            targetAngle: 90,
          },
          {
            joint: 'right_shoulder',
            minAngle: 80,
            maxAngle: 100,
            targetAngle: 90,
          },
          {
            joint: 'left_elbow',
            minAngle: 80,
            maxAngle: 100,
            targetAngle: 90,
          },
          {
            joint: 'right_elbow',
            minAngle: 80,
            maxAngle: 100,
            targetAngle: 90,
          },
        ],
      },
      {
        name: 'press',
        description: 'Press phase with arms extended overhead',
        jointRequirements: [
          {
            joint: 'left_shoulder',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
          {
            joint: 'right_shoulder',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
          {
            joint: 'left_elbow',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
          {
            joint: 'right_elbow',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
        ],
        holdDuration: 500, // Hold briefly at top
      },
    ],
  },

  squat: {
    id: 'squat',
    primaryJoint: 'knee',
    name: 'Bodyweight Squat',
    description: 'Basic squat for leg strength and mobility',
    category: 'strength',
    difficulty: 'beginner',
    targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: [],
    targetRepetitions: 15,
    targetSets: 3,
    restDuration: 60000,
    instructions: [
      'Stand with feet shoulder-width apart',
      'Keep chest up and core engaged',
      'Lower hips back and down',
      'Keep knees tracking over toes',
      'Drive through heels to stand',
    ],
    warnings: ['Avoid letting knees cave inward', 'Keep weight on heels, not toes'],
    phases: [
      {
        name: 'standing',
        description: 'Standing position',
        jointRequirements: [
          {
            joint: 'left_knee',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
          {
            joint: 'right_knee',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
          {
            joint: 'left_hip',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
          {
            joint: 'right_hip',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
        ],
      },
      {
        name: 'squat',
        description: 'Bottom of squat position',
        jointRequirements: [
          {
            joint: 'left_knee',
            minAngle: 70,
            maxAngle: 100,
            targetAngle: 90,
          },
          {
            joint: 'right_knee',
            minAngle: 70,
            maxAngle: 100,
            targetAngle: 90,
          },
          {
            joint: 'left_hip',
            minAngle: 70,
            maxAngle: 100,
            targetAngle: 90,
          },
          {
            joint: 'right_hip',
            minAngle: 70,
            maxAngle: 100,
            targetAngle: 90,
          },
        ],
        holdDuration: 500,
      },
    ],
  },

  hamstringStretch: {
    id: 'hamstring-stretch',
    primaryJoint: 'hip',
    name: 'Standing Hamstring Stretch',
    description: 'Flexibility exercise for hamstrings',
    category: 'flexibility',
    difficulty: 'beginner',
    targetMuscles: ['hamstrings', 'calves'],
    equipment: [],
    targetRepetitions: 1,
    targetSets: 3,
    restDuration: 30000,
    instructions: [
      'Stand tall and place one foot forward',
      'Keep front leg straight',
      'Hinge at hips and reach toward toes',
      'Feel stretch in back of leg',
      'Hold for 30 seconds',
    ],
    phases: [
      {
        name: 'stretch',
        description: 'Holding the stretch position',
        jointRequirements: [
          {
            joint: 'left_hip',
            minAngle: 30,
            maxAngle: 60,
            targetAngle: 45,
          },
          {
            joint: 'left_knee',
            minAngle: 160,
            maxAngle: 180,
            targetAngle: 170,
          },
        ],
        holdDuration: 30000, // 30 seconds
      },
    ],
  },

  armRaise: {
    id: 'arm-raise',
    name: 'Forward Arm Raise',
    description: 'Shoulder flexion: lift the arm forward and up, side-on to the camera',
    category: 'rehabilitation',
    difficulty: 'beginner',
    primaryJoint: 'shoulder',
    targetMuscles: ['anterior deltoid'],
    equipment: [],
    targetRepetitions: 10,
    targetSets: 2,
    restDuration: 30000,
    instructions: [
      'Stand side-on to the camera, arms by your sides',
      'Keeping the elbow straight, lift your arm forward and up',
      'Go only as high as is comfortable',
      'Lower slowly',
    ],
    phases: [
      {
        name: 'start',
        description: 'Arm by the side',
        jointRequirements: [
          { joint: 'left_shoulder', minAngle: 0, maxAngle: 30, targetAngle: 10 },
          { joint: 'right_shoulder', minAngle: 0, maxAngle: 30, targetAngle: 10 },
        ],
      },
      {
        name: 'raise',
        description: 'Arm lifted forward',
        jointRequirements: [
          { joint: 'left_shoulder', minAngle: 140, maxAngle: 180, targetAngle: 160 },
          { joint: 'right_shoulder', minAngle: 140, maxAngle: 180, targetAngle: 160 },
        ],
        holdDuration: 1000,
      },
    ],
  },

  seatedKneeExtension: {
    id: 'seated-knee-extension',
    name: 'Seated Knee Extension',
    description:
      'Knee straightening while sitting (long-arc quad), side-on to the camera',
    category: 'rehabilitation',
    difficulty: 'beginner',
    primaryJoint: 'knee',
    targetMuscles: ['quadriceps'],
    equipment: ['armless chair'],
    targetRepetitions: 10,
    targetSets: 2,
    restDuration: 30000,
    instructions: [
      'Sit on an armless chair, side-on to the phone, with the leg you are exercising closest to it',
      'Put the phone level with your knee, far enough away to see your hip, knee and foot',
      'Sit tall with your thigh resting on the chair',
      'Slowly straighten your knee as far as is comfortable, and hold',
      'Lower your foot slowly back down',
    ],
    warnings: ['Keep your thigh on the chair and your back upright'],
    phases: [
      {
        name: 'bent',
        description: 'Knee bent, foot under the knee',
        jointRequirements: [
          { joint: 'left_knee', minAngle: 70, maxAngle: 125, targetAngle: 90 },
        ],
      },
      {
        name: 'straight',
        description: 'Knee straightened',
        jointRequirements: [
          { joint: 'left_knee', minAngle: 165, maxAngle: 180, targetAngle: 178 },
        ],
        holdDuration: 1000,
      },
    ],
  },

  seatedKneeFlexion: {
    id: 'seated-knee-flexion',
    name: 'Seated Knee Bend',
    description: 'Sliding the foot back under the chair to bend the knee past 90°',
    category: 'rehabilitation',
    difficulty: 'beginner',
    primaryJoint: 'knee',
    targetMuscles: ['hamstrings'],
    equipment: ['armless chair'],
    targetRepetitions: 10,
    targetSets: 2,
    restDuration: 30000,
    instructions: [
      'Sit on an armless chair, side-on to the phone, with the leg you are exercising closest to it',
      'Put the phone level with your knee, far enough away to see your hip, knee and foot',
      'Slide your foot back under the chair as far as is comfortable, and hold',
      'Slide it forward again',
    ],
    phases: [
      {
        name: 'start',
        description: 'Foot under the knee',
        jointRequirements: [
          { joint: 'left_knee', minAngle: 80, maxAngle: 125, targetAngle: 90 },
        ],
      },
      {
        name: 'bent',
        description: 'Foot slid back',
        jointRequirements: [
          { joint: 'left_knee', minAngle: 30, maxAngle: 70, targetAngle: 55 },
        ],
        holdDuration: 1000,
      },
    ],
  },
};

export const EXERCISE_CATEGORIES = [
  { id: 'strength', name: 'Strength Training', icon: '💪' },
  { id: 'flexibility', name: 'Flexibility', icon: '🧘' },
  { id: 'balance', name: 'Balance', icon: '🤸' },
  { id: 'cardio', name: 'Cardio', icon: '🏃' },
  { id: 'rehabilitation', name: 'Rehabilitation', icon: '🏥' },
  { id: 'posture', name: 'Posture', icon: '🧍' },
];
