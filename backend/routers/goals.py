from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import SavingsGoal
from schemas import SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalDeposit, SavingsGoalResponse
from auth_utils import get_current_user_id

router = APIRouter(prefix="/goals", tags=["목적자금 관리"])


def _to_response(goal: SavingsGoal) -> SavingsGoalResponse:
    remaining_amount = max(goal.target_amount - goal.current_amount, 0)
    months_remaining = max((goal.target_date - datetime.now()).days / 30.44, 1)
    required_monthly_saving = remaining_amount / months_remaining if remaining_amount > 0 else 0

    return SavingsGoalResponse(
        id=goal.id,
        title=goal.title,
        target_amount=goal.target_amount,
        target_date=goal.target_date,
        current_amount=goal.current_amount,
        created_at=goal.created_at,
        progress_rate=goal.current_amount / goal.target_amount if goal.target_amount > 0 else 0,
        required_monthly_saving=required_monthly_saving,
    )


@router.post("", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    body: SavingsGoalCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if body.target_amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="목표 금액은 0보다 커야 합니다.")
    goal = SavingsGoal(user_id=user_id, **body.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_response(goal)


@router.get("", response_model=list[SavingsGoalResponse])
def list_goals(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == user_id)
        .order_by(SavingsGoal.target_date.asc())
        .all()
    )
    return [_to_response(g) for g in goals]


def _get_owned_goal(db: Session, goal_id: int, user_id: int) -> SavingsGoal:
    goal = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="목표를 찾을 수 없습니다.")
    return goal


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_goal(
    goal_id: int,
    body: SavingsGoalUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    goal = _get_owned_goal(db, goal_id, user_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return _to_response(goal)


@router.post("/{goal_id}/deposit", response_model=SavingsGoalResponse)
def deposit_to_goal(
    goal_id: int,
    body: SavingsGoalDeposit,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if body.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="입금액은 0보다 커야 합니다.")
    goal = _get_owned_goal(db, goal_id, user_id)
    goal.current_amount += body.amount
    db.commit()
    db.refresh(goal)
    return _to_response(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    goal = _get_owned_goal(db, goal_id, user_id)
    db.delete(goal)
    db.commit()
