from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import OrderMemo
from schemas import OrderMemoCreate, OrderMemoUpdate, OrderMemoResponse
from auth_utils import get_current_user_id

router = APIRouter(prefix="/orders", tags=["발주 메모"])


@router.post("/memo", response_model=OrderMemoResponse, status_code=status.HTTP_201_CREATED)
def create_memo(
    body: OrderMemoCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    memo = OrderMemo(user_id=user_id, **body.model_dump())
    db.add(memo)
    db.commit()
    db.refresh(memo)
    return memo


@router.get("/memo", response_model=list[OrderMemoResponse])
def list_memos(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return (
        db.query(OrderMemo)
        .filter(OrderMemo.user_id == user_id)
        .order_by(OrderMemo.alert_datetime.asc())
        .all()
    )


@router.put("/memo/{memo_id}", response_model=OrderMemoResponse)
def update_memo(
    memo_id: int,
    body: OrderMemoUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    memo = (
        db.query(OrderMemo)
        .filter(OrderMemo.id == memo_id, OrderMemo.user_id == user_id)
        .first()
    )
    if not memo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="메모를 찾을 수 없습니다.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(memo, field, value)
    db.commit()
    db.refresh(memo)
    return memo


@router.delete("/memo/{memo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memo(
    memo_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    memo = (
        db.query(OrderMemo)
        .filter(OrderMemo.id == memo_id, OrderMemo.user_id == user_id)
        .first()
    )
    if not memo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="메모를 찾을 수 없습니다.")
    db.delete(memo)
    db.commit()
