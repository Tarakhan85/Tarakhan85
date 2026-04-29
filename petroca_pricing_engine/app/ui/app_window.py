import sys
from PySide6.QtWidgets import QApplication, QLabel, QMainWindow


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle('PETROCAF Pricing Engine v0.1')
        self.resize(1024, 720)
        self.setCentralWidget(QLabel('MVP shell ready: Projects / BOQ / Pricing / Dashboard'))


def launch_app() -> None:
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    app.exec()
