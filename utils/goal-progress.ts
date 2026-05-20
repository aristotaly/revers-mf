/**
 * Progress from start → target using the latest logged scale weight (or trend).
 * Supports both weight-loss and weight-gain goals.
 */
export function computeGoalProgressPercent(
  startWeight: number,
  targetWeight: number,
  currentWeight: number,
): number {
  const total = targetWeight - startWeight;
  if (Math.abs(total) < 0.01) return currentWeight === targetWeight ? 100 : 0;

  const moved = currentWeight - startWeight;
  const raw = (moved / total) * 100;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/** Pick a sensible starting weight when the user leaves the field blank. */
export function defaultGoalStartWeight(
  loggedWeights: number[],
  targetWeight: number,
  currentWeight: number,
): number {
  if (loggedWeights.length === 0) return currentWeight;

  const maxW = Math.max(...loggedWeights);
  const minW = Math.min(...loggedWeights);

  // Weight-loss goal: baseline is the high watermark (not today's weight).
  if (targetWeight < currentWeight) {
    return Math.max(maxW, currentWeight);
  }
  // Weight-gain goal: baseline is the low watermark.
  if (targetWeight > currentWeight) {
    return Math.min(minW, currentWeight);
  }
  return currentWeight;
}

/**
 * If a goal was saved with start ≈ current (old bug), use historical extrema
 * so progress is not stuck at 0% for long-term trackers.
 */
export function resolveGoalStartWeight(
  storedStart: number,
  targetWeight: number,
  loggedWeights: number[],
  currentWeight: number,
): number {
  if (loggedWeights.length === 0) return storedStart;

  const maxW = Math.max(...loggedWeights);
  const minW = Math.min(...loggedWeights);

  if (targetWeight < storedStart - 0.05) {
    const stuckAtCurrent = Math.abs(storedStart - currentWeight) < 0.15;
    if (stuckAtCurrent && maxW > storedStart + 0.3) {
      return maxW;
    }
    return Math.max(storedStart, maxW);
  }

  if (targetWeight > storedStart + 0.05) {
    const stuckAtCurrent = Math.abs(storedStart - currentWeight) < 0.15;
    if (stuckAtCurrent && minW < storedStart - 0.3) {
      return minW;
    }
    return Math.min(storedStart, minW);
  }

  return storedStart;
}
