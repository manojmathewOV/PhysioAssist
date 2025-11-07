/**
 * Feedback Messages
 *
 * Centralized, localized feedback messages for error detection.
 * Organized by exercise type and error pattern.
 */

export interface FeedbackMessage {
  title: string;
  description: string;
  correction: string;
}

export interface LocalizedFeedbackMessages {
  // Shoulder errors
  shoulder: {
    shoulderHiking: FeedbackMessage;
    trunkLean: FeedbackMessage;
    internalRotation: FeedbackMessage;
    incompleteROM: FeedbackMessage;
  };

  // Knee errors
  knee: {
    kneeValgus: FeedbackMessage;
    heelLift: FeedbackMessage;
    posteriorPelvicTilt: FeedbackMessage;
    insufficientDepth: FeedbackMessage;
  };

  // Elbow errors
  elbow: {
    shoulderCompensation: FeedbackMessage;
    incompleteExtension: FeedbackMessage;
    wristDeviation: FeedbackMessage;
  };

  // General messages
  general: {
    goodRep: string;
    excellentForm: string;
    keepGoing: string;
    rest: string;
    sessionComplete: string;
    noErrors: string;
  };

  // Tempo messages
  tempo: {
    tooFast: string;
    tooSlow: string;
    goodPace: string;
  };
}

/**
 * English feedback messages
 */
export const FeedbackMessages_EN: LocalizedFeedbackMessages = {
  shoulder: {
    shoulderHiking: {
      title: 'Shoulder Hiking',
      description: "Your shoulder is lifting toward your ear during the movement",
      correction: "Keep your shoulder down and relaxed - don't shrug up toward your ear",
    },
    trunkLean: {
      title: 'Trunk Leaning',
      description: 'Your body is leaning to the side during the exercise',
      correction: 'Keep your trunk upright and core engaged - avoid leaning',
    },
    internalRotation: {
      title: 'Shoulder Internal Rotation',
      description: 'Your arm is rotating inward (thumb pointing down)',
      correction: 'Rotate your arm outward - keep your thumb pointing up or forward',
    },
    incompleteROM: {
      title: 'Incomplete Range of Motion',
      description: "You're not reaching the full range of motion",
      correction: 'Try to lift your arm higher - aim for the target angle shown',
    },
  },

  knee: {
    kneeValgus: {
      title: 'Knee Valgus (Knees Caving In)',
      description: 'Your knees are caving inward - this increases injury risk',
      correction: 'Push your knees outward - imagine spreading the floor apart with your feet',
    },
    heelLift: {
      title: 'Heels Lifting',
      description: 'Your heels are coming off the ground',
      correction: 'Keep your heels flat on the floor throughout the movement',
    },
    posteriorPelvicTilt: {
      title: 'Butt Tuck',
      description: 'Your lower back is rounding (butt tucking under)',
      correction: "Keep your chest up and maintain the natural curve in your lower back - don't tuck your tailbone",
    },
    insufficientDepth: {
      title: 'Not Deep Enough',
      description: "You're not squatting deep enough",
      correction: 'Go lower - aim for your thighs to be parallel to the ground',
    },
  },

  elbow: {
    shoulderCompensation: {
      title: 'Shoulder Moving',
      description: 'Your shoulder/upper arm is moving during the curl',
      correction: 'Keep your upper arm still and pinned to your side - only your forearm should move',
    },
    incompleteExtension: {
      title: 'Not Fully Extending',
      description: "You're not fully straightening your arm at the bottom",
      correction: 'Extend your arm completely at the bottom of each rep',
    },
    wristDeviation: {
      title: 'Wrist Bent',
      description: 'Your wrist is bending during the movement',
      correction: 'Keep your wrist straight and neutral - avoid bending it up or down',
    },
  },

  general: {
    goodRep: 'Good rep!',
    excellentForm: 'Excellent form!',
    keepGoing: 'Keep it up!',
    rest: 'Rest',
    sessionComplete: 'Session complete - great work!',
    noErrors: 'Great form - no errors detected!',
  },

  tempo: {
    tooFast: "You're moving too fast - slow down for better control",
    tooSlow: "You're moving slowly - try to match the reference speed",
    goodPace: 'Good pace - keep this speed',
  },
};

/**
 * Spanish feedback messages
 */
export const FeedbackMessages_ES: LocalizedFeedbackMessages = {
  shoulder: {
    shoulderHiking: {
      title: 'Elevación del Hombro',
      description: 'Tu hombro se está levantando hacia tu oreja durante el movimiento',
      correction: 'Mantén tu hombro abajo y relajado - no lo encojas hacia tu oreja',
    },
    trunkLean: {
      title: 'Inclinación del Tronco',
      description: 'Tu cuerpo se está inclinando hacia un lado durante el ejercicio',
      correction: 'Mantén tu tronco erguido y el núcleo activado - evita inclinarte',
    },
    internalRotation: {
      title: 'Rotación Interna del Hombro',
      description: 'Tu brazo está rotando hacia adentro (pulgar apuntando hacia abajo)',
      correction: 'Rota tu brazo hacia afuera - mantén el pulgar apuntando hacia arriba o adelante',
    },
    incompleteROM: {
      title: 'Rango de Movimiento Incompleto',
      description: 'No estás alcanzando el rango completo de movimiento',
      correction: 'Intenta levantar tu brazo más alto - apunta al ángulo objetivo mostrado',
    },
  },

  knee: {
    kneeValgus: {
      title: 'Valgo de Rodilla (Rodillas Hacia Adentro)',
      description: 'Tus rodillas se están doblando hacia adentro - esto aumenta el riesgo de lesión',
      correction: 'Empuja tus rodillas hacia afuera - imagina separar el suelo con tus pies',
    },
    heelLift: {
      title: 'Talones Levantándose',
      description: 'Tus talones se están despegando del suelo',
      correction: 'Mantén tus talones planos en el suelo durante todo el movimiento',
    },
    posteriorPelvicTilt: {
      title: 'Inclinación del Trasero',
      description: 'Tu espalda baja se está redondeando (trasero metiéndose)',
      correction: 'Mantén tu pecho arriba y la curva natural de tu espalda baja - no metas el coxis',
    },
    insufficientDepth: {
      title: 'No Suficiente Profundidad',
      description: 'No estás bajando lo suficiente en la sentadilla',
      correction: 'Baja más - apunta a que tus muslos estén paralelos al suelo',
    },
  },

  elbow: {
    shoulderCompensation: {
      title: 'Hombro Moviéndose',
      description: 'Tu hombro/brazo superior se está moviendo durante el curl',
      correction: 'Mantén tu brazo superior quieto y pegado a tu costado - solo tu antebrazo debe moverse',
    },
    incompleteExtension: {
      title: 'No Extendiendo Completamente',
      description: 'No estás enderezando tu brazo completamente en la parte inferior',
      correction: 'Extiende tu brazo completamente en la parte inferior de cada repetición',
    },
    wristDeviation: {
      title: 'Muñeca Doblada',
      description: 'Tu muñeca se está doblando durante el movimiento',
      correction: 'Mantén tu muñeca recta y neutral - evita doblarla hacia arriba o abajo',
    },
  },

  general: {
    goodRep: '¡Buena repetición!',
    excellentForm: '¡Excelente forma!',
    keepGoing: '¡Sigue así!',
    rest: 'Descanso',
    sessionComplete: 'Sesión completa - ¡buen trabajo!',
    noErrors: '¡Gran forma - no se detectaron errores!',
  },

  tempo: {
    tooFast: 'Te estás moviendo demasiado rápido - ve más despacio para mejor control',
    tooSlow: 'Te estás moviendo lentamente - intenta igualar la velocidad de referencia',
    goodPace: 'Buen ritmo - mantén esta velocidad',
  },
};

/**
 * Default messages (English)
 */
export const FeedbackMessages = FeedbackMessages_EN;

/**
 * Get localized feedback messages
 */
export function getLocalizedFeedbackMessages(locale: string = 'en'): LocalizedFeedbackMessages {
  switch (locale.toLowerCase().substring(0, 2)) {
    case 'es':
      return FeedbackMessages_ES;
    case 'en':
    default:
      return FeedbackMessages_EN;
  }
}
