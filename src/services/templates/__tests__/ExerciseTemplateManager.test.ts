/**
 * Unit Tests for ExerciseTemplateManager
 *
 * Tests template CRUD operations, filtering, prescription management,
 * and library statistics.
 *
 * @gate Gate 8 - Templates & API
 */

import ExerciseTemplateManager, {
  ExerciseTemplate,
  ExercisePrescription,
  ExerciseCategory,
  BodyRegion,
  Joint,
} from '../ExerciseTemplateManager';

describe('ExerciseTemplateManager', () => {
  let manager: ExerciseTemplateManager;

  beforeEach(() => {
    manager = new ExerciseTemplateManager();
  });

  // ========================================================================
  // Template CRUD
  // ========================================================================

  describe('Template CRUD operations', () => {
    it('should create a new template', () => {
      const template = manager.createTemplate({
        name: 'Test Exercise',
        description: 'Test description',
        category: 'strength',
        difficulty: 3,
        bodyRegion: 'upper_extremity',
        primaryJoints: ['shoulder'],
        indications: ['Test indication'],
        contraindications: ['Test contraindication'],
        estimatedDuration: 180,
        recommendedReps: 10,
        recommendedSets: 3,
        restPeriod: 60,
        patientInstructions: 'Test instructions',
        createdBy: 'test-user',
        version: '1.0.0',
        active: true,
        tags: ['test'],
      });

      expect(template.id).toBeTruthy();
      expect(template.name).toBe('Test Exercise');
      expect(template.createdAt).toBeLessThanOrEqual(Date.now());
      expect(template.updatedAt).toBeLessThanOrEqual(Date.now());
    });

    it('should retrieve a template by ID', () => {
      const created = manager.createTemplate({
        name: 'Test Exercise',
        description: 'Test description',
        category: 'strength',
        difficulty: 3,
        bodyRegion: 'upper_extremity',
        primaryJoints: ['shoulder'],
        indications: [],
        contraindications: [],
        estimatedDuration: 180,
        recommendedReps: 10,
        recommendedSets: 3,
        restPeriod: 60,
        patientInstructions: 'Test instructions',
        createdBy: 'test-user',
        version: '1.0.0',
        active: true,
        tags: [],
      });

      const retrieved = manager.getTemplate(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent template', () => {
      const template = manager.getTemplate('non-existent-id');
      expect(template).toBeNull();
    });

    it('should update a template', () => {
      const created = manager.createTemplate({
        name: 'Original Name',
        description: 'Original description',
        category: 'strength',
        difficulty: 2,
        bodyRegion: 'upper_extremity',
        primaryJoints: ['shoulder'],
        indications: [],
        contraindications: [],
        estimatedDuration: 180,
        recommendedReps: 10,
        recommendedSets: 3,
        restPeriod: 60,
        patientInstructions: 'Original instructions',
        createdBy: 'test-user',
        version: '1.0.0',
        active: true,
        tags: [],
      });

      const updated = manager.updateTemplate(created.id, {
        name: 'Updated Name',
        difficulty: 4,
      });

      expect(updated).toBeTruthy();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.difficulty).toBe(4);
      expect(updated!.updatedAt).toBeGreaterThan(created.updatedAt);
      expect(updated!.createdAt).toBe(created.createdAt); // Preserved
    });

    it('should return null when updating non-existent template', () => {
      const result = manager.updateTemplate('non-existent', { name: 'New Name' });
      expect(result).toBeNull();
    });

    it('should delete a template', () => {
      const created = manager.createTemplate({
        name: 'To Delete',
        description: 'Test',
        category: 'strength',
        difficulty: 3,
        bodyRegion: 'upper_extremity',
        primaryJoints: ['shoulder'],
        indications: [],
        contraindications: [],
        estimatedDuration: 180,
        recommendedReps: 10,
        recommendedSets: 3,
        restPeriod: 60,
        patientInstructions: 'Test',
        createdBy: 'test',
        version: '1.0.0',
        active: true,
        tags: [],
      });

      const deleted = manager.deleteTemplate(created.id);
      expect(deleted).toBe(true);

      const retrieved = manager.getTemplate(created.id);
      expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent template', () => {
      const deleted = manager.deleteTemplate('non-existent');
      expect(deleted).toBe(false);
    });
  });

  // ========================================================================
  // Template Filtering
  // ========================================================================

  describe('Template filtering', () => {
    beforeEach(() => {
      // Create sample templates
      manager.createTemplate({
        name: 'Shoulder Strength 1',
        description: 'Shoulder exercise',
        category: 'strength',
        difficulty: 3,
        bodyRegion: 'upper_extremity',
        primaryJoints: ['shoulder'],
        indications: [],
        contraindications: [],
        estimatedDuration: 180,
        recommendedReps: 10,
        recommendedSets: 3,
        restPeriod: 60,
        patientInstructions: 'Test',
        createdBy: 'test',
        version: '1.0.0',
        active: true,
        tags: ['shoulder', 'strength'],
      });

      manager.createTemplate({
        name: 'Knee Balance 1',
        description: 'Knee balance exercise',
        category: 'balance',
        difficulty: 2,
        bodyRegion: 'lower_extremity',
        primaryJoints: ['knee'],
        indications: [],
        contraindications: [],
        estimatedDuration: 120,
        recommendedReps: 30,
        recommendedSets: 3,
        restPeriod: 30,
        patientInstructions: 'Test',
        createdBy: 'test',
        version: '1.0.0',
        active: true,
        tags: ['knee', 'balance'],
      });
    });

    it('should filter by category', () => {
      const results = manager.filterTemplates({ category: 'strength' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(t => expect(t.category).toBe('strength'));
    });

    it('should filter by difficulty range', () => {
      const results = manager.filterTemplates({ difficultyMin: 2, difficultyMax: 3 });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(t => {
        expect(t.difficulty).toBeGreaterThanOrEqual(2);
        expect(t.difficulty).toBeLessThanOrEqual(3);
      });
    });

    it('should filter by body region', () => {
      const results = manager.filterTemplates({ bodyRegion: 'upper_extremity' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(t => expect(t.bodyRegion).toBe('upper_extremity'));
    });

    it('should filter by primary joint', () => {
      const results = manager.filterTemplates({ primaryJoint: 'shoulder' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(t => expect(t.primaryJoints).toContain('shoulder'));
    });

    it('should filter by active status', () => {
      const results = manager.filterTemplates({ active: true });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(t => expect(t.active).toBe(true));
    });

    it('should search in name and description', () => {
      const results = manager.filterTemplates({ searchTerm: 'shoulder' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(t => {
        const searchable = (t.name + t.description + t.tags.join(' ')).toLowerCase();
        expect(searchable).toContain('shoulder');
      });
    });

    it('should filter by tags', () => {
      const results = manager.filterTemplates({ tags: ['balance'] });
      expect(results.length).toBeGreaterThan(0);
      results.forEach(t => expect(t.tags).toContain('balance'));
    });

    it('should combine multiple filters', () => {
      const results = manager.filterTemplates({
        category: 'strength',
        bodyRegion: 'upper_extremity',
        difficultyMin: 3,
      });

      results.forEach(t => {
        expect(t.category).toBe('strength');
        expect(t.bodyRegion).toBe('upper_extremity');
        expect(t.difficulty).toBeGreaterThanOrEqual(3);
      });
    });
  });

  // ========================================================================
  // Prescription Management
  // ========================================================================

  describe('Prescription management', () => {
    let templateId: string;

    beforeEach(() => {
      const template = manager.createTemplate({
        name: 'Test Exercise',
        description: 'Test',
        category: 'strength',
        difficulty: 3,
        bodyRegion: 'upper_extremity',
        primaryJoints: ['shoulder'],
        indications: [],
        contraindications: [],
        estimatedDuration: 180,
        recommendedReps: 10,
        recommendedSets: 3,
        restPeriod: 60,
        patientInstructions: 'Test',
        createdBy: 'test',
        version: '1.0.0',
        active: true,
        tags: [],
      });
      templateId = template.id;
    });

    it('should create a prescription from template', () => {
      const prescription = manager.prescribeExercise(
        templateId,
        'patient-123',
        'therapist-456'
      );

      expect(prescription).toBeTruthy();
      expect(prescription!.id).toBeTruthy();
      expect(prescription!.templateId).toBe(templateId);
      expect(prescription!.patientId).toBe('patient-123');
      expect(prescription!.therapistId).toBe('therapist-456');
      expect(prescription!.status).toBe('active');
      expect(prescription!.completionPercent).toBe(0);
      expect(prescription!.trackProgress).toBe(true);
    });

    it('should use template defaults for reps/sets', () => {
      const prescription = manager.prescribeExercise(
        templateId,
        'patient-123',
        'therapist-456'
      );

      expect(prescription!.reps).toBe(10); // From template
      expect(prescription!.sets).toBe(3); // From template
    });

    it('should allow custom reps/sets', () => {
      const prescription = manager.prescribeExercise(
        templateId,
        'patient-123',
        'therapist-456',
        { reps: 15, sets: 4, frequencyPerWeek: 5 }
      );

      expect(prescription!.reps).toBe(15);
      expect(prescription!.sets).toBe(4);
      expect(prescription!.frequencyPerWeek).toBe(5);
    });

    it('should return null for non-existent template', () => {
      const prescription = manager.prescribeExercise(
        'non-existent',
        'patient-123',
        'therapist-456'
      );

      expect(prescription).toBeNull();
    });

    it('should update prescription', () => {
      const prescription = manager.prescribeExercise(
        templateId,
        'patient-123',
        'therapist-456'
      );

      const updated = manager.updatePrescription(prescription!.id, {
        completionPercent: 50,
        therapistNotes: 'Good progress',
      });

      expect(updated).toBeTruthy();
      expect(updated!.completionPercent).toBe(50);
      expect(updated!.therapistNotes).toBe('Good progress');
    });

    it('should get prescription by ID', () => {
      const created = manager.prescribeExercise(
        templateId,
        'patient-123',
        'therapist-456'
      );

      const retrieved = manager.getPrescription(created!.id);

      expect(retrieved).toEqual(created);
    });

    it('should get all prescriptions for patient', () => {
      manager.prescribeExercise(templateId, 'patient-123', 'therapist-456');
      manager.prescribeExercise(templateId, 'patient-123', 'therapist-456');
      manager.prescribeExercise(templateId, 'patient-999', 'therapist-456'); // Different patient

      const prescriptions = manager.getPrescriptionsForPatient('patient-123');

      expect(prescriptions).toHaveLength(2);
      prescriptions.forEach(p => expect(p.patientId).toBe('patient-123'));
    });

    it('should get active prescriptions for patient', () => {
      const p1 = manager.prescribeExercise(templateId, 'patient-123', 'therapist-456');
      manager.prescribeExercise(templateId, 'patient-123', 'therapist-456');

      // Cancel one prescription
      manager.cancelPrescription(p1!.id);

      const active = manager.getActivePrescriptionsForPatient('patient-123');

      expect(active).toHaveLength(1);
      active.forEach(p => expect(p.status).toBe('active'));
    });

    it('should cancel a prescription', () => {
      const prescription = manager.prescribeExercise(
        templateId,
        'patient-123',
        'therapist-456'
      );

      const cancelled = manager.cancelPrescription(prescription!.id);
      expect(cancelled).toBe(true);

      const retrieved = manager.getPrescription(prescription!.id);
      expect(retrieved!.status).toBe('cancelled');
    });
  });

  // ========================================================================
  // Library Statistics
  // ========================================================================

  describe('Library statistics', () => {
    it('should calculate library stats', () => {
      const stats = manager.getLibraryStats();

      expect(stats.totalTemplates).toBeGreaterThan(0); // Has default templates
      expect(stats.byCategory).toBeDefined();
      expect(stats.byDifficulty).toBeDefined();
      expect(stats.byBodyRegion).toBeDefined();
      expect(stats.activeCount).toBeGreaterThan(0);
    });

    it('should track most prescribed templates', () => {
      const template = manager.getAllTemplates()[0];

      // Prescribe the template multiple times
      for (let i = 0; i < 5; i++) {
        manager.prescribeExercise(template.id, `patient-${i}`, 'therapist-456');
      }

      const stats = manager.getLibraryStats();
      const topPrescribed = stats.mostPrescribed[0];

      expect(topPrescribed.templateId).toBe(template.id);
      expect(topPrescribed.count).toBeGreaterThanOrEqual(5);
    });

    it('should count templates by category', () => {
      const stats = manager.getLibraryStats();

      Object.values(stats.byCategory).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    it('should count templates by difficulty', () => {
      const stats = manager.getLibraryStats();

      expect(Object.keys(stats.byDifficulty)).toEqual(['1', '2', '3', '4', '5']);
    });
  });

  // ========================================================================
  // Import/Export
  // ========================================================================

  describe('Import/Export', () => {
    it('should export templates as JSON', () => {
      const json = manager.exportTemplates();

      expect(json).toBeTruthy();
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should import templates from JSON', () => {
      const original = manager.getAllTemplates();
      const json = manager.exportTemplates();

      const newManager = new ExerciseTemplateManager();
      newManager.clearTemplates(); // Clear defaults first
      const imported = newManager.importTemplates(json);

      expect(imported).toBe(original.length);
      expect(newManager.getAllTemplates()).toHaveLength(original.length);
    });

    it('should handle invalid JSON gracefully', () => {
      const imported = manager.importTemplates('invalid json');
      expect(imported).toBe(0);
    });

    it('should reset to default templates', () => {
      manager.createTemplate({
        name: 'Custom Template',
        description: 'Test',
        category: 'strength',
        difficulty: 3,
        bodyRegion: 'upper_extremity',
        primaryJoints: ['shoulder'],
        indications: [],
        contraindications: [],
        estimatedDuration: 180,
        recommendedReps: 10,
        recommendedSets: 3,
        restPeriod: 60,
        patientInstructions: 'Test',
        createdBy: 'test',
        version: '1.0.0',
        active: true,
        tags: [],
      });

      const beforeReset = manager.getAllTemplates().length;

      manager.resetToDefaults();

      const afterReset = manager.getAllTemplates().length;

      expect(afterReset).toBeLessThan(beforeReset);
      expect(afterReset).toBeGreaterThan(0); // Has default templates
    });
  });

  // ========================================================================
  // Default Templates
  // ========================================================================

  describe('Default templates', () => {
    it('should load default templates on initialization', () => {
      const templates = manager.getAllTemplates();

      expect(templates.length).toBeGreaterThan(0);
    });

    it('should have shoulder exercise templates', () => {
      const shoulderTemplates = manager.filterTemplates({
        primaryJoint: 'shoulder',
      });

      expect(shoulderTemplates.length).toBeGreaterThan(0);
    });

    it('should have knee exercise templates', () => {
      const kneeTemplates = manager.filterTemplates({
        primaryJoint: 'knee',
      });

      expect(kneeTemplates.length).toBeGreaterThan(0);
    });

    it('should have balance exercise templates', () => {
      const balanceTemplates = manager.filterTemplates({
        category: 'balance',
      });

      expect(balanceTemplates.length).toBeGreaterThan(0);
    });

    it('should have all default templates active', () => {
      const templates = manager.getAllTemplates();

      templates.forEach(template => {
        expect(template.active).toBe(true);
      });
    });

    it('should have clinical metadata in default templates', () => {
      const templates = manager.getAllTemplates();

      templates.forEach(template => {
        expect(template.indications.length).toBeGreaterThan(0);
        expect(template.contraindications.length).toBeGreaterThan(0);
        expect(template.patientInstructions).toBeTruthy();
      });
    });
  });
});
