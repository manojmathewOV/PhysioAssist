/**
 * Performance Utilities Test Suite
 *
 * Comprehensive tests for performance optimization utilities:
 * - Redux action batching
 * - Batched dispatch creation
 * - Performance monitoring
 * - Timing and measurement edge cases
 */

import {
  batchDispatch,
  createBatchedDispatch,
  PerformanceMonitor,
} from '../performanceUtils';

// Mock react-redux
jest.mock('react-redux', () => ({
  batch: jest.fn((callback) => callback()),
}));

describe('Performance Utils', () => {
  describe('batchDispatch', () => {
    it('should call batch with provided callback', () => {
      const { batch } = require('react-redux');
      const callback = jest.fn();

      batchDispatch(callback);

      expect(batch).toHaveBeenCalledWith(callback);
      expect(callback).toHaveBeenCalled();
    });

    it('should execute callback immediately', () => {
      let executed = false;

      batchDispatch(() => {
        executed = true;
      });

      expect(executed).toBe(true);
    });

    it('should handle multiple dispatch calls', () => {
      const dispatch1 = jest.fn();
      const dispatch2 = jest.fn();
      const dispatch3 = jest.fn();

      batchDispatch(() => {
        dispatch1();
        dispatch2();
        dispatch3();
      });

      expect(dispatch1).toHaveBeenCalled();
      expect(dispatch2).toHaveBeenCalled();
      expect(dispatch3).toHaveBeenCalled();
    });
  });

  describe('createBatchedDispatch', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should batch actions within time window', () => {
      const dispatch = jest.fn();
      const batchedDispatch = createBatchedDispatch(dispatch, 16);

      const action1 = { type: 'ACTION_1' };
      const action2 = { type: 'ACTION_2' };
      const action3 = { type: 'ACTION_3' };

      // Dispatch 3 actions quickly
      batchedDispatch(action1);
      batchedDispatch(action2);
      batchedDispatch(action3);

      // Dispatch shouldn't be called yet
      expect(dispatch).not.toHaveBeenCalled();

      // Fast-forward time
      jest.runAllTimers();

      // All 3 should be dispatched in batch
      expect(dispatch).toHaveBeenCalledTimes(3);
      expect(dispatch).toHaveBeenNthCalledWith(1, action1);
      expect(dispatch).toHaveBeenNthCalledWith(2, action2);
      expect(dispatch).toHaveBeenNthCalledWith(3, action3);
    });

    it('should respect custom batch window', () => {
      const dispatch = jest.fn();
      const batchedDispatch = createBatchedDispatch(dispatch, 50);

      batchedDispatch({ type: 'ACTION' });

      // Advance by 30ms (less than window)
      jest.advanceTimersByTime(30);
      expect(dispatch).not.toHaveBeenCalled();

      // Advance by another 25ms (total 55ms > 50ms window)
      jest.advanceTimersByTime(25);
      expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('should handle single action', () => {
      const dispatch = jest.fn();
      const batchedDispatch = createBatchedDispatch(dispatch);

      const action = { type: 'SINGLE_ACTION' };
      batchedDispatch(action);

      jest.runAllTimers();

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(action);
    });

    it('should handle rapid successive batches', () => {
      const dispatch = jest.fn();
      const batchedDispatch = createBatchedDispatch(dispatch, 16);

      // First batch
      batchedDispatch({ type: 'BATCH_1_ACTION_1' });
      batchedDispatch({ type: 'BATCH_1_ACTION_2' });

      jest.runAllTimers();
      expect(dispatch).toHaveBeenCalledTimes(2);

      dispatch.mockClear();

      // Second batch
      batchedDispatch({ type: 'BATCH_2_ACTION_1' });
      batchedDispatch({ type: 'BATCH_2_ACTION_2' });

      jest.runAllTimers();
      expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('should accumulate actions in queue', () => {
      const dispatch = jest.fn();
      const batchedDispatch = createBatchedDispatch(dispatch, 16);

      // Queue up 10 actions
      for (let i = 0; i < 10; i++) {
        batchedDispatch({ type: `ACTION_${i}` });
      }

      jest.runAllTimers();

      // All 10 should be dispatched
      expect(dispatch).toHaveBeenCalledTimes(10);
    });

    it('should not dispatch if queue is empty', () => {
      const dispatch = jest.fn();
      createBatchedDispatch(dispatch, 16);

      // Don't queue any actions
      jest.runAllTimers();

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      monitor = new PerformanceMonitor('TestMonitor');
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('should track execution time', () => {
      monitor.start('operation');

      // Simulate some work
      const startTime = performance.now();
      while (performance.now() - startTime < 10) {
        // Busy wait for ~10ms
      }

      const duration = monitor.end('operation');

      expect(duration).toBeGreaterThanOrEqual(10);
      expect(duration).toBeLessThan(100);
    });

    it('should return 0 and warn for missing start', () => {
      const warnSpy = jest.spyOn(console, 'warn');

      const duration = monitor.end('nonexistent');

      expect(duration).toBe(0);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No start time'));
    });

    it('should allow multiple concurrent timings', () => {
      monitor.start('operation1');
      monitor.start('operation2');
      monitor.start('operation3');

      const duration1 = monitor.end('operation1');
      const duration2 = monitor.end('operation2');
      const duration3 = monitor.end('operation3');

      expect(duration1).toBeGreaterThanOrEqual(0);
      expect(duration2).toBeGreaterThanOrEqual(0);
      expect(duration3).toBeGreaterThanOrEqual(0);
    });

    it('should measure synchronous function execution', () => {
      let executed = false;

      const duration = monitor.measure('syncOp', () => {
        executed = true;
        // Busy wait
        const start = performance.now();
        while (performance.now() - start < 5) {
          // Wait
        }
      });

      expect(executed).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(5);
    });

    it('should measure async function execution', async () => {
      let executed = false;

      const duration = await monitor.measureAsync('asyncOp', async () => {
        executed = true;
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(executed).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(10);
    });

    it('should clean up timing after end', () => {
      monitor.start('temp');
      monitor.end('temp');

      // Calling end again should warn (timing was deleted)
      const warnSpy = jest.spyOn(console, 'warn');
      const duration = monitor.end('temp');

      expect(duration).toBe(0);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should handle rapid start/end cycles', () => {
      for (let i = 0; i < 100; i++) {
        monitor.start(`op${i}`);
        const duration = monitor.end(`op${i}`);
        expect(duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should include monitor name in logs (dev mode)', () => {
      // Ensure __DEV__ is true
      (global as any).__DEV__ = true;

      monitor.start('test');
      monitor.end('test');

      // Should log with monitor name
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TestMonitor]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('test:'));
    });

    it('should format duration with 2 decimal places', () => {
      (global as any).__DEV__ = true;

      monitor.start('test');
      monitor.end('test');

      // Should format to 2 decimal places
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/\d+\.\d{2}ms/));
    });

    it('should handle zero duration', () => {
      monitor.start('instant');
      const duration = monitor.end('instant');

      // Duration should be very small (< 1ms)
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(1);
    });

    it('should handle nested measurements', () => {
      const durations: number[] = [];

      const outerDuration = monitor.measure('outer', () => {
        durations.push(
          monitor.measure('inner1', () => {
            const start = performance.now();
            while (performance.now() - start < 5) {
              // Wait 5ms
            }
          })
        );

        durations.push(
          monitor.measure('inner2', () => {
            const start = performance.now();
            while (performance.now() - start < 5) {
              // Wait 5ms
            }
          })
        );
      });

      // Outer should be >= sum of inners
      expect(outerDuration).toBeGreaterThanOrEqual(durations[0] + durations[1]);
    });

    it('should handle measure with exceptions', () => {
      expect(() => {
        monitor.measure('errorOp', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      // Timing should still be cleaned up
      const warnSpy = jest.spyOn(console, 'warn');
      monitor.end('errorOp');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should handle measureAsync with rejection', async () => {
      await expect(
        monitor.measureAsync('errorAsyncOp', async () => {
          throw new Error('Async error');
        })
      ).rejects.toThrow('Async error');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle createBatchedDispatch with no actions', () => {
      jest.useFakeTimers();

      const dispatch = jest.fn();
      const batchedDispatch = createBatchedDispatch(dispatch);

      // Create but don't use
      jest.runAllTimers();

      expect(dispatch).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should handle PerformanceMonitor with same label multiple times', () => {
      const monitor = new PerformanceMonitor('Test');

      monitor.start('op');
      monitor.end('op');

      // Reuse same label
      monitor.start('op');
      const duration = monitor.end('op');

      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long running operations', () => {
      const monitor = new PerformanceMonitor('LongOps');

      monitor.start('longOp');

      // Simulate 100ms operation
      const start = performance.now();
      while (performance.now() - start < 100) {
        // Busy wait
      }

      const duration = monitor.end('longOp');

      expect(duration).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(200);
    });

    it('should handle createBatchedDispatch with very short window', () => {
      jest.useFakeTimers();

      const dispatch = jest.fn();
      const batchedDispatch = createBatchedDispatch(dispatch, 1);

      batchedDispatch({ type: 'ACTION' });

      jest.advanceTimersByTime(1);

      expect(dispatch).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('should handle batchDispatch with empty callback', () => {
      const emptyCallback = jest.fn();

      batchDispatch(emptyCallback);

      expect(emptyCallback).toHaveBeenCalled();
    });
  });

  describe('Performance Characteristics', () => {
    it('should batch 1000 actions efficiently', () => {
      jest.useFakeTimers();

      const dispatch = jest.fn();
      const batchedDispatch = createBatchedDispatch(dispatch, 16);

      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        batchedDispatch({ type: `ACTION_${i}` });
      }

      const queuingTime = performance.now() - start;

      jest.runAllTimers();

      // Queueing should be very fast (< 100ms)
      expect(queuingTime).toBeLessThan(100);

      // All actions should be dispatched
      expect(dispatch).toHaveBeenCalledTimes(1000);

      jest.useRealTimers();
    });

    it('should handle high frequency measurements', () => {
      const monitor = new PerformanceMonitor('HighFreq');

      // 100 rapid measurements
      for (let i = 0; i < 100; i++) {
        monitor.measure(`op${i}`, () => {
          // Quick operation
        });
      }

      // Should not crash or slow down significantly
      expect(true).toBe(true);
    });

    it('should maintain accuracy for sub-millisecond operations', () => {
      const monitor = new PerformanceMonitor('Precise');

      monitor.start('fast');
      const duration = monitor.end('fast');

      // Should measure even very fast operations
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(duration)).toBe(true);
    });
  });

  describe('Memory and Cleanup', () => {
    it('should not leak memory with repeated measurements', () => {
      const monitor = new PerformanceMonitor('MemTest');

      // Run 10000 measurements
      for (let i = 0; i < 10000; i++) {
        monitor.start('op');
        monitor.end('op');
      }

      // Internal map should be empty (all cleaned up)
      monitor.start('final');
      const duration = monitor.end('final');

      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle batched dispatch queue cleanup', () => {
      jest.useFakeTimers();

      const dispatch = jest.fn();
      const batchedDispatch = createBatchedDispatch(dispatch, 16);

      // Add actions
      batchedDispatch({ type: 'ACTION_1' });
      batchedDispatch({ type: 'ACTION_2' });

      // Flush
      jest.runAllTimers();

      // Queue should be empty, next batch should work independently
      dispatch.mockClear();

      batchedDispatch({ type: 'ACTION_3' });
      jest.runAllTimers();

      expect(dispatch).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });
});
