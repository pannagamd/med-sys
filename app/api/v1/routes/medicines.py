from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.medicine import MedicineRead, MedicineSearchResponse
from app.services.medicine_service import MedicineService

router = APIRouter()


@router.get("/search", response_model=MedicineSearchResponse)
def search_medicines(
    q: str = Query(min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> MedicineSearchResponse:
    total, items = MedicineService(db).search(q, limit=limit, offset=offset)
    return MedicineSearchResponse(total=total, items=items)


@router.get("/{medicine_id}", response_model=MedicineRead)
def get_medicine(
    medicine_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> MedicineRead:
    medicine = MedicineService(db).get(medicine_id)
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")
    return medicine

