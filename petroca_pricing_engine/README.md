# PETROCAF Pricing Engine (MVP v0.1)

Offline-first Windows desktop pricing application for EPC/Oil & Gas BOQ costing and governance.

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

## Architecture
- `app/ui`: presentation layer
- `app/services`: business/application layer
- `app/db`: data layer
- `migrations/schema.sql`: SQL-first schema baseline

## Governance Defaults
- Append-only audit log
- Revision based projects
- Missing/Estimated flags required for non-source-backed values
