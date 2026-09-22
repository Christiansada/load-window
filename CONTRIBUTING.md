# Contributing

Open an issue describing the user problem, model assumptions, and a small synthetic example. For a change, create a focused branch, implement it, run `npm ci`, `npm run check`, and `npm run test:e2e` (see the README for browser setup), then submit a pull request.

For mathematical changes, add hand-calculated cases or a genuinely independent oracle. For interface changes, check narrow screens, keyboard navigation, error focus, and stale-result handling. Keep runtime computation local and dependencies minimal. Do not submit credentials, private data, or proprietary material. Use invented examples or document a compatible data license. Contributions are offered under MIT.

Good first opportunities: a strict schema-versioned JSON import, clearer hourly keyboard exploration, or manual screen-reader testing. Discuss new models such as time-varying load profiles before broadening scope.
