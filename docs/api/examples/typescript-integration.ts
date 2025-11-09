/**
 * PhysioAssist Prescription API - TypeScript Integration Example
 *
 * This example demonstrates how to integrate with the PhysioAssist Prescription API
 * using TypeScript/JavaScript. Suitable for web dashboards, React Native apps,
 * and Node.js backends.
 *
 * Requirements:
 *   npm install axios
 *
 * Usage:
 *   ts-node typescript-integration.ts
 *   // or compile and run with node
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

export enum ExerciseCategory {
  STRENGTH = 'strength',
  FLEXIBILITY = 'flexibility',
  BALANCE = 'balance',
  ENDURANCE = 'endurance',
  PLYOMETRIC = 'plyometric',
  FUNCTIONAL = 'functional',
  REHABILITATION = 'rehabilitation',
}

export enum BodyRegion {
  UPPER_EXTREMITY = 'upper_extremity',
  LOWER_EXTREMITY = 'lower_extremity',
  SPINE = 'spine',
  CORE = 'core',
  FULL_BODY = 'full_body',
}

export enum Joint {
  SHOULDER = 'shoulder',
  ELBOW = 'elbow',
  WRIST = 'wrist',
  HIP = 'hip',
  KNEE = 'knee',
  ANKLE = 'ankle',
  SPINE_CERVICAL = 'spine_cervical',
  SPINE_THORACIC = 'spine_thoracic',
  SPINE_LUMBAR = 'spine_lumbar',
}

export enum PrescriptionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  bodyRegion: BodyRegion;
  primaryJoints: Joint[];
  secondaryJoints?: Joint[];
  indications: string[];
  contraindications: string[];
  youtubeUrl?: string;
  customVideoUrl?: string;
  estimatedDuration: number;
  recommendedReps: number;
  recommendedSets: number;
  restPeriod: number;
  clinicalNotes?: string;
  patientInstructions: string;
  equipment?: string[];
  aaosReference?: string;
  researchCitations?: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  version: string;
  active: boolean;
  tags: string[];
}

export interface ExercisePrescription {
  id: string;
  templateId: string;
  patientId: string;
  therapistId: string;
  prescribedAt: number;
  startDate: number;
  endDate?: number;
  reps: number;
  sets: number;
  frequencyPerWeek: number;
  customInstructions?: string;
  trackProgress: boolean;
  primaryJointFocus?: Joint;
  targetMetrics?: {
    targetROM?: number;
    targetStrength?: number;
    targetPainReduction?: number;
  };
  status: PrescriptionStatus;
  completionPercent: number;
  lastActivityAt?: number;
  therapistNotes?: string;
}

export interface TemplateFilter {
  category?: ExerciseCategory;
  difficultyMin?: number;
  difficultyMax?: number;
  bodyRegion?: BodyRegion;
  primaryJoint?: Joint;
  active?: boolean;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface PrescriptionCreate {
  templateId: string;
  patientId: string;
  therapistId: string;
  frequencyPerWeek: number;
  reps?: number;
  sets?: number;
  customInstructions?: string;
  startDate?: number;
  endDate?: number;
  primaryJointFocus?: Joint;
  targetMetrics?: {
    targetROM?: number;
    targetStrength?: number;
    targetPainReduction?: number;
  };
}

export interface PrescriptionUpdate {
  status?: PrescriptionStatus;
  completionPercent?: number;
  therapistNotes?: string;
  customInstructions?: string;
}

export interface LibraryStats {
  totalTemplates: number;
  byCategory: Record<ExerciseCategory, number>;
  byDifficulty: Record<number, number>;
  byBodyRegion: Record<BodyRegion, number>;
  activeCount: number;
  inactiveCount: number;
  mostPrescribed: Array<{ templateId: string; count: number }>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// ============================================================================
// PhysioAssist API Client
// ============================================================================

export class PhysioAssistClient {
  private client: AxiosInstance;

  constructor(apiKey: string, baseURL: string = 'https://api.physioassist.com/v1') {
    this.client = axios.create({
      baseURL,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          const apiError = error.response.data;
          throw new Error(`API Error ${error.response.status}: ${apiError.message}`);
        }
        throw error;
      }
    );
  }

  // ========================================================================
  // Template Management
  // ========================================================================

  /**
   * List exercise templates with optional filters
   */
  async listTemplates(filter?: TemplateFilter): Promise<{
    templates: ExerciseTemplate[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const response = await this.client.get('/templates', { params: filter });
    return response.data;
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId: string): Promise<ExerciseTemplate> {
    const response = await this.client.get(`/templates/${templateId}`);
    return response.data;
  }

  /**
   * Create a new exercise template (therapist/admin only)
   */
  async createTemplate(
    template: Omit<ExerciseTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExerciseTemplate> {
    const response = await this.client.post('/templates', template);
    return response.data;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<ExerciseTemplate>
  ): Promise<ExerciseTemplate> {
    const response = await this.client.put(`/templates/${templateId}`, updates);
    return response.data;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await this.client.delete(`/templates/${templateId}`);
  }

  // ========================================================================
  // Prescription Management
  // ========================================================================

  /**
   * Create a new prescription
   */
  async createPrescription(
    prescription: PrescriptionCreate
  ): Promise<ExercisePrescription> {
    const response = await this.client.post('/prescriptions', prescription);
    return response.data;
  }

  /**
   * Get a specific prescription by ID
   */
  async getPrescription(prescriptionId: string): Promise<ExercisePrescription> {
    const response = await this.client.get(`/prescriptions/${prescriptionId}`);
    return response.data;
  }

  /**
   * Update a prescription
   */
  async updatePrescription(
    prescriptionId: string,
    updates: PrescriptionUpdate
  ): Promise<ExercisePrescription> {
    const response = await this.client.patch(`/prescriptions/${prescriptionId}`, updates);
    return response.data;
  }

  /**
   * Cancel a prescription
   */
  async cancelPrescription(prescriptionId: string): Promise<void> {
    await this.client.delete(`/prescriptions/${prescriptionId}`);
  }

  /**
   * Get all prescriptions for a patient
   */
  async getPatientPrescriptions(
    patientId: string,
    status?: PrescriptionStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ prescriptions: ExercisePrescription[]; total: number }> {
    const params: any = { limit, offset };
    if (status) params.status = status;

    const response = await this.client.get(`/patients/${patientId}/prescriptions`, {
      params,
    });
    return response.data;
  }

  // ========================================================================
  // Library Statistics
  // ========================================================================

  /**
   * Get template library statistics
   */
  async getLibraryStats(): Promise<LibraryStats> {
    const response = await this.client.get('/library/stats');
    return response.data;
  }
}

// ============================================================================
// React Hooks (Optional - for React/React Native apps)
// ============================================================================

/**
 * React hook for fetching templates
 *
 * Usage:
 *   const { templates, loading, error, refetch } = useTemplates(client, { category: 'strength' });
 */
export function useTemplates(client: PhysioAssistClient, filter?: TemplateFilter) {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const result = await client.listTemplates(filter);
      setTemplates(result.templates);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [JSON.stringify(filter)]);

  return { templates, loading, error, refetch: fetchTemplates };
}

/**
 * React hook for fetching patient prescriptions
 */
export function usePatientPrescriptions(
  client: PhysioAssistClient,
  patientId: string,
  status?: PrescriptionStatus
) {
  const [prescriptions, setPrescriptions] = useState<ExercisePrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const result = await client.getPatientPrescriptions(patientId, status);
      setPrescriptions(result.prescriptions);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId, status]);

  return { prescriptions, loading, error, refetch: fetchPrescriptions };
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  // Initialize client
  const apiKey = 'your_api_key_here'; // Replace with actual API key
  const client = new PhysioAssistClient(apiKey);

  try {
    // Example 1: List shoulder strength exercises
    console.log('=== Example 1: List shoulder strength exercises ===');
    const { templates, total } = await client.listTemplates({
      category: ExerciseCategory.STRENGTH,
      search: 'shoulder',
      limit: 10,
    });
    console.log(`Found ${total} templates`);
    templates.forEach((template) => {
      console.log(`  - ${template.name} (Difficulty: ${template.difficulty}/5)`);
    });

    // Example 2: Get a specific template
    console.log('\n=== Example 2: Get specific template ===');
    // const template = await client.getTemplate('template_123');
    // console.log(`Template: ${template.name}`);
    // console.log(`Instructions: ${template.patientInstructions}`);

    // Example 3: Create a prescription
    console.log('\n=== Example 3: Create a prescription ===');
    // const prescription = await client.createPrescription({
    //   templateId: 'template_123',
    //   patientId: 'patient_456',
    //   therapistId: 'therapist_789',
    //   frequencyPerWeek: 3,
    //   reps: 12,
    //   sets: 3,
    //   customInstructions: 'Focus on controlled movement. Stop if pain exceeds 3/10.',
    //   primaryJointFocus: Joint.SHOULDER,
    //   targetMetrics: {
    //     targetROM: 180, // Target 180° forward flexion
    //     targetPainReduction: 5, // Reduce pain from 8/10 to 3/10
    //   },
    // });
    // console.log(`Prescription created: ${prescription.id}`);
    // console.log(`Status: ${prescription.status}`);

    // Example 4: Get patient's active prescriptions
    console.log("\n=== Example 4: Get patient's active prescriptions ===");
    // const { prescriptions } = await client.getPatientPrescriptions(
    //   'patient_456',
    //   PrescriptionStatus.ACTIVE
    // );
    // console.log(`Active prescriptions: ${prescriptions.length}`);
    // for (const prescription of prescriptions) {
    //   const template = await client.getTemplate(prescription.templateId);
    //   console.log(`  - ${template.name}: ${prescription.completionPercent}% complete`);
    // }

    // Example 5: Update prescription progress
    console.log('\n=== Example 5: Update prescription progress ===');
    // const updated = await client.updatePrescription('prescription_123', {
    //   completionPercent: 75,
    //   therapistNotes: 'Patient is progressing well. Increase difficulty next week.',
    // });
    // console.log(`Updated: ${updated.completionPercent}% complete`);

    // Example 6: Get library statistics
    console.log('\n=== Example 6: Get library statistics ===');
    const stats = await client.getLibraryStats();
    console.log(`Total templates: ${stats.totalTemplates}`);
    console.log(`Active templates: ${stats.activeCount}`);
    console.log('By category:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`  - ${category}: ${count}`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run example if executed directly
if (require.main === module) {
  main();
}

export default PhysioAssistClient;

// Note: To use React hooks, uncomment these imports:
// import { useState, useEffect } from 'react';
