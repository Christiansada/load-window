# Load Window

**Same energy. Better timing.** A browser-local scheduling lab for energy educators, students, and small-site analysts exploring flexible electricity demand.

Moving a load to the cheapest hour can overload a shared power budget or miss a deadline. Load Window checks every permitted combination of whole-hour starts for up to three uninterrupted loads, then shows the lowest energy cost that satisfies the modeled cap.

[Open the app](https://christiansada.github.io/load-window/) · [Source](https://github.com/Christiansada/load-window)

## Capabilities

- Enter 24 hourly prices, including negative rates, a constant base load, and an hourly power cap.
- Define one to three named loads with power, duration, earliest start, finish-by hour, and baseline start.
- Find the minimum-cost feasible schedule by exhaustive enumeration (at most 13,824 combinations).
- Compare cost, energy, peak demand, and start times against your baseline. An over-cap baseline is clearly flagged.
- Inspect an hourly chart and equivalent 24-row table, including the input prices.
- Download the complete inputs, units, baseline, and result as JSON, including infeasible results.
- Work without an account, API keys, external data requests, analytics, or browser storage. Reloading resets the sample.

## Install and use

Requires Node.js 22.12 or later and npm. Node 24 is used in CI.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The initial example is entirely synthetic. Edit assumptions, then select **Find lowest-cost schedule**. Changes invalidate old results and disable export until recomputation. **Reset sample** restores the demonstration. **Download review JSON** preserves the current scenario and output; this version does not import saved reviews.

Rates are arbitrary cost units per kWh: use one consistent unit for all 24 entries. Start hours run from 0 to 23; finish-by hours run from 1 to 24. For example, a duration of 2 starting at 17 runs in slots 17 and 18 and ends at 19:00. A finish-by value of 24 is midnight. Inputs must fit within one fixed 24-hour day.

## Configuration

No environment variables are used. [.env.example](.env.example) documents this. Vite uses relative asset paths so the production build works below a repository subpath. No secrets belong in this static app.

## Technology and data flow

TypeScript, Vite, semantic HTML, and CSS; no runtime dependencies. Vitest verifies the model. Playwright and axe-core verify browser interactions and basic accessibility.

Form → strict numeric validation → exhaustive scheduling → baseline/result comparison → chart, table, and JSON download. All computation is local. [Architecture](docs/architecture.md) specifies formulas, tolerance, tie-breaking, and validation bounds.

## Validation

```sh
npm run check
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
```

On Windows, browser tests use installed Microsoft Edge. On other systems, install Chromium with the command above. `check` runs formatting, lint, strict type checking, unit tests, and a production build. `npm run format` formats source. Browser tests exercise download contents, invalidation, invalid inputs, infeasibility, safe text rendering, keyboard navigation, four viewport widths, axe accessibility checks, and enlarged text. Automated accessibility checks are not a complete manual assistive-technology audit.

## Deployment

```sh
npm run build
npm run preview
```

Publish `dist/` to any static host. For GitHub Pages, set repository **Settings → Pages → Source → GitHub Actions**, then manually run **Deploy Pages** on `main`. That workflow validates and builds before deploying. The **Validate** workflow also checks pushes and pull requests. Never place credentials in the bundle.

## Limitations

This is an educational model, not equipment control, an electrical safety assessment, or a bill forecast. It does not model startup surges, conversion losses, variable power profiles, demand charges, fixed fees, taxes, solar, storage state of charge, uncertainty, midnight wrapping, timezones, or 23/25-hour daylight-saving days. A battery-charging example is just a constant-power load, not a battery model. All loads are mandatory and non-interruptible. Input rates and powers are bounded to avoid unbounded computation. Floating-point tolerance is documented; results display two decimals while exports retain calculation precision. A negative or zero baseline omits a percentage comparison. No persistence or import is provided.

## Data and sources

All bundled names, prices, and power values are invented and released under this repository's MIT license. No utility tariffs, measured device data, model weights, or external datasets are included. No AI model is used. [Design and provenance notes](docs/design.md) record interaction inspiration; no third-party code, imagery, fonts, or branding were copied.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Useful next steps include strict review import, variable base-load profiles, interval resolution with a bounded solver, and screen-reader testing. Each mathematical extension needs independent reference cases and explicit limitations. [Demo plan](docs/demo.md) and [social drafts](docs/social-drafts.md) describe only implemented behavior.
