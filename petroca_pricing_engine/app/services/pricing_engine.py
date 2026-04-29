from dataclasses import dataclass

from app.schemas.pricing import ItemPricingInput


@dataclass
class PricingResult:
    labor_cost: float
    material_cost: float
    equipment_cost: float
    consumables_cost: float
    subcontractor_cost: float
    direct_cost: float
    calibrated_direct_cost: float
    subtotal: float
    contingency_cost: float
    overhead_cost: float
    profit_cost: float
    final_price: float


class PricingEngine:
    @staticmethod
    def compute_labor_cost(data: ItemPricingInput) -> float:
        norm_based = data.quantity * data.manhour_norm * data.labor_rate * data.productivity_factor * data.labor_market_factor
        if data.productivity_per_day > 0:
            productivity_based = (data.quantity / data.productivity_per_day) * data.crew_daily_cost
            return max(norm_based, productivity_based)
        return norm_based

    @staticmethod
    def compute(data: ItemPricingInput) -> PricingResult:
        labor_cost = PricingEngine.compute_labor_cost(data)
        equipment_cost = data.equipment_hours_or_days * data.equipment_rate * data.equipment_market_factor
        material_cost = data.quantity * data.material_unit_rate * data.material_waste_factor * data.material_market_factor

        direct_cost = labor_cost + material_cost + equipment_cost + data.consumables_cost + data.subcontractor_cost
        calibrated_direct_cost = direct_cost * data.calibration_combined_factor
        subtotal = calibrated_direct_cost + data.indirect_cost

        contingency_cost = subtotal * data.contingency_pct
        overhead_cost = (subtotal + contingency_cost) * data.overhead_pct
        profit_cost = (subtotal + contingency_cost + overhead_cost) * data.profit_pct
        final_price = subtotal + contingency_cost + overhead_cost + profit_cost

        return PricingResult(
            labor_cost=labor_cost,
            material_cost=material_cost,
            equipment_cost=equipment_cost,
            consumables_cost=data.consumables_cost,
            subcontractor_cost=data.subcontractor_cost,
            direct_cost=direct_cost,
            calibrated_direct_cost=calibrated_direct_cost,
            subtotal=subtotal,
            contingency_cost=contingency_cost,
            overhead_cost=overhead_cost,
            profit_cost=profit_cost,
            final_price=final_price,
        )
