from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, UTC
from decimal import Decimal
from typing import Any

from sqlalchemy import text

from app.db.session import engine
from app.schemas.pricing import ItemPricingInput
from app.services.pricing_engine import PricingEngine


class PricingTransactionService:
    """Persist pricing transactions and return computed results."""

    @staticmethod
    def _now() -> str:
        return datetime.now(UTC).isoformat()

    @staticmethod
    def init_db() -> None:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS pricing_transactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        reference_no TEXT NOT NULL UNIQUE,
                        customer_name TEXT,
                        item_description TEXT,
                        quantity REAL NOT NULL,
                        unit_price REAL NOT NULL,
                        final_price REAL NOT NULL,
                        payload_json TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    )
                    """
                )
            )

    @staticmethod
    def _round(value: float) -> float:
        return float(Decimal(str(value)).quantize(Decimal('0.01')))

    @classmethod
    def create_transaction(
        cls,
        reference_no: str,
        customer_name: str,
        item_description: str,
        data: ItemPricingInput,
    ) -> dict[str, Any]:
        result = PricingEngine.compute(data)
        payload = asdict(result)
        unit_price = result.final_price / data.quantity if data.quantity else 0

        now = cls._now()
        cls.init_db()
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO pricing_transactions
                        (reference_no, customer_name, item_description, quantity, unit_price, final_price, payload_json, created_at)
                    VALUES
                        (:reference_no, :customer_name, :item_description, :quantity, :unit_price, :final_price, :payload_json, :created_at)
                    """
                ),
                {
                    'reference_no': reference_no,
                    'customer_name': customer_name,
                    'item_description': item_description,
                    'quantity': data.quantity,
                    'unit_price': cls._round(unit_price),
                    'final_price': cls._round(result.final_price),
                    'payload_json': str(payload),
                    'created_at': now,
                },
            )

        return {
            'reference_no': reference_no,
            'customer_name': customer_name,
            'item_description': item_description,
            'quantity': cls._round(data.quantity),
            'unit_price': cls._round(unit_price),
            'final_price': cls._round(result.final_price),
            'created_at': now,
        }

    @classmethod
    def list_transactions(cls) -> list[dict[str, Any]]:
        cls.init_db()
        with engine.begin() as conn:
            rows = conn.execute(
                text(
                    """
                    SELECT reference_no, customer_name, item_description, quantity, unit_price, final_price, created_at
                    FROM pricing_transactions
                    ORDER BY id DESC
                    """
                )
            ).mappings()
            return [dict(row) for row in rows]
