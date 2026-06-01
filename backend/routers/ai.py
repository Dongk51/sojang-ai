from fastapi import APIRouter
from pydantic import BaseModel
import os

router = APIRouter(prefix="/ai", tags=["ai"])


class AnalyzeRequest(BaseModel):
    revenue: float
    purchase: float
    business_type: str
    period: int


class AnalyzeResponse(BaseModel):
    analysis: str


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "your-api-key-here":
        return AnalyzeResponse(analysis="OpenAI API 키를 설정해주세요. backend/.env 파일에 OPENAI_API_KEY를 입력하세요.")

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        profit = req.revenue - req.purchase
        profit_rate = (profit / req.revenue * 100) if req.revenue > 0 else 0

        prompt = f"""다음은 소상공인의 {req.period}개월 매출 데이터입니다.

업종: {req.business_type}
분석 기간: {req.period}개월
매출액: {req.revenue:,.0f}원
매입액: {req.purchase:,.0f}원
순이익: {profit:,.0f}원
수익률: {profit_rate:.1f}%

위 데이터를 바탕으로 다음 내용을 포함한 분석을 한국어로 작성해주세요:
1. 현재 수익 구조 평가 (2-3문장)
2. 업종 특성을 고려한 개선 제안 (2-3가지)
3. 주의해야 할 위험 요소 (1-2가지)

친절하고 실용적인 조언 형식으로 작성해주세요."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "당신은 소상공인의 경영을 돕는 전문 경영 컨설턴트입니다."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=800,
            temperature=0.7,
        )

        analysis_text = response.choices[0].message.content.strip()
        return AnalyzeResponse(analysis=analysis_text)

    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            return AnalyzeResponse(analysis="API 키가 유효하지 않습니다. OPENAI_API_KEY를 확인해주세요.")
        if "quota" in error_msg.lower() or "rate" in error_msg.lower():
            return AnalyzeResponse(analysis="API 사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.")
        return AnalyzeResponse(analysis=f"분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
