"""Character profile engine for narrative, simulation, and dialogue tooling.

This module defines a production-ready, typed character model with:
- Input validation
- Domain-safe state transitions
- Structured export for API or storage layers

Windows-compatible. No external dependencies.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Dict, List, Optional


class RelationshipState(str, Enum):
    """High-level relationship stage for scenario logic."""

    STABLE = "stable"
    DISTANT = "distant"
    FRACTURED = "fractured"
    DISCOVERED = "discovered"


@dataclass
class CharacterIdentity:
    name: str
    age: int
    marital_status: str
    spouse_profession: str

    def validate(self) -> None:
        if not self.name.strip():
            raise ValueError("name must not be empty")
        if not (18 <= self.age <= 100):
            raise ValueError("age must be between 18 and 100")
        if not self.marital_status.strip():
            raise ValueError("marital_status must not be empty")
        if not self.spouse_profession.strip():
            raise ValueError("spouse_profession must not be empty")


@dataclass
class CharacterPsychology:
    public_traits: List[str] = field(default_factory=list)
    hidden_traits: List[str] = field(default_factory=list)
    motivations: List[str] = field(default_factory=list)
    internal_conflicts: List[str] = field(default_factory=list)

    def validate(self) -> None:
        for field_name, values in (
            ("public_traits", self.public_traits),
            ("hidden_traits", self.hidden_traits),
            ("motivations", self.motivations),
            ("internal_conflicts", self.internal_conflicts),
        ):
            if any(not item.strip() for item in values):
                raise ValueError(f"{field_name} contains empty values")


@dataclass
class CharacterSecrets:
    confidential_items: List[str] = field(default_factory=list)
    trust_risk_score: int = 1  # 1(low) to 5(high)

    def validate(self) -> None:
        if not (1 <= self.trust_risk_score <= 5):
            raise ValueError("trust_risk_score must be between 1 and 5")
        if any(not item.strip() for item in self.confidential_items):
            raise ValueError("confidential_items contains empty values")


@dataclass
class NarrativeCharacter:
    identity: CharacterIdentity
    psychology: CharacterPsychology
    secrets: CharacterSecrets
    relationship_state: RelationshipState = RelationshipState.STABLE
    timeline_notes: List[str] = field(default_factory=list)

    def validate(self) -> None:
        self.identity.validate()
        self.psychology.validate()
        self.secrets.validate()
        if any(not note.strip() for note in self.timeline_notes):
            raise ValueError("timeline_notes contains empty values")

    def add_timeline_event(self, event_note: str) -> None:
        event_note = event_note.strip()
        if not event_note:
            raise ValueError("event_note must not be empty")
        self.timeline_notes.append(event_note)

    def transition_state(self, next_state: RelationshipState, reason: str) -> None:
        """Transition relationship state with guard rails.

        Allowed transitions:
        stable -> distant -> fractured -> discovered
        """
        allowed_transitions: Dict[RelationshipState, List[RelationshipState]] = {
            RelationshipState.STABLE: [RelationshipState.DISTANT],
            RelationshipState.DISTANT: [RelationshipState.FRACTURED],
            RelationshipState.FRACTURED: [RelationshipState.DISCOVERED],
            RelationshipState.DISCOVERED: [],
        }

        if next_state not in allowed_transitions[self.relationship_state]:
            raise ValueError(
                f"Invalid transition: {self.relationship_state.value} -> {next_state.value}"
            )

        if not reason.strip():
            raise ValueError("reason must not be empty")

        self.relationship_state = next_state
        self.add_timeline_event(f"State changed to '{next_state.value}': {reason.strip()}")

    def to_dict(self) -> Dict:
        self.validate()
        payload = asdict(self)
        payload["relationship_state"] = self.relationship_state.value
        return payload


def build_default_character() -> NarrativeCharacter:
    """Factory for a ready-to-use character profile."""
    character = NarrativeCharacter(
        identity=CharacterIdentity(
            name="Layla",
            age=34,
            marital_status="Married",
            spouse_profession="Ship Captain",
        ),
        psychology=CharacterPsychology(
            public_traits=["Calm", "Disciplined", "Socially polished"],
            hidden_traits=["Emotionally conflicted", "Secretive under stress"],
            motivations=[
                "Fear of abandonment",
                "Need for emotional validation",
                "Concern about social image",
            ],
            internal_conflicts=[
                "Loyalty versus autonomy",
                "Guilt versus immediate comfort",
            ],
        ),
        secrets=CharacterSecrets(
            confidential_items=[
                "Maintains covert communication with third party",
                "Conceals selected personal transactions",
            ],
            trust_risk_score=4,
        ),
    )

    character.add_timeline_event("Marriage strain increased due to long sea deployments")
    character.transition_state(RelationshipState.DISTANT, "Communication frequency declined")
    character.transition_state(RelationshipState.FRACTURED, "Escalating unresolved conflicts")
    return character


if __name__ == "__main__":
    profile = build_default_character()
    print(profile.to_dict())
