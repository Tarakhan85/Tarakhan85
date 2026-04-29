from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str = 'PETROCAF Pricing Engine'
    db_path: Path = Path('petrocaf_pricing.db')


settings = Settings()
