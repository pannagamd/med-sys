from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.symptom import SymptomRule
from app.models.user import User

DEFAULT_SYMPTOM_RULES = [
    {
        "name": "Common Cold",
        "symptom_keywords": "cough;runny nose;sneezing;sore throat",
        "possible_condition": "Common cold or upper respiratory infection",
        "care_recommendations": "Rest;Drink fluids;Use steam inhalation if comfortable",
        "common_medicines": "Paracetamol",
        "precautions": "Avoid antibiotics unless prescribed;Seek care if symptoms worsen",
        "escalation_triggers": "breathing difficulty;chest pain;high fever",
        "is_emergency": False,
    },
    {
        "name": "Fever",
        "symptom_keywords": "fever;chills;body ache",
        "possible_condition": "Fever from infection or inflammation",
        "care_recommendations": "Hydrate;Rest;Monitor temperature",
        "common_medicines": "Paracetamol",
        "precautions": "Avoid overdose;Consult a clinician for persistent or very high fever",
        "escalation_triggers": "very high fever;confusion;seizure;breathing difficulty",
        "is_emergency": False,
    },
    {
        "name": "Emergency Chest Pain",
        "symptom_keywords": "chest pain;pressure in chest;shortness of breath",
        "possible_condition": "Possible cardiac or respiratory emergency",
        "care_recommendations": "Seek urgent medical care immediately",
        "common_medicines": None,
        "precautions": "Do not delay emergency evaluation",
        "escalation_triggers": "chest pain;shortness of breath;fainting",
        "is_emergency": True,
    },
]


def seed_admin(db: Session) -> User:
    user = db.scalar(select(User).where(User.phone_number == settings.seed_admin_phone))
    if user:
        if not user.is_admin:
            user.is_admin = True
        if not user.hashed_password:
            user.hashed_password = hash_password(settings.seed_admin_password)
        return user

    user = User(
        phone_number=settings.seed_admin_phone,
        full_name=settings.seed_admin_full_name,
        is_admin=True,
        hashed_password=hash_password(settings.seed_admin_password),
    )
    db.add(user)
    return user


def seed_symptom_rules(db: Session) -> int:
    created = 0
    for rule_data in DEFAULT_SYMPTOM_RULES:
        existing = db.scalar(select(SymptomRule).where(SymptomRule.name == rule_data["name"]))
        if existing:
            continue
        db.add(SymptomRule(**rule_data))
        created += 1
    return created


def run_seed() -> None:
    with SessionLocal() as db:
        seed_admin(db)
        created_rules = seed_symptom_rules(db)
        db.commit()
        print(
            "Seed complete: admin_phone='{}', symptom_rules_created={}".format(
                settings.seed_admin_phone,
                created_rules,
            )
        )


if __name__ == "__main__":
    run_seed()
