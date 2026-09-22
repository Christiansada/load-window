import './style.css';
import {
  parseRates,
  solve,
  exportReview,
  type Scenario,
  type Solution,
} from './model';
import { sample } from './sample';
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
const time = (h: number) => `${String(h).padStart(2, '0')}:00`;
const fmt = (n: number) =>
  n.toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
let state = sample();
let review: { scenario: Scenario; result: Solution } | null = null;
function field(
  i: number,
  key: string,
  label: string,
  value: string | number,
  type = 'number',
) {
  return `<label>${label}<input aria-label="Load ${i + 1} ${label}" data-key="${key}" type="${type}" value="${escape(String(value))}" ${type === 'number' ? 'step="any"' : ''} required ${type === 'text' ? 'maxlength="40"' : ''}/></label>`;
}
function renderLoads() {
  el('loads').innerHTML = state.loads
    .map(
      (l, i) =>
        `<fieldset data-load="${i}"><legend>LOAD ${i + 1}</legend>${field(i, 'name', 'Name', l.name, 'text')}<div class="triple">${field(i, 'kw', 'Power (kW)', l.kw)}${field(i, 'hours', 'Duration (h)', l.hours)}${field(i, 'baseline', 'Baseline start', l.baseline)}</div><div class="pair">${field(i, 'earliest', 'Earliest start', l.earliest)}${field(i, 'finishBy', 'Finish by', l.finishBy)}</div><button class="remove text-button" type="button" data-remove="${i}" ${state.loads.length === 1 ? 'disabled' : ''}>Remove load ${i + 1}</button></fieldset>`,
    )
    .join('');
  el<HTMLButtonElement>('add').disabled = state.loads.length === 3;
}
function read(): Scenario {
  return {
    baseKw: el<HTMLInputElement>('base').valueAsNumber,
    capKw: el<HTMLInputElement>('cap').valueAsNumber,
    rates: parseRates(el<HTMLTextAreaElement>('rates').value),
    loads: readLoads(),
  };
}
function readLoads() {
  return [...document.querySelectorAll<HTMLFieldSetElement>('[data-load]')].map(
    (box) => {
      const input = (key: string) =>
        box.querySelector<HTMLInputElement>(`[data-key="${key}"]`)!;
      return {
        name: input('name').value,
        kw: input('kw').valueAsNumber,
        hours: input('hours').valueAsNumber,
        earliest: input('earliest').valueAsNumber,
        finishBy: input('finishBy').valueAsNumber,
        baseline: input('baseline').valueAsNumber,
      };
    },
  );
}
function invalidate() {
  review = null;
  el('output').replaceChildren();
  el<HTMLButtonElement>('export').disabled = true;
  el('status').textContent =
    'Inputs changed. Find a schedule to refresh the results.';
  el('sample-label').textContent = 'CUSTOM ASSUMPTIONS';
  el('error').hidden = true;
}
function render(s: Scenario, r: Solution) {
  const b = r.best;
  const base = r.baseline;
  el('status').textContent =
    `${r.feasible.toLocaleString('en')} feasible of ${r.combinations.toLocaleString('en')} combinations checked.`;
  if (!b) {
    el('output').innerHTML =
      '<div class="empty"><h3>No schedule fits this power cap.</h3><p>Try widening the operating windows, reducing load power, or exploring a higher model cap. No equipment recommendation is implied.</p></div>';
    return;
  }
  const delta = base.cost - b.cost;
  el('output').innerHTML =
    `<div class="metrics"><article class="metric featured"><p>Scheduled cost</p><strong>${fmt(b.cost)}</strong><span>cost units / day</span></article><article class="metric"><p>Baseline cost</p><strong>${fmt(base.cost)}</strong><span>cost units / day</span></article><article class="metric"><p>Cost reduction</p><strong>${fmt(delta)}</strong><span>${base.cost > 0 ? `${fmt((delta / base.cost) * 100)}% of baseline` : 'Percentage omitted: baseline ≤ 0'}</span></article></div><p class="baseline-note">${base.withinCap ? 'Baseline fits the power cap.' : 'Baseline exceeds the power cap; it is a comparison only.'} Total energy stays ${fmt(b.energy)} kWh.</p><div class="panel chart-panel"><div class="section-heading"><h3>Your day, rescheduled</h3><span class="badge">${fmt(b.peak)} / ${fmt(s.capKw)} kW PEAK</span></div><p class="hint">Hourly demand · <span class="legend baseline">striped: baseline</span> · <span class="legend scheduled">solid: scheduled</span></p><div class="chart" role="img" aria-label="Hourly power comparison. Exact hourly values are in the table below.">${b.demand
      .map((kw, h) => {
        const max = Math.max(s.capKw, base.peak, b.peak);
        return `<div class="column"><div class="bars"><i class="bar before" style="height:${(base.demand[h] / max) * 100}%"></i><i class="bar after" style="height:${(kw / max) * 100}%"></i></div><span>${h % 4 === 0 ? String(h).padStart(2, '0') : ''}</span></div>`;
      })
      .join(
        '',
      )}</div><p class="hint">00:00 to 24:00 · Chart scale: ${fmt(Math.max(s.capKw, base.peak, b.peak))} kW</p></div><div class="panel schedule-panel"><h3>Start here. Finish on time.</h3><div class="schedule-list">${s.loads.map((l, i) => `<article><div><h4>${escape(l.name)}</h4><p>${fmt(l.kw)} kW · ${l.hours} h · ${fmt(l.kw * l.hours)} kWh</p></div><div class="shift"><small>was ${time(l.baseline)}</small><strong>${time(b.starts[i])} → ${time(b.starts[i] + l.hours)}</strong></div></article>`).join('')}</div></div><details class="hourly"><summary>Inspect all 24 hours and rates</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Hourly values"><table><caption>Hourly model values; costs include base load.</caption><thead><tr><th scope="col">Hour</th><th scope="col">Rate</th><th scope="col">Baseline kW</th><th scope="col">Scheduled kW</th></tr></thead><tbody>${b.demand.map((kw, h) => `<tr><th scope="row">${time(h)}</th><td>${fmt(s.rates[h])}</td><td>${fmt(base.demand[h])}</td><td>${fmt(kw)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
function run() {
  try {
    const scenario = read();
    const result = solve(scenario);
    review = { scenario, result };
    el('error').hidden = true;
    render(scenario, result);
    el<HTMLButtonElement>('export').disabled = false;
  } catch (e) {
    review = null;
    el('output').replaceChildren();
    el<HTMLButtonElement>('export').disabled = true;
    el('status').textContent = 'No current result.';
    el('error').textContent =
      e instanceof Error ? e.message : 'Check the scenario inputs.';
    el('error').hidden = false;
    el('error').focus();
  }
}
function reset() {
  state = sample();
  el<HTMLInputElement>('base').value = String(state.baseKw);
  el<HTMLInputElement>('cap').value = String(state.capKw);
  el<HTMLTextAreaElement>('rates').value = state.rates.join(', ');
  renderLoads();
  el('sample-label').textContent = 'SYNTHETIC EXAMPLE';
  run();
}
el('scenario').addEventListener('submit', (e) => {
  e.preventDefault();
  run();
});
el('scenario').addEventListener('input', invalidate);
el('loads').addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.dataset.remove !== undefined) {
    state.loads = readLoads();
    state.loads.splice(Number(target.dataset.remove), 1);
    renderLoads();
    invalidate();
    el('add').focus();
  }
});
el('add').addEventListener('click', () => {
  state.loads = readLoads();
  if (state.loads.length < 3) {
    state.loads.push({
      name: 'New load',
      kw: 1,
      hours: 1,
      earliest: 0,
      finishBy: 24,
      baseline: 0,
    });
    renderLoads();
    invalidate();
  }
});
el('reset').addEventListener('click', reset);
el('export').addEventListener('click', () => {
  if (!review) return;
  const url = URL.createObjectURL(
    new Blob([exportReview(review.scenario, review.result)], {
      type: 'application/json',
    }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'load-window-review.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
reset();
