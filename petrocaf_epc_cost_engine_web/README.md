# PETROCAF EPC Cost Engine Web

React/Vite implementation of the PETROCAF EPC Cost Engine v4.0 workspace.

## Purpose

This app is an offline-first browser workspace for EPC/Oil & Gas pricing tasks:

- Editable PETROCAF cost-rate library.
- Work-item build-ups for labor, equipment, and consumables.
- BOQ assembly with risk-factor pricing.
- Commercial offer summary with contingency, overhead, and profit sliders.
- PETROCAF Store Excel import with browser `localStorage` persistence.

## Architecture

```text
src/
  App.jsx                     UI composition and workflow state
  data/
    items.js                  Work-item calculation library
    rates.js                  Default rates and rate metadata
    stockGroups.js            PETROCAF material group labels
    tokens.js                 UI categories and formatters
  services/
    browserStorage.js         window.storage-compatible localStorage adapter
  styles.css                  Application theme and responsive layout
```

## Inputs / Outputs

### Inputs

- User-entered project/client metadata.
- Editable rate values in EGP/day, EGP/unit, productivity, percentages, and risk factors.
- BOQ quantities per selected work item.
- Optional PETROCAF Store Excel file (`.xlsx` / `.xls`).

### Outputs

- Direct labor/equipment/consumable cost per BOQ item.
- Risk-adjusted unit rate and line total.
- Direct cost, contingency, overhead, profit, and grand total.
- Searchable/paginated material inventory after Excel upload.

## Constraints and Assumptions

- **Assumption:** Source labels and rates are carried from the user-provided PETROCAF code; this implementation does not independently validate commercial rates.
- Browser storage is limited by the user's browser quota; large stock files are chunked in `localStorage`.
- This is a browser app. For Windows executable packaging, wrap the built app with a desktop shell or serve it through the existing Python/PySide project in a later phase.

## Quick Start

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```
