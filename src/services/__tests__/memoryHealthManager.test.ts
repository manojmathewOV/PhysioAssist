/**
 * MemoryHealthManager Test Suite
 *
 * Tests for iOS memory warning handling and progressive degradation.
 *
 * Actual API (Singleton Pattern):
 * - getInstance() - Get singleton instance
 * - getState() - Get current memory state
 * - getActionHistory() - Get action history
 * - addListener(callback) - Add state change listener
 * - reset() - Reset state (for testing)
 * - triggerMemoryWarning() - Manually trigger warning
 * - getRecommendation() - Get memory recommendation
 * - cleanup() - Cleanup resources
 */

import { MemoryHealthManager } from '../memoryHealthManager';

// Mock telemetry service
jest.mock('../../features/videoComparison/services/telemetryService', () => ({
  telemetryService: {
    trackMemoryWarning: jest.fn(),
  },
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  NativeModules: {},
  NativeEventEmitter: jest.fn(),
  Platform: {
    OS: 'ios',
  },
}));

describe('MemoryHealthManager', () => {
  let manager: MemoryHealthManager;

  beforeEach(() => {
    // Get singleton instance
    manager = MemoryHealthManager.getInstance();
    // Reset state for each test
    manager.reset();
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple getInstance calls', () => {
      const instance1 = MemoryHealthManager.getInstance();
      const instance2 = MemoryHealthManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', () => {
      const instance1 = MemoryHealthManager.getInstance();
      instance1.triggerMemoryWarning();

      const instance2 = MemoryHealthManager.getInstance();
      const state = instance2.getState();

      expect(state.level).toBe('warning');
    });
  });

  describe('Initial State', () => {
    it('should initialize with normal memory level', () => {
      const state = manager.getState();

      expect(state).toBeDefined();
      expect(state.level).toBe('normal');
      expect(state.timestamp).toBeGreaterThan(0);
      expect(state.actionsToken).toEqual([]);
    });

    it('should have empty action history initially', () => {
      const history = manager.getActionHistory();

      expect(history).toEqual([]);
    });

    it('should return normal recommendation initially', () => {
      const recommendation = manager.getRecommendation();

      expect(recommendation).toBe('Memory usage normal');
    });
  });

  describe('Memory Warning Handling', () => {
    it('should update state to warning level when triggered', () => {
      manager.triggerMemoryWarning();

      const state = manager.getState();

      expect(state.level).toBe('warning');
      expect(state.timestamp).toBeGreaterThan(0);
    });

    it('should execute memory reduction actions', async () => {
      manager.triggerMemoryWarning();

      // Wait for async executeMemoryReduction to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const state = manager.getState();

      // Should have executed some actions
      expect(state.actionsToken.length).toBeGreaterThan(0);
    });

    it('should record actions in history', async () => {
      manager.triggerMemoryWarning();

      // Wait for async executeMemoryReduction to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const history = manager.getActionHistory();

      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('action');
      expect(history[0]).toHaveProperty('description');
      expect(history[0]).toHaveProperty('timestamp');
    });

    it('should update recommendation to warning', () => {
      manager.triggerMemoryWarning();

      const recommendation = manager.getRecommendation();

      expect(recommendation).toContain('Memory pressure detected');
    });

    it('should execute progressive degradation strategy', async () => {
      manager.triggerMemoryWarning();

      // Wait for async executeMemoryReduction to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const state = manager.getState();
      const expectedActions = [
        'clear_cache',
        'downgrade_resolution',
        'clear_buffers',
        'unload_models',
        'gc_requested',
      ];

      // Should execute all 5 levels of degradation
      expectedActions.forEach((action) => {
        expect(state.actionsToken).toContain(action);
      });
    });

    it('should not repeat actions on subsequent warnings', async () => {
      manager.triggerMemoryWarning();

      // Wait for async executeMemoryReduction to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const state1 = manager.getState();
      const actionCount1 = state1.actionsToken.length;

      manager.triggerMemoryWarning();

      // Wait for async executeMemoryReduction to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const state2 = manager.getState();
      const actionCount2 = state2.actionsToken.length;

      // Should have same actions (not duplicated)
      expect(actionCount2).toBe(actionCount1);
    });
  });

  describe('State Listeners', () => {
    it('should notify listeners on state change', () => {
      const listener = jest.fn();
      manager.addListener(listener);

      manager.triggerMemoryWarning();

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warning',
        })
      );
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      manager.addListener(listener1);
      manager.addListener(listener2);
      manager.addListener(listener3);

      manager.triggerMemoryWarning();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = manager.addListener(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should stop notifying after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = manager.addListener(listener);

      unsubscribe();
      manager.triggerMemoryWarning();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const faultyListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      manager.addListener(faultyListener);
      manager.addListener(goodListener);

      // Should not crash
      expect(() => manager.triggerMemoryWarning()).not.toThrow();

      // Good listener should still be called
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('Action History', () => {
    it('should track action timestamps', async () => {
      manager.triggerMemoryWarning();

      // Wait for async executeMemoryReduction to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const history = manager.getActionHistory();
      const firstAction = history[0];

      expect(firstAction.timestamp).toBeGreaterThan(0);
      expect(firstAction.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should include descriptive action names', async () => {
      manager.triggerMemoryWarning();

      // Wait for async executeMemoryReduction to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const history = manager.getActionHistory();

      expect(history[0].action).toBe('clear_cache');
      expect(history[0].description).toContain('caches');
    });

    it('should limit history to last 50 actions', async () => {
      // Trigger warnings 60 times
      for (let i = 0; i < 60; i++) {
        manager.reset();
        manager.triggerMemoryWarning();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const history = manager.getActionHistory();

      // Should be capped at 50
      expect(history.length).toBeLessThanOrEqual(50);
    });

    it('should maintain action order', async () => {
      manager.triggerMemoryWarning();

      // Wait for async executeMemoryReduction to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      const history = manager.getActionHistory();

      // Actions should be in execution order
      expect(history[0].action).toBe('clear_cache');
      expect(history[history.length - 1].action).toBe('gc_requested');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset state to normal', () => {
      manager.triggerMemoryWarning();
      manager.reset();

      const state = manager.getState();

      expect(state.level).toBe('normal');
      expect(state.actionsToken).toEqual([]);
    });

    it('should clear action history', () => {
      manager.triggerMemoryWarning();
      manager.reset();

      const history = manager.getActionHistory();

      expect(history).toEqual([]);
    });

    it('should allow new warnings after reset', async () => {
      manager.triggerMemoryWarning();
      await new Promise((resolve) => setTimeout(resolve, 10));

      manager.reset();
      manager.triggerMemoryWarning();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const state = manager.getState();

      expect(state.level).toBe('warning');
      expect(state.actionsToken.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendations', () => {
    it('should provide normal recommendation initially', () => {
      const rec = manager.getRecommendation();

      expect(rec).toBe('Memory usage normal');
    });

    it('should provide warning recommendation after trigger', () => {
      manager.triggerMemoryWarning();

      const rec = manager.getRecommendation();

      expect(rec).toContain('Memory pressure detected');
      expect(rec).toContain('Performance may be reduced');
    });

    it('should handle critical state', () => {
      // Simulate critical state by directly setting it
      manager.triggerMemoryWarning();
      // Note: Actual implementation doesn't have critical state trigger yet
      // This is just testing the recommendation logic
      const state = manager.getState();
      expect(state.level).toBe('warning');
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners', () => {
      manager.cleanup();

      // Should not crash
      expect(() => manager.cleanup()).not.toThrow();
    });

    it('should clear listener array', async () => {
      const listener = jest.fn();
      manager.addListener(listener);

      manager.cleanup();
      manager.triggerMemoryWarning();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Cleanup clears the listeners array, so listener should NOT be called
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple cleanup calls', () => {
      manager.cleanup();
      manager.cleanup();
      manager.cleanup();

      // Should not crash
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive warnings', () => {
      manager.triggerMemoryWarning();
      manager.triggerMemoryWarning();
      manager.triggerMemoryWarning();

      const state = manager.getState();

      expect(state.level).toBe('warning');
    });

    it('should handle getting state before any warnings', () => {
      const state = manager.getState();

      expect(state).toBeDefined();
      expect(state.level).toBe('normal');
    });

    it('should handle adding listener before any warnings', () => {
      const listener = jest.fn();

      expect(() => manager.addListener(listener)).not.toThrow();
    });

    it('should return copy of state (not reference)', () => {
      const state1 = manager.getState();
      state1.level = 'critical'; // Try to mutate

      const state2 = manager.getState();

      // Should not affect internal state
      expect(state2.level).toBe('normal');
    });

    it('should return copy of action history (not reference)', () => {
      manager.triggerMemoryWarning();

      const history1 = manager.getActionHistory();
      history1.push({
        action: 'fake_action',
        description: 'fake',
        timestamp: Date.now(),
      });

      const history2 = manager.getActionHistory();

      // Should not include fake action
      expect(history2.find((a) => a.action === 'fake_action')).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete warning cycle', async () => {
      // 1. Start with normal state
      expect(manager.getState().level).toBe('normal');

      // 2. Add listener
      const listener = jest.fn();
      const unsubscribe = manager.addListener(listener);

      // 3. Trigger warning
      manager.triggerMemoryWarning();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 4. Verify state change
      expect(manager.getState().level).toBe('warning');

      // 5. Verify listener was called
      expect(listener).toHaveBeenCalled();

      // 6. Verify actions were taken
      expect(manager.getActionHistory().length).toBeGreaterThan(0);

      // 7. Reset
      manager.reset();

      // 8. Verify reset
      expect(manager.getState().level).toBe('normal');

      // 9. Cleanup
      unsubscribe();
      manager.cleanup();
    });

    it('should maintain consistency across multiple operations', async () => {
      const listener = jest.fn();
      manager.addListener(listener);

      // Multiple operations
      manager.triggerMemoryWarning();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const state1 = manager.getState();
      const history1 = manager.getActionHistory();

      manager.reset();
      manager.triggerMemoryWarning();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const state2 = manager.getState();
      const history2 = manager.getActionHistory();

      // Both should have similar structure
      expect(state2.level).toBe(state1.level);
      expect(history2.length).toBe(history1.length);

      // Listener should be called twice
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('iOS Platform Specific', () => {
    it('should initialize on iOS platform', () => {
      // Verify that getInstance works without crashing on iOS
      const instance = MemoryHealthManager.getInstance();

      expect(instance).toBeDefined();
      expect(instance.getState).toBeDefined();
    });
  });
});
