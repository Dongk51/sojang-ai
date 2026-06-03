from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import SalaryCalculation
from schemas import SalaryCalculationRequest, SalaryCalculationResponse
from auth_utils import get_current_user_id

router = APIRouter(prefix="/salary", tags=["인건비 계산"])


@router.post("/calculate", response_model=SalaryCalculationResponse, status_code=status.HTTP_201_CREATED)
def calculate_salary(
    body: SalaryCalculationRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if body.hourly_wage <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="시급은 0보다 커야 합니다.",
        )
    if body.daily_hours <= 0 or body.work_days <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="근무시간과 근무일수는 0보다 커야 합니다.",
        )

    base_salary = body.hourly_wage * body.daily_hours * body.work_days

    # 주 15시간 이상 근무 시 주휴수당 발생
    weekly_hours = body.daily_hours * body.work_days / 4.345
    weekly_holiday_pay = body.hourly_wage * 8 if weekly_hours >= 15 else 0

    overtime_pay = body.overtime_hours * body.hourly_wage * 1.5
    night_pay = body.night_hours * body.hourly_wage * 0.5
    holiday_pay = body.holiday_hours * body.hourly_wage * 1.5

    total_salary = base_salary + weekly_holiday_pay + overtime_pay + night_pay + holiday_pay

    record = SalaryCalculation(
        user_id=user_id,
        hourly_wage=body.hourly_wage,
        daily_hours=body.daily_hours,
        work_days=body.work_days,
        overtime_hours=body.overtime_hours,
        night_hours=body.night_hours,
        holiday_hours=body.holiday_hours,
        base_salary=base_salary,
        weekly_holiday_pay=weekly_holiday_pay,
        overtime_pay=overtime_pay,
        night_pay=night_pay,
        holiday_pay=holiday_pay,
        total_salary=total_salary,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/history", response_model=list[SalaryCalculationResponse])
def get_salary_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return (
        db.query(SalaryCalculation)
        .filter(SalaryCalculation.user_id == user_id)
        .order_by(SalaryCalculation.created_at.desc())
        .limit(10)
        .all()
    )
