# Design and data provenance

Reviewed 2026-09-22:

- [Home Assistant energy cards](https://www.home-assistant.io/dashboards/energy/): separate energy summaries and inspectable time-based information inspired the division between daily totals and hourly detail.
- [Carbon chart legends](https://carbondesignsystem.com/data-visualization/legends/): use multiple cues to distinguish series. This app combines striped/solid bars, a written legend, and an exact-values table.
- [GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/): visible, actionable validation and focus on the error after submission. This small form uses a single focused alert for its first validation failure.

These are design references, not dependencies, endorsements, or copied layouts. All code and CSS were written for this project. System fonts avoid external font requests. The muted green palette and compact workstation layout are original. No protected assets or screenshots from these products are bundled.

All example values in `src/sample.ts` are invented. They are not a tariff, an appliance specification, or observed savings. The computation is direct arithmetic and enumeration, not an AI model. Inputs never leave the page unless the user explicitly downloads and shares a review. Hosting providers may log ordinary page requests.
