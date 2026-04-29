PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL CHECK(role IN ('ADMIN','ESTIMATOR','REVIEWER','VIEWER')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_code TEXT NOT NULL UNIQUE,
    project_name TEXT NOT NULL,
    client_name TEXT,
    tender_name TEXT,
    currency_code TEXT NOT NULL,
    vat_enabled INTEGER NOT NULL DEFAULT 0,
    current_revision_no INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE project_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    revision_no INTEGER NOT NULL,
    is_frozen INTEGER NOT NULL DEFAULT 0,
    frozen_by INTEGER,
    frozen_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(project_id, revision_no),
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(frozen_by) REFERENCES users(id)
);

CREATE TABLE boq_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_revision_id INTEGER NOT NULL,
    item_no TEXT,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    uom TEXT NOT NULL,
    source_status TEXT NOT NULL CHECK(source_status IN ('SOURCE_BACKED','ESTIMATED','MISSING','MANUAL_OVERRIDE')),
    source_reference TEXT,
    classification_status TEXT NOT NULL CHECK(classification_status IN ('AUTO_CLASSIFIED','MANUAL_REVIEW_REQUIRED','MANUALLY_CONFIRMED','UNCLASSIFIED')),
    discipline TEXT,
    activity_type TEXT,
    manual_override_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_revision_id) REFERENCES project_revisions(id)
);

CREATE TABLE market_factors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_revision_id INTEGER NOT NULL,
    labor_factor REAL NOT NULL DEFAULT 1.0,
    material_factor REAL NOT NULL DEFAULT 1.0,
    equipment_factor REAL NOT NULL DEFAULT 1.0,
    productivity_factor REAL NOT NULL DEFAULT 1.0,
    logistics_factor REAL NOT NULL DEFAULT 1.0,
    risk_factor REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_revision_id) REFERENCES project_revisions(id)
);

CREATE TABLE pricing_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    boq_item_id INTEGER NOT NULL,
    labor_cost REAL NOT NULL DEFAULT 0,
    material_cost REAL NOT NULL DEFAULT 0,
    equipment_cost REAL NOT NULL DEFAULT 0,
    consumables_cost REAL NOT NULL DEFAULT 0,
    subcontractor_cost REAL NOT NULL DEFAULT 0,
    direct_cost REAL NOT NULL DEFAULT 0,
    calibrated_direct_cost REAL NOT NULL DEFAULT 0,
    indirect_cost REAL NOT NULL DEFAULT 0,
    contingency_cost REAL NOT NULL DEFAULT 0,
    overhead_cost REAL NOT NULL DEFAULT 0,
    profit_cost REAL NOT NULL DEFAULT 0,
    final_price REAL NOT NULL DEFAULT 0,
    has_critical_missing INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(boq_item_id) REFERENCES boq_items(id)
);

CREATE TABLE assumptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_revision_id INTEGER NOT NULL,
    scope_level TEXT NOT NULL CHECK(scope_level IN ('PROJECT','DISCIPLINE','ITEM')),
    linked_item_id INTEGER,
    statement TEXT NOT NULL,
    owner TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_revision_id) REFERENCES project_revisions(id),
    FOREIGN KEY(linked_item_id) REFERENCES boq_items(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE pricing_risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_revision_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    related_scope TEXT,
    probability INTEGER NOT NULL CHECK(probability BETWEEN 1 AND 5),
    impact INTEGER NOT NULL CHECK(impact BETWEEN 1 AND 5),
    risk_score INTEGER NOT NULL,
    cost_impact_percent REAL,
    schedule_impact TEXT,
    mitigation_action TEXT,
    owner TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_revision_id) REFERENCES project_revisions(id)
);

CREATE TABLE missing_data_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_revision_id INTEGER NOT NULL,
    boq_item_id INTEGER,
    field_name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    message TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY(project_revision_id) REFERENCES project_revisions(id),
    FOREIGN KEY(boq_item_id) REFERENCES boq_items(id)
);

CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    changed_by INTEGER NOT NULL,
    reason TEXT,
    old_values_json TEXT,
    new_values_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(changed_by) REFERENCES users(id)
);
