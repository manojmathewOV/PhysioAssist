/**
 * Mock Pose Data Simulator (practice mode)
 *
 * Plays a virtual patient (src/testing/virtualPatient) doing the chosen exercise,
 * so practice mode, the web demo and smoke tests move through a full repetition
 * cycle and count reps exactly as they would with a camera. Frames go through
 * the real MediaPipe conversion and enrichment code.
 *
 * On web, `?virtualPatient=<scenario-id>` in the URL picks a specific scenario
 * (e.g. bicep-curl-occluded) for manual and Playwright testing.
 */

import { ProcessedPoseData } from '../types/pose';
import { VirtualPatient } from '../testing/virtualPatient/VirtualPatient';
import {
  Scenario,
  getScenario,
  practiceScenarioFor,
} from '../testing/virtualPatient/scenarios';

/** Scenario requested in the page URL (web only). */
const scenarioFromUrl = (): Scenario | undefined => {
  if (typeof window === 'undefined' || !window.location?.search) return undefined;
  const id = new URLSearchParams(window.location.search).get('virtualPatient');
  return id ? getScenario(id) : undefined;
};

export class MockPoseDataSimulator {
  private patient?: VirtualPatient;

  /**
   * Start generating pose data.
   * @param callback Receives each pose (timestamped with the real clock)
   * @param fps Frames per second (default 30)
   * @param exerciseId Exercise to perform (defaults to a bicep curl)
   */
  start(
    callback: (data: ProcessedPoseData) => void,
    fps: number = 30,
    exerciseId: string = 'bicep-curl'
  ): void {
    if (this.patient?.isActive()) {
      console.warn('MockPoseDataSimulator is already running');
      return;
    }
    const scenario = scenarioFromUrl() ?? practiceScenarioFor(exerciseId);
    this.patient = new VirtualPatient(scenario, { fps });
    this.patient.start(callback);
  }

  stop(): void {
    this.patient?.stop();
    this.patient = undefined;
  }

  isActive(): boolean {
    return this.patient?.isActive() ?? false;
  }

  /** Id of the scenario being played, if any. */
  get scenarioId(): string | undefined {
    return this.patient?.scenario.id;
  }
}

// Singleton instance
export const mockPoseDataSimulator = new MockPoseDataSimulator();
