from pydantic import BaseModel, Field


class ItemPricingInput(BaseModel):
    quantity: float = Field(ge=0)
    manhour_norm: float = Field(default=0, ge=0)
    labor_rate: float = Field(default=0, ge=0)
    productivity_factor: float = Field(default=1, gt=0)
    labor_market_factor: float = Field(default=1, gt=0)
    productivity_per_day: float = Field(default=0, ge=0)
    crew_daily_cost: float = Field(default=0, ge=0)

    equipment_hours_or_days: float = Field(default=0, ge=0)
    equipment_rate: float = Field(default=0, ge=0)
    equipment_market_factor: float = Field(default=1, gt=0)

    material_unit_rate: float = Field(default=0, ge=0)
    material_waste_factor: float = Field(default=1, gt=0)
    material_market_factor: float = Field(default=1, gt=0)

    consumables_cost: float = Field(default=0, ge=0)
    subcontractor_cost: float = Field(default=0, ge=0)

    calibration_combined_factor: float = Field(default=1, gt=0)
    indirect_cost: float = Field(default=0, ge=0)
    contingency_pct: float = Field(default=0, ge=0)
    overhead_pct: float = Field(default=0, ge=0)
    profit_pct: float = Field(default=0, ge=0)
