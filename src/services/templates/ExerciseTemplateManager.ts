/**
 * Exercise Template Manager
 *
 * Manages exercise templates for prescription and assignment.
 * Supports template CRUD, categorization, difficulty levels, and clinical metadata.
 *
 * @module ExerciseTemplateManager
 * @gate Gate 8 - Templates & API
 */

export interface ExerciseTemplate {
  /** Unique template ID */
  id: string;
  /** Template name */
  name: string;
  /** Detailed description */
  description: string;
  /** Exercise category */
  category: ExerciseCategory;
  /** Difficulty level (1-5) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Target body region */
  bodyRegion: BodyRegion;
  /** Primary joints involved */
  primaryJoints: Joint[];
  /** Secondary joints involved */
  secondaryJoints?: Joint[];
  /** Clinical indications */
  indications: string[];
  /** Contraindications */
  contraindications: string[];
  /** YouTube reference video URL */
  youtubeUrl?: string;
  /** Custom reference video URL */
  customVideoUrl?: string;
  /** Estimated duration (seconds) */
  estimatedDuration: number;
  /** Recommended repetitions */
  recommendedReps: number;
  /** Recommended sets */
  recommendedSets: number;
  /** Rest period between sets (seconds) */
  restPeriod: number;
  /** Clinical notes for therapists */
  clinicalNotes?: string;
  /** Patient instructions */
  patientInstructions: string;
  /** Equipment required */
  equipment?: string[];
  /** AAOS guidelines reference */
  aaosReference?: string;
  /** Research citations */
  researchCitations?: string[];
  /** Template author/creator */
  createdBy: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  updatedAt: number;
  /** Template version */
  version: string;
  /** Is template active/published */
  active: boolean;
  /** Tags for search */
  tags: string[];
}

export type ExerciseCategory =
  | 'strength'
  | 'flexibility'
  | 'balance'
  | 'endurance'
  | 'plyometric'
  | 'functional'
  | 'rehabilitation';

export type BodyRegion =
  | 'upper_extremity'
  | 'lower_extremity'
  | 'spine'
  | 'core'
  | 'full_body';

export type Joint =
  | 'shoulder'
  | 'elbow'
  | 'wrist'
  | 'hip'
  | 'knee'
  | 'ankle'
  | 'spine_cervical'
  | 'spine_thoracic'
  | 'spine_lumbar';

export interface ExercisePrescription {
  /** Unique prescription ID */
  id: string;
  /** Template ID */
  templateId: string;
  /** Patient ID */
  patientId: string;
  /** Therapist ID */
  therapistId: string;
  /** Prescription date */
  prescribedAt: number;
  /** Start date */
  startDate: number;
  /** End date (optional) */
  endDate?: number;
  /** Customized repetitions */
  reps: number;
  /** Customized sets */
  sets: number;
  /** Frequency (times per week) */
  frequencyPerWeek: number;
  /** Custom instructions for this patient */
  customInstructions?: string;
  /** Progress tracking enabled */
  trackProgress: boolean;
  /** Primary joint focus */
  primaryJointFocus?: Joint;
  /** Target metrics */
  targetMetrics?: {
    /** Target ROM (degrees) */
    targetROM?: number;
    /** Target strength (% of baseline) */
    targetStrength?: number;
    /** Target pain reduction (0-10 scale) */
    targetPainReduction?: number;
  };
  /** Prescription status */
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  /** Completion percentage */
  completionPercent: number;
  /** Last activity timestamp */
  lastActivityAt?: number;
  /** Notes from therapist */
  therapistNotes?: string;
}

export interface TemplateFilter {
  /** Filter by category */
  category?: ExerciseCategory;
  /** Filter by difficulty range */
  difficultyMin?: number;
  difficultyMax?: number;
  /** Filter by body region */
  bodyRegion?: BodyRegion;
  /** Filter by primary joint */
  primaryJoint?: Joint;
  /** Filter by active status */
  active?: boolean;
  /** Search in name/description */
  searchTerm?: string;
  /** Filter by tags */
  tags?: string[];
}

export interface TemplateLibraryStats {
  /** Total templates */
  totalTemplates: number;
  /** Templates by category */
  byCategory: Record<ExerciseCategory, number>;
  /** Templates by difficulty */
  byDifficulty: Record<number, number>;
  /** Templates by body region */
  byBodyRegion: Record<BodyRegion, number>;
  /** Active vs inactive */
  activeCount: number;
  inactiveCount: number;
  /** Most prescribed templates */
  mostPrescribed: Array<{ templateId: string; count: number }>;
}

/**
 * Exercise Template Manager
 *
 * Centralized service for managing exercise templates and prescriptions.
 */
export class ExerciseTemplateManager {
  private templates: Map<string, ExerciseTemplate> = new Map();
  private prescriptions: Map<string, ExercisePrescription> = new Map();
  private prescriptionsByPatient: Map<string, string[]> = new Map();
  private prescriptionsByTemplate: Map<string, number> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  // ========================================================================
  // Template Management
  // ========================================================================

  /**
   * Create a new exercise template
   */
  createTemplate(template: Omit<ExerciseTemplate, 'id' | 'createdAt' | 'updatedAt'>): ExerciseTemplate {
    const id = this.generateTemplateId();
    const now = Date.now();

    const newTemplate: ExerciseTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  /**
   * Update an existing template
   */
  updateTemplate(id: string, updates: Partial<ExerciseTemplate>): ExerciseTemplate | null {
    const template = this.templates.get(id);
    if (!template) {
      return null;
    }

    const now = Date.now();
    const updated: ExerciseTemplate = {
      ...template,
      ...updates,
      id, // Prevent ID override
      createdAt: template.createdAt, // Preserve creation date
      updatedAt: now > template.updatedAt ? now : template.updatedAt + 1, // Ensure timestamp increases
    };

    this.templates.set(id, updated);
    return updated;
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ExerciseTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ExerciseTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Filter templates
   */
  filterTemplates(filter: TemplateFilter): ExerciseTemplate[] {
    let results = this.getAllTemplates();

    if (filter.category) {
      results = results.filter(t => t.category === filter.category);
    }

    if (filter.difficultyMin !== undefined) {
      results = results.filter(t => t.difficulty >= filter.difficultyMin!);
    }

    if (filter.difficultyMax !== undefined) {
      results = results.filter(t => t.difficulty <= filter.difficultyMax!);
    }

    if (filter.bodyRegion) {
      results = results.filter(t => t.bodyRegion === filter.bodyRegion);
    }

    if (filter.primaryJoint) {
      results = results.filter(t => t.primaryJoints.includes(filter.primaryJoint!));
    }

    if (filter.active !== undefined) {
      results = results.filter(t => t.active === filter.active);
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(t =>
        filter.tags!.some(tag => t.tags.includes(tag))
      );
    }

    return results;
  }

  // ========================================================================
  // Prescription Management
  // ========================================================================

  /**
   * Create a prescription from a template
   */
  prescribeExercise(
    templateId: string,
    patientId: string,
    therapistId: string,
    options: {
      reps?: number;
      sets?: number;
      frequencyPerWeek?: number;
      customInstructions?: string;
      startDate?: number;
      endDate?: number;
      primaryJointFocus?: Joint;
      targetMetrics?: ExercisePrescription['targetMetrics'];
    } = {}
  ): ExercisePrescription | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      return null;
    }

    const id = this.generatePrescriptionId();
    const now = Date.now();

    const prescription: ExercisePrescription = {
      id,
      templateId,
      patientId,
      therapistId,
      prescribedAt: now,
      startDate: options.startDate || now,
      endDate: options.endDate,
      reps: options.reps || template.recommendedReps,
      sets: options.sets || template.recommendedSets,
      frequencyPerWeek: options.frequencyPerWeek || 3,
      customInstructions: options.customInstructions,
      trackProgress: true,
      primaryJointFocus: options.primaryJointFocus,
      targetMetrics: options.targetMetrics,
      status: 'active',
      completionPercent: 0,
    };

    this.prescriptions.set(id, prescription);

    // Update patient index
    const patientPrescriptions = this.prescriptionsByPatient.get(patientId) || [];
    patientPrescriptions.push(id);
    this.prescriptionsByPatient.set(patientId, patientPrescriptions);

    // Update prescription count
    const count = this.prescriptionsByTemplate.get(templateId) || 0;
    this.prescriptionsByTemplate.set(templateId, count + 1);

    return prescription;
  }

  /**
   * Update prescription status
   */
  updatePrescription(id: string, updates: Partial<ExercisePrescription>): ExercisePrescription | null {
    const prescription = this.prescriptions.get(id);
    if (!prescription) {
      return null;
    }

    const updated: ExercisePrescription = {
      ...prescription,
      ...updates,
      id, // Prevent ID override
    };

    this.prescriptions.set(id, updated);
    return updated;
  }

  /**
   * Get prescription by ID
   */
  getPrescription(id: string): ExercisePrescription | null {
    return this.prescriptions.get(id) || null;
  }

  /**
   * Get all prescriptions for a patient
   */
  getPrescriptionsForPatient(patientId: string): ExercisePrescription[] {
    const prescriptionIds = this.prescriptionsByPatient.get(patientId) || [];
    return prescriptionIds
      .map(id => this.prescriptions.get(id))
      .filter((p): p is ExercisePrescription => p !== undefined);
  }

  /**
   * Get active prescriptions for a patient
   */
  getActivePrescriptionsForPatient(patientId: string): ExercisePrescription[] {
    return this.getPrescriptionsForPatient(patientId).filter(
      p => p.status === 'active'
    );
  }

  /**
   * Cancel a prescription
   */
  cancelPrescription(id: string): boolean {
    const prescription = this.prescriptions.get(id);
    if (!prescription) {
      return false;
    }

    prescription.status = 'cancelled';
    this.prescriptions.set(id, prescription);
    return true;
  }

  // ========================================================================
  // Library Statistics
  // ========================================================================

  /**
   * Get template library statistics
   */
  getLibraryStats(): TemplateLibraryStats {
    const templates = this.getAllTemplates();

    const byCategory: Record<ExerciseCategory, number> = {
      strength: 0,
      flexibility: 0,
      balance: 0,
      endurance: 0,
      plyometric: 0,
      functional: 0,
      rehabilitation: 0,
    };

    const byDifficulty: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    };

    const byBodyRegion: Record<BodyRegion, number> = {
      upper_extremity: 0,
      lower_extremity: 0,
      spine: 0,
      core: 0,
      full_body: 0,
    };

    let activeCount = 0;
    let inactiveCount = 0;

    for (const template of templates) {
      byCategory[template.category]++;
      byDifficulty[template.difficulty]++;
      byBodyRegion[template.bodyRegion]++;

      if (template.active) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    }

    // Most prescribed templates
    const mostPrescribed = Array.from(this.prescriptionsByTemplate.entries())
      .map(([templateId, count]) => ({ templateId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalTemplates: templates.length,
      byCategory,
      byDifficulty,
      byBodyRegion,
      activeCount,
      inactiveCount,
      mostPrescribed,
    };
  }

  // ========================================================================
  // Import/Export
  // ========================================================================

  /**
   * Export templates as JSON
   */
  exportTemplates(): string {
    const templates = this.getAllTemplates();
    return JSON.stringify(templates, null, 2);
  }

  /**
   * Import templates from JSON
   */
  importTemplates(json: string): number {
    try {
      const templates: ExerciseTemplate[] = JSON.parse(json);
      let imported = 0;

      for (const template of templates) {
        this.templates.set(template.id, template);
        imported++;
      }

      return imported;
    } catch (error) {
      console.error('[ExerciseTemplateManager] Import failed:', error);
      return 0;
    }
  }

  /**
   * Clear all templates
   */
  clearTemplates(): void {
    this.templates.clear();
  }

  /**
   * Reset to default templates
   */
  resetToDefaults(): void {
    this.templates.clear();
    this.loadDefaultTemplates();
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  /**
   * Generate unique template ID
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate unique prescription ID
   */
  private generatePrescriptionId(): string {
    return `prescription_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Load default exercise templates
   */
  private loadDefaultTemplates(): void {
    // Shoulder exercises
    this.createTemplate({
      name: 'Shoulder Forward Flexion (Wall Slides)',
      description: 'Progressive shoulder flexion exercise using wall for support and guidance',
      category: 'rehabilitation',
      difficulty: 2,
      bodyRegion: 'upper_extremity',
      primaryJoints: ['shoulder'],
      indications: ['Rotator cuff repair', 'Frozen shoulder', 'Post-operative shoulder', 'Limited shoulder ROM'],
      contraindications: ['Acute shoulder dislocation', 'Recent fracture', 'Severe shoulder pain at rest'],
      estimatedDuration: 180,
      recommendedReps: 10,
      recommendedSets: 3,
      restPeriod: 60,
      patientInstructions: 'Stand facing wall with arms at sides. Slowly slide arms up wall, reaching as high as comfortable. Hold 2-3 seconds, then slowly return. Stop if sharp pain occurs.',
      clinicalNotes: 'Monitor for compensatory scapular elevation. Progress by increasing height of reach.',
      equipment: ['Wall'],
      aaosReference: 'AAOS Shoulder ROM Guidelines - Forward Flexion 180°',
      tags: ['shoulder', 'rom', 'flexion', 'rehabilitation'],
      createdBy: 'system',
      version: '1.0.0',
      active: true,
    });

    this.createTemplate({
      name: 'Shoulder Abduction (Scapular Plane)',
      description: 'Shoulder abduction in scapular plane (30° anterior to coronal) for optimal mechanics',
      category: 'strength',
      difficulty: 3,
      bodyRegion: 'upper_extremity',
      primaryJoints: ['shoulder'],
      secondaryJoints: ['elbow'],
      indications: ['Rotator cuff weakness', 'Shoulder instability', 'Post-surgical strengthening'],
      contraindications: ['Acute impingement', 'Recent rotator cuff tear', 'Uncontrolled pain'],
      estimatedDuration: 240,
      recommendedReps: 12,
      recommendedSets: 3,
      restPeriod: 90,
      patientInstructions: 'Stand with light weight in hand. Raise arm out to side at 30° angle forward. Lift to shoulder height, pause, then lower slowly. Thumb up position.',
      clinicalNotes: 'Scapular plane reduces subacromial impingement. Monitor for hiking or shrugging.',
      equipment: ['Light dumbbell (2-5 lbs)'],
      aaosReference: 'AAOS Shoulder ROM Guidelines - Abduction 180°',
      researchCitations: ['Townsend H et al. (1991) - Scapular plane abduction'],
      tags: ['shoulder', 'abduction', 'strength', 'rotator cuff'],
      createdBy: 'system',
      version: '1.0.0',
      active: true,
    });

    // Knee exercises
    this.createTemplate({
      name: 'Bodyweight Squat',
      description: 'Basic squat pattern for lower extremity strength and knee control',
      category: 'strength',
      difficulty: 3,
      bodyRegion: 'lower_extremity',
      primaryJoints: ['knee', 'hip'],
      secondaryJoints: ['ankle'],
      indications: ['ACL prevention', 'General lower extremity strength', 'Functional movement'],
      contraindications: ['Acute knee injury', 'Severe knee pain', 'Post-operative <6 weeks'],
      estimatedDuration: 180,
      recommendedReps: 15,
      recommendedSets: 3,
      restPeriod: 60,
      patientInstructions: 'Stand with feet shoulder-width apart. Lower hips back and down as if sitting in chair. Keep knees aligned over toes. Return to standing.',
      clinicalNotes: 'Monitor for knee valgus (knees caving in). Ensure neutral spine throughout movement.',
      equipment: [],
      aaosReference: 'AAOS Knee ROM Guidelines',
      researchCitations: ['Hewett TE et al. (2005) - Neuromuscular training for ACL injury prevention'],
      tags: ['knee', 'squat', 'strength', 'acl', 'functional'],
      createdBy: 'system',
      version: '1.0.0',
      active: true,
    });

    this.createTemplate({
      name: 'Single-Leg Balance',
      description: 'Proprioceptive balance training for ankle and knee stability',
      category: 'balance',
      difficulty: 2,
      bodyRegion: 'lower_extremity',
      primaryJoints: ['ankle', 'knee'],
      indications: ['Ankle sprain recovery', 'ACL prevention', 'Fall prevention', 'Proprioceptive training'],
      contraindications: ['Acute ankle injury', 'Severe balance impairment without support'],
      estimatedDuration: 120,
      recommendedReps: 30, // 30 seconds hold
      recommendedSets: 3,
      restPeriod: 30,
      patientInstructions: 'Stand on one leg with eyes open. Maintain balance for 30 seconds. Progress to eyes closed or unstable surface.',
      clinicalNotes: 'Observe for excessive hip or ankle movement. Progress difficulty as balance improves.',
      equipment: [],
      researchCitations: ['McKeon PO et al. (2008) - Balance training for ankle instability'],
      tags: ['balance', 'proprioception', 'ankle', 'knee', 'prevention'],
      createdBy: 'system',
      version: '1.0.0',
      active: true,
    });
  }
}

export default ExerciseTemplateManager;
