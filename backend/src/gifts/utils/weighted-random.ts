import { randomInt } from "crypto";

export interface WeightedOutcome {
  multiplier: number;
  weight: number;
}

export function pickWeightedMultiplier(odds: WeightedOutcome[]): number {
  const totalWeight = odds.reduce((sum, o) => sum + o.weight, 0);
  const roll = randomInt(0, Math.round(totalWeight * 1000)) / 1000;

  let cumulative = 0;
  for (const outcome of odds) {
    cumulative += outcome.weight;
    if (roll < cumulative) {
      return outcome.multiplier;
    }
  }
  return odds[odds.length - 1].multiplier;
}
