from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import VatCalculation
from schemas import VatCalculationRequest, VatCalculationResponse
from auth_utils import get_current_user_id

router = APIRouter(prefix="/tax", tags=["세금 계산"])


@router.post("/vat", response_model=VatCalculationResponse, status_code=status.HTTP_201_CREATED)
def calculate_vat(
    body: VatCalculationRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if body.revenue < 0 or body.purchase < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="매출액과 매입액은 0 이상이어야 합니다.",
        )
    vat_amount = (body.revenue - body.purchase) * 0.1
    record = VatCalculation(
        user_id=user_id,
        revenue=body.revenue,
        purchase=body.purchase,
        vat_amount=vat_amount,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/vat/history", response_model=list[VatCalculationResponse])
def get_vat_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return (
        db.query(VatCalculation)
        .filter(VatCalculation.user_id == user_id)
        .order_by(VatCalculation.created_at.desc())
        .limit(10)
        .all()
    )
