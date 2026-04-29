from dataclasses import dataclass


DISCIPLINE_KEYWORDS = {
    'Mechanical': ['pump', 'compressor', 'mechanical'],
    'Piping': ['pipe', 'weld', 'fitting'],
    'Civil': ['concrete', 'excavation', 'foundation'],
    'Electrical': ['cable', 'panel', 'electrical'],
    'Instrumentation': ['instrument', 'transmitter', 'dcs'],
    'Hydrotest': ['hydrotest', 'pressure test'],
    'Steel Structure': ['steel', 'structure'],
    'Painting / Coating': ['painting', 'coating', 'blasting'],
    'Insulation': ['insulation', 'cladding'],
    'Scaffolding': ['scaffold', 'scaffolding'],
}


@dataclass
class ClassificationResult:
    discipline: str
    status: str


class ClassificationService:
    @staticmethod
    def classify(description: str) -> ClassificationResult:
        text = description.lower().strip()
        for discipline, keywords in DISCIPLINE_KEYWORDS.items():
            if any(k in text for k in keywords):
                return ClassificationResult(discipline=discipline, status='AUTO_CLASSIFIED')
        return ClassificationResult(discipline='General / Indirect', status='MANUAL_REVIEW_REQUIRED')
