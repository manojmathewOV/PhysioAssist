/**
 * Performance Utilities
 *
 * Utilities to optimize React Native app performance:
 * - Redux action batching
 * - Throttling and debouncing
 * - Request Animation Frame utilities
 */

import { batch } from 'react-redux';
import { useRef, useCallback, useEffect } from 'react';

/**
 * Batch multiple Redux dispatch calls into a single render cycle
 *
 * Usage:
 * ```typescript
 * batchDispatch(() => {
 *   dispatch(action1());
 *   dispatch(action2());
 *   dispatch(action3());
 * });
 * ```
 *
 * This ensures React only re-renders once instead of 3 times
 */
export const batchDispatch = (callback: () => void): void => {
  batch(callback);
};

/**
 * Hook to throttle function calls
 * Useful for high-frequency events like pose detection updates
 *
 * @param callback Function to throttle
 * @param delay Minimum time between calls in milliseconds
 *
 * Usage:
 * ```typescript
 * const throttledUpdate = useThrottle((data) => {
 *   dispatch(setPoseData(data));
 * }, 100); // Update max 10 times per second
 * ```
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRan.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRan.current = now;
      } else {
        // Schedule for later if called too soon
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );
};

/**
 * Hook to debounce function calls
 * Useful for search inputs or expensive operations
 *
 * @param callback Function to debounce
 * @param delay Wait time before calling in milliseconds
 *
 * Usage:
 * ```typescript
 * const debouncedSearch = useDebounce((query) => {
 *   searchExercises(query);
 * }, 300);
 * ```
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

/**
 * Hook to batch updates using requestAnimationFrame
 * Ensures updates happen at most once per frame (60 FPS = ~16ms)
 *
 * @param callback Function to call
 *
 * Usage:
 * ```typescript
 * const batchedUpdate = useRAFBatch((data) => {
 *   updateUI(data);
 * });
 * ```
 */
export const useRAFBatch = <T extends (...args: any[]) => any>(
  callback: T
): ((...args: Parameters<T>) => void) => {
  const rafRef = useRef<number>();
  const argsRef = useRef<Parameters<T>>();

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (argsRef.current) {
            callback(...argsRef.current);
          }
          rafRef.current = undefined;
        });
      }
    },
    [callback]
  );
};

/**
 * Create a batched Redux dispatcher
 * Automatically batches multiple dispatches that happen in quick succession
 *
 * @param dispatch Redux dispatch function
 * @param batchWindow Time window to batch in milliseconds (default: 16ms = 1 frame)
 *
 * Usage:
 * ```typescript
 * const batchedDispatch = createBatchedDispatch(dispatch);
 *
 * // These will be batched into single render
 * batchedDispatch(action1());
 * batchedDispatch(action2());
 * batchedDispatch(action3());
 * ```
 */
export const createBatchedDispatch = (dispatch: any, batchWindow: number = 16) => {
  let actionQueue: any[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  const flushQueue = () => {
    if (actionQueue.length > 0) {
      batch(() => {
        actionQueue.forEach((action) => dispatch(action));
      });
      actionQueue = [];
    }
    timeoutId = null;
  };

  return (action: any) => {
    actionQueue.push(action);

    if (!timeoutId) {
      timeoutId = setTimeout(flushQueue, batchWindow);
    }
  };
};

/**
 * Performance monitoring utility
 * Tracks execution time of functions
 *
 * Usage:
 * ```typescript
 * const perfMonitor = new PerformanceMonitor('PoseDetection');
 * perfMonitor.start('inference');
 * // ... do work
 * perfMonitor.end('inference'); // Logs: "PoseDetection.inference: 32.5ms"
 * ```
 */
export class PerformanceMonitor {
  private timings: Map<string, number> = new Map();
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  start(label: string): void {
    this.timings.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.timings.get(label);
    if (startTime === undefined) {
      console.warn(`No start time found for ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timings.delete(label);

    if (__DEV__) {
      console.log(`[${this.name}] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  measure(label: string, fn: () => void): number {
    this.start(label);
    fn();
    return this.end(label);
  }

  async measureAsync(label: string, fn: () => Promise<void>): Promise<number> {
    this.start(label);
    await fn();
    return this.end(label);
  }
}
