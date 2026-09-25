import {
  inferenceBudgetMs,
  shouldStepDownModel,
  MODEL_DECISION_SAMPLES,
} from '../adaptiveModel';

describe('adaptive model selection', () => {
  it('budgets 80% of the frame interval, clamped to 25-80 ms', () => {
    expect(inferenceBudgetMs(30)).toBeCloseTo(26.7, 1);
    expect(inferenceBudgetMs(15)).toBeCloseTo(53.3, 1);
    expect(inferenceBudgetMs(60)).toBe(25);
    expect(inferenceBudgetMs(5)).toBe(80);
  });

  it('waits for enough samples before deciding', () => {
    expect(shouldStepDownModel(Array(MODEL_DECISION_SAMPLES - 1).fill(100), 30)).toBe(
      false
    );
  });

  it('steps down when the median exceeds the budget, ignoring outliers', () => {
    const fast = Array(MODEL_DECISION_SAMPLES).fill(15);
    fast[0] = 500; // one slow frame (e.g. first GPU warm-up) doesn't count
    expect(shouldStepDownModel(fast, 27)).toBe(false);
    expect(shouldStepDownModel(Array(MODEL_DECISION_SAMPLES).fill(40), 27)).toBe(true);
  });
});
