import type { Scenario } from './model';
// Invented values for demonstration, not a utility tariff or measured appliance data.
export function sample(): Scenario {
  return {
    rates: [
      0.12, 0.1, 0.09, 0.08, 0.09, 0.12, 0.18, 0.24, 0.26, 0.22, 0.18, 0.16,
      0.14, 0.13, 0.15, 0.2, 0.3, 0.38, 0.42, 0.4, 0.32, 0.24, 0.18, 0.14,
    ],
    baseKw: 0.4,
    capKw: 3.6,
    loads: [
      {
        name: 'Workshop cycle',
        kw: 2,
        hours: 2,
        earliest: 8,
        finishBy: 20,
        baseline: 17,
      },
      {
        name: 'Water circulation',
        kw: 0.8,
        hours: 3,
        earliest: 6,
        finishBy: 18,
        baseline: 7,
      },
      {
        name: 'Battery charging',
        kw: 1.5,
        hours: 4,
        earliest: 0,
        finishBy: 8,
        baseline: 4,
      },
    ],
  };
}
