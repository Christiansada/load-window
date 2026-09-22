# Architecture and numerical contract

`src/model.ts` contains a pure computation module, independent of the DOM. `src/sample.ts` owns the invented example. `src/main.ts` reads and validates the form, invalidates stale results, invokes the solver, renders text safely, and creates local Blob downloads. `src/style.css` defines responsive and print presentation. Vite produces static files; there is no server or persistence layer.

For hour h, demand[h] = baseKw + the sum of power for loads active at h. A load is active when start ≤ h < start + duration. Energy = sum(demand[h] × 1 hour). Cost = sum(demand[h] × 1 hour × rate[h]). The cap applies to total demand, including base load, in each slot.

Allowed starts are every integer from earliest through finishBy − duration inclusive. The solver enumerates the Cartesian product in load order. It rejects candidates exceeding the power cap by more than 1e-9 kW, and replaces the incumbent only when cost is lower by more than 1e-9 cost units. Thus numerical ties select lexicographically earliest starts, not lowest peak. Negative rates are supported without cost pruning. The maximum search has 24³ = 13,824 candidates; each is evaluated over 24 slots. There are no heuristics or optimality claims beyond this bounded model and tolerance.

Inputs: exactly 24 finite decimal rates in [-1000,1000], base power in [0,100], cap and each load power in [0.01,100], one to three loads, 1–24 whole-hour durations, earliest 0–23, finish-by 1–24, and a valid baseline start. Cycles and baselines must fit their window. Names are nonblank and at most 40 characters. The form uses valueAsNumber so an empty numeric field is rejected rather than treated as zero. Rate parsing rejects non-decimal tokens, scientific notation, and incorrect counts. Excessive base load is a valid but infeasible scenario.

Every form edit removes the old result and export reference immediately. Failed validation focuses an error alert. A valid infeasible scenario exports its null best result, comparison baseline, and zero feasible count. The full JSON review is versioned and includes the exact assumptions and units. It contains user-entered names: review it before sharing.

Unit tests cover hand-calculated results, boundaries, continuity, cap conflicts, ties, negative prices, energy conservation, exhaustive search bounds, and an independently implemented two-load hourly oracle over 80 deterministic scenarios. Browser tests use the production build, not the development server.
