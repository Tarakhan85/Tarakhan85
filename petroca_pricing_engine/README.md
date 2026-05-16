# PETROCAF Pricing Engine (MVP v0.2)

Offline-first Windows desktop application to manage tenders from pricing to execution tracking, risk, and price variance for EPC/Oil & Gas projects.

## Stack
- Python 3.12
- PySide6 (desktop UI)
- SQLAlchemy + SQLite

## Quick Start
```bash
python -m venv .venv
. .venv/bin/activate  # on Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python -m app.main
```

## Main Capabilities
- **Pricing**: Compute and save BOQ pricing transactions with detailed cost build-up.
- **Execution Tracking**: Capture project progress, actual cost, and remaining forecast.
- **Risk Register**: Add tender risks with probability/impact scoring.
- **Price Variance**: Dashboard compares baseline tender value against forecast final cost.

## Architecture
- `app/ui`: presentation layer
- `app/services`: business/application layer
- `app/db`: data layer
- `migrations/schema.sql`: SQL-first schema baseline

## Governance Defaults
- Append-only audit log
- Revision based projects
- Missing/Estimated flags required for non-source-backed values
