import sys

from PySide6.QtWidgets import (
    QApplication,
    QFormLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from app.schemas.pricing import ItemPricingInput
from app.services.transaction_service import PricingTransactionService


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle('PETROCAF Pricing Engine v1.0')
        self.resize(1200, 800)

        self.inputs: dict[str, QLineEdit] = {}
        self.table = QTableWidget(0, 7)
        self.table.setHorizontalHeaderLabels([
            'Ref', 'Customer', 'Description', 'Qty', 'Unit Price', 'Final Price', 'Date',
        ])

        root = QWidget()
        main_layout = QVBoxLayout(root)

        form = QFormLayout()
        fields = [
            ('reference_no', 'Reference No', 'PR-001'),
            ('customer_name', 'Customer Name', 'Saudi Aramco'),
            ('item_description', 'Item Description', 'Cable Laying'),
            ('quantity', 'Quantity', '100'),
            ('manhour_norm', 'Manhour Norm', '2.5'),
            ('labor_rate', 'Labor Rate', '35'),
            ('productivity_factor', 'Productivity Factor', '1'),
            ('labor_market_factor', 'Labor Market Factor', '1'),
            ('productivity_per_day', 'Productivity/Day', '25'),
            ('crew_daily_cost', 'Crew Daily Cost', '700'),
            ('equipment_hours_or_days', 'Equipment Hrs/Days', '8'),
            ('equipment_rate', 'Equipment Rate', '45'),
            ('equipment_market_factor', 'Equipment Market Factor', '1'),
            ('material_unit_rate', 'Material Unit Rate', '12'),
            ('material_waste_factor', 'Material Waste Factor', '1.05'),
            ('material_market_factor', 'Material Market Factor', '1'),
            ('consumables_cost', 'Consumables Cost', '50'),
            ('subcontractor_cost', 'Subcontractor Cost', '0'),
            ('calibration_combined_factor', 'Calibration Factor', '1'),
            ('indirect_cost', 'Indirect Cost', '100'),
            ('contingency_pct', 'Contingency % (0.1=10%)', '0.1'),
            ('overhead_pct', 'Overhead %', '0.1'),
            ('profit_pct', 'Profit %', '0.15'),
        ]

        for key, label, default in fields:
            entry = QLineEdit(default)
            self.inputs[key] = entry
            form.addRow(QLabel(label), entry)

        buttons = QHBoxLayout()
        calc_button = QPushButton('Compute + Save Transaction')
        calc_button.clicked.connect(self.compute_and_save)
        refresh_button = QPushButton('Refresh Transactions')
        refresh_button.clicked.connect(self.load_transactions)
        buttons.addWidget(calc_button)
        buttons.addWidget(refresh_button)

        main_layout.addLayout(form)
        main_layout.addLayout(buttons)
        main_layout.addWidget(self.table)

        self.setCentralWidget(root)
        self.load_transactions()

    def compute_and_save(self) -> None:
        try:
            payload = ItemPricingInput(
                quantity=float(self.inputs['quantity'].text()),
                manhour_norm=float(self.inputs['manhour_norm'].text()),
                labor_rate=float(self.inputs['labor_rate'].text()),
                productivity_factor=float(self.inputs['productivity_factor'].text()),
                labor_market_factor=float(self.inputs['labor_market_factor'].text()),
                productivity_per_day=float(self.inputs['productivity_per_day'].text()),
                crew_daily_cost=float(self.inputs['crew_daily_cost'].text()),
                equipment_hours_or_days=float(self.inputs['equipment_hours_or_days'].text()),
                equipment_rate=float(self.inputs['equipment_rate'].text()),
                equipment_market_factor=float(self.inputs['equipment_market_factor'].text()),
                material_unit_rate=float(self.inputs['material_unit_rate'].text()),
                material_waste_factor=float(self.inputs['material_waste_factor'].text()),
                material_market_factor=float(self.inputs['material_market_factor'].text()),
                consumables_cost=float(self.inputs['consumables_cost'].text()),
                subcontractor_cost=float(self.inputs['subcontractor_cost'].text()),
                calibration_combined_factor=float(self.inputs['calibration_combined_factor'].text()),
                indirect_cost=float(self.inputs['indirect_cost'].text()),
                contingency_pct=float(self.inputs['contingency_pct'].text()),
                overhead_pct=float(self.inputs['overhead_pct'].text()),
                profit_pct=float(self.inputs['profit_pct'].text()),
            )

            saved = PricingTransactionService.create_transaction(
                reference_no=self.inputs['reference_no'].text().strip(),
                customer_name=self.inputs['customer_name'].text().strip(),
                item_description=self.inputs['item_description'].text().strip(),
                data=payload,
            )
            QMessageBox.information(
                self,
                'Saved',
                f"Saved transaction {saved['reference_no']}\nFinal Price: {saved['final_price']}",
            )
            self.load_transactions()
        except Exception as exc:
            QMessageBox.critical(self, 'Error', str(exc))

    def load_transactions(self) -> None:
        rows = PricingTransactionService.list_transactions()
        self.table.setRowCount(len(rows))
        for row_index, row in enumerate(rows):
            values = [
                row['reference_no'],
                row['customer_name'] or '',
                row['item_description'] or '',
                str(row['quantity']),
                str(row['unit_price']),
                str(row['final_price']),
                row['created_at'],
            ]
            for col, value in enumerate(values):
                self.table.setItem(row_index, col, QTableWidgetItem(value))


def launch_app() -> None:
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    app.exec()
