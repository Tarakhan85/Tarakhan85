from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import text

from app.db.session import engine


class TenderService:
    """Manage tender baseline, execution updates, risks, and price variance."""

    @staticmethod
    def _now() -> str:
        return datetime.now(UTC).isoformat()

    @staticmethod
    def _round(value: float) -> float:
        return float(Decimal(str(value)).quantize(Decimal('0.01')))

    @classmethod
    def init_db(cls) -> None:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS tenders (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        tender_no TEXT NOT NULL UNIQUE,
                        project_name TEXT NOT NULL,
                        baseline_price REAL NOT NULL,
                        status TEXT NOT NULL DEFAULT 'PRICING',
                        created_at TEXT NOT NULL
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS tender_execution_updates (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        tender_id INTEGER NOT NULL,
                        progress_pct REAL NOT NULL,
                        actual_cost REAL NOT NULL,
                        remaining_cost_forecast REAL NOT NULL,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY(tender_id) REFERENCES tenders(id)
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS tender_risks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        tender_id INTEGER NOT NULL,
                        risk_title TEXT NOT NULL,
                        probability INTEGER NOT NULL,
                        impact INTEGER NOT NULL,
                        mitigation TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY(tender_id) REFERENCES tenders(id)
                    )
                    """
                )
            )

    @classmethod
    def create_tender(cls, tender_no: str, project_name: str, baseline_price: float) -> dict[str, Any]:
        cls.init_db()
        now = cls._now()
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO tenders (tender_no, project_name, baseline_price, created_at)
                    VALUES (:tender_no, :project_name, :baseline_price, :created_at)
                    """
                ),
                {
                    'tender_no': tender_no,
                    'project_name': project_name,
                    'baseline_price': cls._round(baseline_price),
                    'created_at': now,
                },
            )
        return {'tender_no': tender_no, 'project_name': project_name, 'baseline_price': cls._round(baseline_price)}

    @classmethod
    def add_execution_update(
        cls,
        tender_no: str,
        progress_pct: float,
        actual_cost: float,
        remaining_cost_forecast: float,
    ) -> None:
        cls.init_db()
        now = cls._now()
        with engine.begin() as conn:
            tender = conn.execute(text('SELECT id FROM tenders WHERE tender_no = :tender_no'), {'tender_no': tender_no}).fetchone()
            if not tender:
                raise ValueError('Tender not found.')
            conn.execute(
                text(
                    """
                    INSERT INTO tender_execution_updates
                        (tender_id, progress_pct, actual_cost, remaining_cost_forecast, created_at)
                    VALUES
                        (:tender_id, :progress_pct, :actual_cost, :remaining_cost_forecast, :created_at)
                    """
                ),
                {
                    'tender_id': tender.id,
                    'progress_pct': cls._round(progress_pct),
                    'actual_cost': cls._round(actual_cost),
                    'remaining_cost_forecast': cls._round(remaining_cost_forecast),
                    'created_at': now,
                },
            )

    @classmethod
    def add_risk(cls, tender_no: str, risk_title: str, probability: int, impact: int, mitigation: str) -> None:
        cls.init_db()
        now = cls._now()
        with engine.begin() as conn:
            tender = conn.execute(text('SELECT id FROM tenders WHERE tender_no = :tender_no'), {'tender_no': tender_no}).fetchone()
            if not tender:
                raise ValueError('Tender not found.')
            conn.execute(
                text(
                    """
                    INSERT INTO tender_risks (tender_id, risk_title, probability, impact, mitigation, created_at)
                    VALUES (:tender_id, :risk_title, :probability, :impact, :mitigation, :created_at)
                    """
                ),
                {
                    'tender_id': tender.id,
                    'risk_title': risk_title,
                    'probability': probability,
                    'impact': impact,
                    'mitigation': mitigation,
                    'created_at': now,
                },
            )

    @classmethod
    def list_dashboard(cls) -> list[dict[str, Any]]:
        cls.init_db()
        with engine.begin() as conn:
            rows = conn.execute(
                text(
                    """
                    SELECT
                        t.tender_no,
                        t.project_name,
                        t.baseline_price,
                        COALESCE(u.progress_pct, 0) AS progress_pct,
                        COALESCE(u.actual_cost, 0) AS actual_cost,
                        COALESCE(u.remaining_cost_forecast, 0) AS remaining_cost_forecast,
                        COALESCE(u.actual_cost, 0) + COALESCE(u.remaining_cost_forecast, 0) AS forecast_final_cost,
                        (COALESCE(u.actual_cost, 0) + COALESCE(u.remaining_cost_forecast, 0)) - t.baseline_price AS price_variance,
                        COALESCE(r.total_risk_score, 0) AS total_risk_score
                    FROM tenders t
                    LEFT JOIN (
                        SELECT eu1.*
                        FROM tender_execution_updates eu1
                        JOIN (
                            SELECT tender_id, MAX(id) AS max_id
                            FROM tender_execution_updates
                            GROUP BY tender_id
                        ) latest ON latest.max_id = eu1.id
                    ) u ON u.tender_id = t.id
                    LEFT JOIN (
                        SELECT tender_id, SUM(probability * impact) AS total_risk_score
                        FROM tender_risks
                        GROUP BY tender_id
                    ) r ON r.tender_id = t.id
                    ORDER BY t.id DESC
                    """
                )
            ).mappings()
            return [dict(row) for row in rows]
