/**
 * Modular Architecture Validation Script
 *
 * Validates all components of the modular architecture:
 * 1. Movement Registry
 * 2. Demo Manager
 * 3. Protocol Manager
 * 4. Component Integration
 *
 * Run this to ensure everything works after refactoring.
 */

import { MovementRegistry, MOVEMENT_REGISTRY, JOINT_METADATA, AVAILABLE_JOINTS, JointType, MovementType } from '../config/movements.config';
import { demoManager, DemoManager } from '../services/DemoManager';
import { ProtocolManager, PROTOCOL_REGISTRY } from '../config/protocols.config';

interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

export class ModularArchitectureValidator {
  private results: ValidationResult[] = [];

  /**
   * Run all validation tests
   */
  async runAll(): Promise<{ passed: number; failed: number; warnings: number; results: ValidationResult[] }> {
    console.log('🔍 Starting Modular Architecture Validation...\n');

    this.validateMovementRegistry();
    this.validateJointMetadata();
    await this.validateDemoManager();
    this.validateProtocolManager();
    this.validateIntegration();

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;

    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed:   ${passed}`);
    console.log(`❌ Failed:   ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📝 Total:    ${this.results.length}`);
    console.log('='.repeat(80) + '\n');

    // Print detailed results
    this.printResults();

    return {
      passed,
      failed,
      warnings,
      results: this.results,
    };
  }

  /**
   * Validate Movement Registry
   */
  private validateMovementRegistry(): void {
    console.log('1️⃣  Testing Movement Registry...');

    // Test 1: Registry exists and has movements
    try {
      if (MOVEMENT_REGISTRY.length > 0) {
        this.addResult('Movement Registry', 'Registry populated', 'PASS', `Found ${MOVEMENT_REGISTRY.length} movements`);
      } else {
        this.addResult('Movement Registry', 'Registry populated', 'FAIL', 'No movements found');
      }
    } catch (e) {
      this.addResult('Movement Registry', 'Registry populated', 'FAIL', `Error: ${e.message}`);
    }

    // Test 2: All movements have required fields
    let invalidCount = 0;
    MOVEMENT_REGISTRY.forEach(movement => {
      const validation = MovementRegistry.validate(movement.id);
      if (!validation.valid) {
        invalidCount++;
        this.addResult('Movement Registry', `Validate ${movement.id}`, 'FAIL', validation.errors.join(', '));
      }
    });

    if (invalidCount === 0) {
      this.addResult('Movement Registry', 'Movement validation', 'PASS', 'All movements valid');
    }

    // Test 3: Movement counts by joint
    const jointCounts: Record<string, number> = {};
    MOVEMENT_REGISTRY.forEach(m => {
      jointCounts[m.joint] = (jointCounts[m.joint] || 0) + 1;
    });

    this.addResult('Movement Registry', 'Joint distribution', 'PASS', JSON.stringify(jointCounts));

    // Test 4: Dual-mode display names
    let missingModeNames = 0;
    MOVEMENT_REGISTRY.forEach(m => {
      if (!m.displayName.simple || !m.displayName.advanced) {
        missingModeNames++;
      }
    });

    if (missingModeNames === 0) {
      this.addResult('Movement Registry', 'Dual-mode names', 'PASS', 'All movements have simple & advanced names');
    } else {
      this.addResult('Movement Registry', 'Dual-mode names', 'FAIL', `${missingModeNames} movements missing mode names`);
    }

    // Test 5: Demo availability
    let noDemoCount = 0;
    MOVEMENT_REGISTRY.forEach(m => {
      if (!m.demos.svg && !m.demos.video && !m.demos['3d']) {
        noDemoCount++;
      }
    });

    if (noDemoCount === 0) {
      this.addResult('Movement Registry', 'Demo availability', 'PASS', 'All movements have at least one demo format');
    } else {
      this.addResult('Movement Registry', 'Demo availability', 'WARN', `${noDemoCount} movements have no demo`);
    }

    // Test 6: MovementRegistry helper methods
    try {
      const shoulderMovements = MovementRegistry.getMovementsByJoint('shoulder');
      if (shoulderMovements.length === 4) {
        this.addResult('Movement Registry', 'getMovementsByJoint()', 'PASS', 'Found 4 shoulder movements');
      } else {
        this.addResult('Movement Registry', 'getMovementsByJoint()', 'FAIL', `Expected 4, got ${shoulderMovements.length}`);
      }
    } catch (e) {
      this.addResult('Movement Registry', 'getMovementsByJoint()', 'FAIL', `Error: ${e.message}`);
    }

    // Test 7: Display name retrieval
    try {
      const simpleName = MovementRegistry.getDisplayName('shoulder_flexion', 'simple');
      const advancedName = MovementRegistry.getDisplayName('shoulder_flexion', 'advanced');

      if (simpleName === 'Lift Forward' && advancedName === 'Forward Flexion') {
        this.addResult('Movement Registry', 'getDisplayName()', 'PASS', 'Correct names for both modes');
      } else {
        this.addResult('Movement Registry', 'getDisplayName()', 'FAIL', `Got: ${simpleName} / ${advancedName}`);
      }
    } catch (e) {
      this.addResult('Movement Registry', 'getDisplayName()', 'FAIL', `Error: ${e.message}`);
    }

    // Test 8: Total assessments calculation
    try {
      const total = MovementRegistry.getTotalAssessments();
      if (total >= 20) {
        this.addResult('Movement Registry', 'getTotalAssessments()', 'PASS', `${total} unique assessments`);
      } else {
        this.addResult('Movement Registry', 'getTotalAssessments()', 'WARN', `Only ${total} assessments (expected 20+)`);
      }
    } catch (e) {
      this.addResult('Movement Registry', 'getTotalAssessments()', 'FAIL', `Error: ${e.message}`);
    }
  }

  /**
   * Validate Joint Metadata
   */
  private validateJointMetadata(): void {
    console.log('2️⃣  Testing Joint Metadata...');

    // Test 1: JOINT_METADATA exists
    try {
      const jointCount = Object.keys(JOINT_METADATA).length;
      if (jointCount >= 4) {
        this.addResult('Joint Metadata', 'JOINT_METADATA defined', 'PASS', `${jointCount} joints defined`);
      } else {
        this.addResult('Joint Metadata', 'JOINT_METADATA defined', 'FAIL', `Only ${jointCount} joints`);
      }
    } catch (e) {
      this.addResult('Joint Metadata', 'JOINT_METADATA defined', 'FAIL', `Error: ${e.message}`);
    }

    // Test 2: AVAILABLE_JOINTS matches joints with movements
    try {
      const jointsWithMovements = [...new Set(MOVEMENT_REGISTRY.map(m => m.joint))];
      const availableMatch = AVAILABLE_JOINTS.every(j => jointsWithMovements.includes(j));

      if (availableMatch && AVAILABLE_JOINTS.length === jointsWithMovements.length) {
        this.addResult('Joint Metadata', 'AVAILABLE_JOINTS accuracy', 'PASS', `${AVAILABLE_JOINTS.length} joints have movements`);
      } else {
        this.addResult('Joint Metadata', 'AVAILABLE_JOINTS accuracy', 'WARN', 'Mismatch between AVAILABLE_JOINTS and actual movements');
      }
    } catch (e) {
      this.addResult('Joint Metadata', 'AVAILABLE_JOINTS accuracy', 'FAIL', `Error: ${e.message}`);
    }

    // Test 3: All joints have required fields
    try {
      let missingFields = 0;
      AVAILABLE_JOINTS.forEach(joint => {
        const meta = JOINT_METADATA[joint];
        if (!meta.displayName || !meta.description || !meta.icon) {
          missingFields++;
        }
      });

      if (missingFields === 0) {
        this.addResult('Joint Metadata', 'Required fields', 'PASS', 'All joints have displayName, description, icon');
      } else {
        this.addResult('Joint Metadata', 'Required fields', 'FAIL', `${missingFields} joints missing fields`);
      }
    } catch (e) {
      this.addResult('Joint Metadata', 'Required fields', 'FAIL', `Error: ${e.message}`);
    }
  }

  /**
   * Validate Demo Manager
   */
  private async validateDemoManager(): Promise<void> {
    console.log('3️⃣  Testing Demo Manager...');

    // Test 1: DemoManager instantiates
    try {
      if (demoManager) {
        this.addResult('Demo Manager', 'Instantiation', 'PASS', 'DemoManager singleton created');
      } else {
        this.addResult('Demo Manager', 'Instantiation', 'FAIL', 'DemoManager not created');
      }
    } catch (e) {
      this.addResult('Demo Manager', 'Instantiation', 'FAIL', `Error: ${e.message}`);
    }

    // Test 2: Get demo asset for SVG
    try {
      const demo = await demoManager.getDemoAsset('shoulder_flexion', {
        autoDetect: false,
        preferredFormat: 'svg',
      });

      if (demo && demo.format === 'svg') {
        this.addResult('Demo Manager', 'getDemoAsset() SVG', 'PASS', `Got SVG demo: ${demo.uri}`);
      } else {
        this.addResult('Demo Manager', 'getDemoAsset() SVG', 'FAIL', 'Could not get SVG demo');
      }
    } catch (e) {
      this.addResult('Demo Manager', 'getDemoAsset() SVG', 'FAIL', `Error: ${e.message}`);
    }

    // Test 3: Auto-detect best format
    try {
      const demo = await demoManager.getDemoAsset('shoulder_flexion', {
        autoDetect: true,
      });

      if (demo) {
        this.addResult('Demo Manager', 'Auto-detect format', 'PASS', `Selected: ${demo.format}`);
      } else {
        this.addResult('Demo Manager', 'Auto-detect format', 'FAIL', 'No demo returned');
      }
    } catch (e) {
      this.addResult('Demo Manager', 'Auto-detect format', 'FAIL', `Error: ${e.message}`);
    }

    // Test 4: Get available formats
    try {
      const formats = demoManager.getAvailableFormats('shoulder_flexion');
      if (formats.length > 0) {
        this.addResult('Demo Manager', 'getAvailableFormats()', 'PASS', `${formats.length} formats available`);
      } else {
        this.addResult('Demo Manager', 'getAvailableFormats()', 'WARN', 'No formats found');
      }
    } catch (e) {
      this.addResult('Demo Manager', 'getAvailableFormats()', 'FAIL', `Error: ${e.message}`);
    }

    // Test 5: Preload demos
    try {
      await demoManager.preloadDemos(['shoulder_flexion', 'shoulder_abduction']);
      this.addResult('Demo Manager', 'preloadDemos()', 'PASS', 'Preloaded 2 demos');
    } catch (e) {
      this.addResult('Demo Manager', 'preloadDemos()', 'FAIL', `Error: ${e.message}`);
    }

    // Test 6: Cache management
    try {
      const cacheSize = demoManager.getCacheSize();
      this.addResult('Demo Manager', 'Cache size', 'PASS', `${cacheSize.toFixed(2)} MB`);
    } catch (e) {
      this.addResult('Demo Manager', 'Cache size', 'FAIL', `Error: ${e.message}`);
    }
  }

  /**
   * Validate Protocol Manager
   */
  private validateProtocolManager(): void {
    console.log('4️⃣  Testing Protocol Manager...');

    // Test 1: Protocol registry populated
    try {
      if (PROTOCOL_REGISTRY.length >= 6) {
        this.addResult('Protocol Manager', 'Registry populated', 'PASS', `${PROTOCOL_REGISTRY.length} protocols defined`);
      } else {
        this.addResult('Protocol Manager', 'Registry populated', 'FAIL', `Only ${PROTOCOL_REGISTRY.length} protocols`);
      }
    } catch (e) {
      this.addResult('Protocol Manager', 'Registry populated', 'FAIL', `Error: ${e.message}`);
    }

    // Test 2: Get protocol by ID
    try {
      const protocol = ProtocolManager.getProtocol('rotator_cuff_week6');
      if (protocol && protocol.name === 'Post Rotator Cuff Surgery - Week 6') {
        this.addResult('Protocol Manager', 'getProtocol()', 'PASS', 'Found correct protocol');
      } else {
        this.addResult('Protocol Manager', 'getProtocol()', 'FAIL', 'Protocol not found or incorrect');
      }
    } catch (e) {
      this.addResult('Protocol Manager', 'getProtocol()', 'FAIL', `Error: ${e.message}`);
    }

    // Test 3: Get protocol steps
    try {
      const steps = ProtocolManager.getProtocolSteps('rotator_cuff_week6');
      if (steps.length === 4) {
        this.addResult('Protocol Manager', 'getProtocolSteps()', 'PASS', '4 steps in protocol');
      } else {
        this.addResult('Protocol Manager', 'getProtocolSteps()', 'FAIL', `Expected 4 steps, got ${steps.length}`);
      }
    } catch (e) {
      this.addResult('Protocol Manager', 'getProtocolSteps()', 'FAIL', `Error: ${e.message}`);
    }

    // Test 4: Filter protocols by category
    try {
      const postSurgery = ProtocolManager.getProtocolsByCategory('post-surgery');
      if (postSurgery.length >= 3) {
        this.addResult('Protocol Manager', 'getProtocolsByCategory()', 'PASS', `${postSurgery.length} post-surgery protocols`);
      } else {
        this.addResult('Protocol Manager', 'getProtocolsByCategory()', 'WARN', `Only ${postSurgery.length} post-surgery protocols`);
      }
    } catch (e) {
      this.addResult('Protocol Manager', 'getProtocolsByCategory()', 'FAIL', `Error: ${e.message}`);
    }

    // Test 5: Search protocols
    try {
      const shoulderProtocols = ProtocolManager.searchProtocols('shoulder');
      if (shoulderProtocols.length > 0) {
        this.addResult('Protocol Manager', 'searchProtocols()', 'PASS', `Found ${shoulderProtocols.length} shoulder protocols`);
      } else {
        this.addResult('Protocol Manager', 'searchProtocols()', 'WARN', 'No shoulder protocols found');
      }
    } catch (e) {
      this.addResult('Protocol Manager', 'searchProtocols()', 'FAIL', `Error: ${e.message}`);
    }

    // Test 6: Generate protocol link
    try {
      const link = ProtocolManager.generateProtocolLink('rotator_cuff_week6');
      if (link.startsWith('physioassist://protocol/')) {
        this.addResult('Protocol Manager', 'generateProtocolLink()', 'PASS', link);
      } else {
        this.addResult('Protocol Manager', 'generateProtocolLink()', 'FAIL', `Invalid link format: ${link}`);
      }
    } catch (e) {
      this.addResult('Protocol Manager', 'generateProtocolLink()', 'FAIL', `Error: ${e.message}`);
    }

    // Test 7: Validate all protocol steps reference valid movements
    let invalidSteps = 0;
    PROTOCOL_REGISTRY.forEach(protocol => {
      protocol.steps.forEach(step => {
        const movement = MovementRegistry.getMovement(step.movementId);
        if (!movement) {
          invalidSteps++;
          this.addResult('Protocol Manager', `Protocol ${protocol.id}`, 'FAIL', `Invalid movement: ${step.movementId}`);
        }
      });
    });

    if (invalidSteps === 0) {
      this.addResult('Protocol Manager', 'Protocol step validation', 'PASS', 'All protocol steps reference valid movements');
    }
  }

  /**
   * Validate integration between systems
   */
  private validateIntegration(): void {
    console.log('5️⃣  Testing System Integration...');

    // Test 1: Protocol → Movement Registry integration
    try {
      const protocol = ProtocolManager.getProtocol('general_shoulder_full');
      if (!protocol) throw new Error('Protocol not found');

      const firstStep = protocol.steps[0];
      const movement = MovementRegistry.getMovement(firstStep.movementId);

      if (movement) {
        this.addResult('Integration', 'Protocol → Movement Registry', 'PASS', `Protocol step resolved to movement: ${movement.displayName.simple}`);
      } else {
        this.addResult('Integration', 'Protocol → Movement Registry', 'FAIL', 'Could not resolve movement from protocol step');
      }
    } catch (e) {
      this.addResult('Integration', 'Protocol → Movement Registry', 'FAIL', `Error: ${e.message}`);
    }

    // Test 2: Movement → Demo Manager integration
    try {
      const movement = MovementRegistry.getMovement('shoulder_flexion');
      if (!movement) throw new Error('Movement not found');

      // Check if demo path from registry can be used by demo manager
      if (movement.demos.svg || movement.demos.video) {
        this.addResult('Integration', 'Movement → Demo Manager', 'PASS', 'Movement has demo paths for manager');
      } else {
        this.addResult('Integration', 'Movement → Demo Manager', 'WARN', 'Movement has no demos');
      }
    } catch (e) {
      this.addResult('Integration', 'Movement → Demo Manager', 'FAIL', `Error: ${e.message}`);
    }

    // Test 3: Complete workflow simulation
    try {
      // Simulate: User selects joint → gets movements → selects movement → gets demo
      const joint: JointType = 'shoulder';
      const movements = MovementRegistry.getMovementsByJoint(joint);
      const firstMovement = movements[0];
      const simpleName = firstMovement.displayName.simple;

      this.addResult('Integration', 'Complete workflow', 'PASS', `Joint(${joint}) → ${movements.length} movements → ${simpleName}`);
    } catch (e) {
      this.addResult('Integration', 'Complete workflow', 'FAIL', `Error: ${e.message}`);
    }

    // Test 4: Mode switching (simple ↔ advanced)
    try {
      const movement = MovementRegistry.getMovement('shoulder_flexion');
      if (!movement) throw new Error('Movement not found');

      const simple = movement.displayName.simple;
      const advanced = movement.displayName.advanced;
      const simpleDesc = movement.description.simple;
      const advancedDesc = movement.description.advanced;

      if (simple !== advanced && simpleDesc !== advancedDesc) {
        this.addResult('Integration', 'Mode switching', 'PASS', `Simple: "${simple}" / Advanced: "${advanced}"`);
      } else {
        this.addResult('Integration', 'Mode switching', 'WARN', 'Simple and advanced content are the same');
      }
    } catch (e) {
      this.addResult('Integration', 'Mode switching', 'FAIL', `Error: ${e.message}`);
    }
  }

  /**
   * Add a validation result
   */
  private addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any): void {
    const result: ValidationResult = { category, test, status, message, details };
    this.results.push(result);

    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`  ${icon} ${test}: ${message}`);
  }

  /**
   * Print detailed results
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📋 DETAILED RESULTS');
    console.log('='.repeat(80));

    const categories = [...new Set(this.results.map(r => r.category))];

    categories.forEach(category => {
      console.log(`\n${category}:`);
      const categoryResults = this.results.filter(r => r.category === category);

      categoryResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️ ';
        console.log(`  ${icon} ${result.test}`);
        console.log(`     ${result.message}`);
        if (result.details) {
          console.log(`     Details: ${JSON.stringify(result.details)}`);
        }
      });
    });
  }

  /**
   * Generate validation report as JSON
   */
  generateReport(): any {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const total = this.results.length;

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        warnings,
        passRate: ((passed / total) * 100).toFixed(2) + '%',
      },
      results: this.results,
      movements: {
        total: MOVEMENT_REGISTRY.length,
        byJoint: this.getMovementCountsByJoint(),
        totalAssessments: MovementRegistry.getTotalAssessments(),
      },
      protocols: {
        total: PROTOCOL_REGISTRY.length,
        byCategory: this.getProtocolCountsByCategory(),
      },
    };
  }

  private getMovementCountsByJoint(): Record<string, number> {
    const counts: Record<string, number> = {};
    MOVEMENT_REGISTRY.forEach(m => {
      counts[m.joint] = (counts[m.joint] || 0) + 1;
    });
    return counts;
  }

  private getProtocolCountsByCategory(): Record<string, number> {
    const counts: Record<string, number> = {};
    PROTOCOL_REGISTRY.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }
}

/**
 * Run validation
 */
export async function runModularArchitectureValidation(): Promise<any> {
  const validator = new ModularArchitectureValidator();
  await validator.runAll();
  return validator.generateReport();
}
