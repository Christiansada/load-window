export interface Load {
  name: string;
  kw: number;
  hours: number;
  earliest: number;
  finishBy: number;
  baseline: number;
}
export interface Scenario {
  rates: number[];
  baseKw: number;
  capKw: number;
  loads: Load[];
}
export interface Schedule {
  starts: number[];
  demand: number[];
  cost: number;
  peak: number;
  energy: number;
  withinCap: boolean;
}
export interface Solution {
  baseline: Schedule;
  best: Schedule | null;
  combinations: number;
  feasible: number;
}

const numberIn = (n: number, lo: number, hi: number) =>
  Number.isFinite(n) && n >= lo && n <= hi;
const integerIn = (n: number, lo: number, hi: number) =>
  Number.isInteger(n) && numberIn(n, lo, hi);
export function validate(s: Scenario): void {
  if (s.rates.length !== 24 || s.rates.some((r) => !numberIn(r, -1000, 1000)))
    throw new Error('Enter exactly 24 hourly rates between -1000 and 1000.');
  if (!numberIn(s.baseKw, 0, 100) || !numberIn(s.capKw, 0.01, 100))
    throw new Error(
      'Base load must be 0–100 kW and the power cap 0.01–100 kW.',
    );
  if (s.loads.length < 1 || s.loads.length > 3)
    throw new Error('Use one to three flexible loads.');
  s.loads.forEach((l, i) => {
    if (!l.name.trim() || l.name.length > 40)
      throw new Error(`Load ${i + 1}: use a name of 1–40 characters.`);
    if (!numberIn(l.kw, 0.01, 100))
      throw new Error(`Load ${i + 1}: power must be 0.01–100 kW.`);
    if (
      !integerIn(l.hours, 1, 24) ||
      !integerIn(l.earliest, 0, 23) ||
      !integerIn(l.finishBy, 1, 24) ||
      l.earliest + l.hours > l.finishBy
    )
      throw new Error(
        `Load ${i + 1}: whole-hour duration must fit between earliest start and finish by (0–24).`,
      );
    if (!integerIn(l.baseline, l.earliest, l.finishBy - l.hours))
      throw new Error(
        `Load ${i + 1}: baseline start must fit inside its operating window.`,
      );
  });
}
export function parseRates(text: string): number[] {
  const parts = text.trim().split(/[\s,;]+/);
  if (
    parts.length !== 24 ||
    parts.some((p) => !/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(p))
  )
    throw new Error(
      'Enter exactly 24 decimal rates, separated by spaces or commas.',
    );
  const rates = parts.map(Number);
  if (rates.some((r) => !numberIn(r, -1000, 1000)))
    throw new Error('Hourly rates must be between -1000 and 1000.');
  return rates;
}
function calculate(s: Scenario, starts: number[]): Schedule {
  const demand = Array<number>(24).fill(s.baseKw);
  s.loads.forEach((l, i) => {
    for (let h = starts[i]; h < starts[i] + l.hours; h++) demand[h] += l.kw;
  });
  return {
    starts: [...starts],
    demand,
    cost: demand.reduce((sum, kw, h) => sum + kw * s.rates[h], 0),
    peak: Math.max(...demand),
    energy: demand.reduce((a, b) => a + b, 0),
    withinCap: demand.every((kw) => kw <= s.capKw + 1e-9),
  };
}
export function evaluate(s: Scenario, starts: number[]): Schedule {
  validate(s);
  if (
    starts.length !== s.loads.length ||
    starts.some(
      (start, i) =>
        !integerIn(
          start,
          s.loads[i].earliest,
          s.loads[i].finishBy - s.loads[i].hours,
        ),
    )
  )
    throw new Error('Start hours must fit each load window.');
  return calculate(s, starts);
}
export function solve(s: Scenario): Solution {
  validate(s);
  const baseline = calculate(
    s,
    s.loads.map((l) => l.baseline),
  );
  let best: Schedule | null = null;
  let combinations = 0;
  let feasible = 0;
  const starts: number[] = [];
  const visit = (index: number) => {
    if (index === s.loads.length) {
      combinations++;
      const candidate = calculate(s, starts);
      if (candidate.withinCap) {
        feasible++;
        if (best === null || candidate.cost < best.cost - 1e-9)
          best = candidate;
      }
      return;
    }
    const l = s.loads[index];
    for (let h = l.earliest; h <= l.finishBy - l.hours; h++) {
      starts[index] = h;
      visit(index + 1);
    }
  };
  visit(0);
  return { baseline, best, combinations, feasible };
}
export function exportReview(scenario: Scenario, result: Solution): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      model: '24 one-hour slots; constant load power; no midnight wrap',
      units: {
        power: 'kW',
        energy: 'kWh',
        rate: 'cost units/kWh',
        cost: 'cost units',
      },
      scenario,
      result,
    },
    null,
    2,
  );
}
