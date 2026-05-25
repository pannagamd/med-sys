from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.seed import seed_admin, seed_symptom_rules
from app.models.symptom import SymptomRule
from app.models.user import User


def test_seed_admin_is_idempotent(db: Session) -> None:
    first = seed_admin(db)
    db.commit()
    second = seed_admin(db)
    db.commit()

    users = list(db.scalars(select(User)).all())
    assert first.id == second.id
    assert len(users) == 1
    assert users[0].is_admin is True
    assert users[0].phone_number


def test_seed_symptom_rules_is_idempotent(db: Session) -> None:
    first_count = seed_symptom_rules(db)
    db.commit()
    second_count = seed_symptom_rules(db)
    db.commit()

    rules = list(db.scalars(select(SymptomRule)).all())
    assert first_count == 3
    assert second_count == 0
    assert len(rules) == 3
