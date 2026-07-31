from fastapi import APIRouter, Depends, HTTPException, status
from schemas import AssetFormulaRequest, AssetFormulaResponse
from auth_utils import get_current_user_id

router = APIRouter(prefix="/formula", tags=["자산형성 공식"])

SAVING_RATIO = 0.4
FIXED_EXPENSE_RATIO = 0.4
FREE_SPENDING_RATIO = 0.2
EMERGENCY_FUND_MONTHS = 6


@router.post("/asset-plan", response_model=AssetFormulaResponse)
def calculate_asset_plan(
    body: AssetFormulaRequest,
    user_id: int = Depends(get_current_user_id),
):
    if body.monthly_income <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="월수입은 0보다 커야 합니다.")

    monthly_expense = body.monthly_expense if body.monthly_expense is not None else body.monthly_income * FIXED_EXPENSE_RATIO

    recommended_saving = body.monthly_income * SAVING_RATIO
    recommended_fixed_expense = body.monthly_income * FIXED_EXPENSE_RATIO
    recommended_free_spending = body.monthly_income * FREE_SPENDING_RATIO
    emergency_fund_target = monthly_expense * EMERGENCY_FUND_MONTHS

    message = (
        f"사회초년생 추천 배분 공식(저축·투자 {int(SAVING_RATIO * 100)}% · 고정지출 {int(FIXED_EXPENSE_RATIO * 100)}% · "
        f"자유소비 {int(FREE_SPENDING_RATIO * 100)}%)을 적용했습니다. "
        f"비상자금은 월지출의 {EMERGENCY_FUND_MONTHS}개월치를 목표로 별도 계좌에 모아두는 것을 권장합니다. "
        "본 계산기는 일반적인 참고용 가이드이며 정확한 재무 설계는 전문가 상담을 권장합니다."
    )

    return AssetFormulaResponse(
        recommended_saving=recommended_saving,
        recommended_fixed_expense=recommended_fixed_expense,
        recommended_free_spending=recommended_free_spending,
        emergency_fund_target=emergency_fund_target,
        message=message,
    )
