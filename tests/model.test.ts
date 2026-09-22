import { describe, it, expect } from 'vitest';
import {
  solve,
  evaluate,
  parseRates,
  validate,
  exportReview,
  type Scenario,
} from '../src/model';
import { sample } from '../src/sample';
const simple = (): Scenario => ({
  rates: Array<number>(24).fill(1),
  baseKw: 0,
  capKw: 2,
  loads: [
    { name: 'A', kw: 1, hours: 2, earliest: 0, finishBy: 4, baseline: 0 },
  ],
});
describe('scheduling arithmetic', () => {
  it('matches a hand-calculated cheapest contiguous window', () => {
    const s = simple();
    s.rates[2] = 0.1;
    s.rates[3] = 0.2;
    const r = solve(s);
    expect(r.best?.starts).toEqual([2]);
    expect(r.best?.cost).toBeCloseTo(0.3);
    expect(r.baseline.cost).toBe(2);
    expect(r.combinations).toBe(3);
  });
  it('does not split a cycle across cheap isolated hours', () => {
    const s = simple();
    s.rates[0] = 0;
    s.rates[2] = 0;
    expect(solve(s).best?.cost).toBe(1);
  });
  it('resolves ties by load order and earliest starts', () => {
    const s = simple();
    s.capKw = 1;
    s.loads.push({ ...s.loads[0], name: 'B' });
    expect(solve(s).best?.starts).toEqual([0, 2]);
    expect(solve(s).feasible).toBe(2);
  });
  it('includes base load in energy, cost and cap', () => {
    const s = simple();
    s.baseKw = 0.5;
    const r = solve(s);
    expect(r.best?.energy).toBe(14);
    expect(r.best?.cost).toBe(14);
    expect(r.best?.peak).toBe(1.5);
    s.capKw = 1.4;
    expect(solve(s).best).toBeNull();
  });
  it('flags an over-cap baseline while finding a feasible alternative', () => {
    const s = simple();
    s.capKw = 1;
    s.loads.push({ ...s.loads[0], name: 'B' });
    const r = solve(s);
    expect(r.baseline.withinCap).toBe(false);
    expect(r.best?.withinCap).toBe(true);
  });
  it('retains all-load energy after shifting', () => {
    const s = sample(),
      r = solve(s);
    expect(r.best?.energy).toBeCloseTo(r.baseline.energy);
    expect(r.best!.cost).toBeLessThan(r.baseline.cost);
  });
  it('handles negative and zero prices', () => {
    const s = simple();
    s.rates.fill(0);
    s.rates[2] = -2;
    expect(solve(s).best?.starts).toEqual([1]);
    expect(solve(s).best?.cost).toBe(-2);
  });
  it('allows a cycle ending exactly at midnight', () => {
    const s = simple();
    s.loads[0] = {
      name: 'A',
      kw: 1,
      hours: 1,
      earliest: 23,
      finishBy: 24,
      baseline: 23,
    };
    expect(solve(s).best?.demand[23]).toBe(1);
    expect(solve(s).combinations).toBe(1);
  });
  it('handles full-day cycles and floating point cap equality', () => {
    const s = simple();
    s.baseKw = 0.1;
    s.capKw = 0.3;
    s.loads[0] = {
      name: 'A',
      kw: 0.2,
      hours: 24,
      earliest: 0,
      finishBy: 24,
      baseline: 0,
    };
    expect(solve(s).best?.energy).toBeCloseTo(7.2);
  });
  it('does not mutate input', () => {
    const s = sample(),
      copy = structuredClone(s);
    solve(s);
    expect(s).toEqual(copy);
  });
  it('reports infeasible base load and impossible overlaps', () => {
    const s = simple();
    s.baseKw = 3;
    expect(solve(s).feasible).toBe(0);
    s.baseKw = 0;
    s.capKw = 1;
    s.loads[0].finishBy = 2;
    s.loads.push({ ...s.loads[0], name: 'B' });
    expect(solve(s).best).toBeNull();
  });
  it('bounds maximum enumeration at 24 cubed', () => {
    const s = simple();
    s.loads = Array.from({ length: 3 }, (_, i) => ({
      name: String(i),
      kw: 0.1,
      hours: 1,
      earliest: 0,
      finishBy: 24,
      baseline: 0,
    }));
    expect(solve(s).combinations).toBe(13824);
  });
  it('exports complete inputs and results as JSON', () => {
    const s = sample(),
      r = solve(s),
      e = JSON.parse(exportReview(s, r));
    expect(e.scenario).toEqual(s);
    expect(e.result).toEqual(r);
    expect(e.schemaVersion).toBe(1);
  });
  it('matches an independent two-load hourly oracle over 80 deterministic scenarios', () => {
    for (let n = 0; n < 80; n++) {
      const s = simple();
      s.rates = Array.from(
        { length: 24 },
        (_, h) => (((n * 7 + h * 11) % 17) - 3) / 10,
      );
      s.baseKw = (n % 3) / 10;
      s.capKw = 1.5 + (n % 4) / 2;
      s.loads = [
        {
          name: 'A',
          kw: 1,
          hours: 1 + (n % 3),
          earliest: 0,
          finishBy: 6,
          baseline: 0,
        },
        {
          name: 'B',
          kw: 1.5,
          hours: 1 + (n % 2),
          earliest: 1,
          finishBy: 7,
          baseline: 1,
        },
      ];
      let best = Infinity;
      let count = 0;
      for (let a = 0; a <= 6 - s.loads[0].hours; a++)
        for (let b = 1; b <= 7 - s.loads[1].hours; b++) {
          let cost = 0,
            valid = true;
          for (let h = 0; h < 24; h++) {
            const kw =
              s.baseKw +
              (h >= a && h < a + s.loads[0].hours ? 1 : 0) +
              (h >= b && h < b + s.loads[1].hours ? 1.5 : 0);
            if (kw > s.capKw + 1e-9) valid = false;
            cost += kw * s.rates[h];
          }
          if (valid) {
            count++;
            best = Math.min(best, cost);
          }
        }
      const r = solve(s);
      expect(r.feasible).toBe(count);
      if (count) expect(r.best!.cost).toBeCloseTo(best, 9);
      else expect(r.best).toBeNull();
    }
  });
});
describe('input boundaries', () => {
  it.each([NaN, Infinity, -0.1, 101])('rejects invalid base %s', (v) => {
    const s = simple();
    s.baseKw = v;
    expect(() => validate(s)).toThrow();
  });
  it.each([0, -1, Infinity, 101])('rejects invalid cap %s', (v) => {
    const s = simple();
    s.capKw = v;
    expect(() => validate(s)).toThrow();
  });
  it.each([0, 1.5, 25, NaN])('rejects invalid duration %s', (v) => {
    const s = simple();
    s.loads[0].hours = v;
    expect(() => validate(s)).toThrow();
  });
  it.each(['', ' '.repeat(3), 'a'.repeat(41)])('rejects invalid name', (v) => {
    const s = simple();
    s.loads[0].name = v;
    expect(() => validate(s)).toThrow();
  });
  it('rejects baseline outside window', () => {
    const s = simple();
    s.loads[0].baseline = 3;
    expect(() => validate(s)).toThrow(/baseline/);
    expect(() => evaluate(simple(), [-1])).toThrow();
    expect(() => evaluate(simple(), [])).toThrow();
  });
  it('rejects empty and excessive loads', () => {
    const s = simple();
    s.loads = [];
    expect(() => validate(s)).toThrow();
    s.loads = Array(4).fill(simple().loads[0]);
    expect(() => validate(s)).toThrow();
  });
  it('rejects wrong rate count, non-finite and excessive rates', () => {
    const s = simple();
    s.rates.pop();
    expect(() => validate(s)).toThrow();
    s.rates = Array(24).fill(NaN);
    expect(() => validate(s)).toThrow();
    s.rates.fill(1001);
    expect(() => validate(s)).toThrow();
  });
  it('parses decimal separators and negatives', () => {
    expect(parseRates(Array(24).fill('-.2').join('; '))).toEqual(
      Array(24).fill(-0.2),
    );
  });
  it.each(['', '1,2', '0x10', 'Infinity', '1e4', 'oops', '1001'])(
    'rejects malformed rate input %s',
    (v) => {
      expect(() => parseRates(Array(24).fill(v).join(','))).toThrow();
    },
  );
});
