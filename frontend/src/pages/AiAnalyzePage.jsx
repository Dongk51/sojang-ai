import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../services/api';

const PERIOD_OPTIONS = [1, 2, 3, 6, 12];

function formatNumber(value) {
  const num = value.replace(/[^0-9]/g, '');
  return num ? Number(num).toLocaleString('ko-KR') : '';
}

function parseNumber(formatted) {
  return Number(formatted.replace(/,/g, '')) || 0;
}

export default function AiAnalyzePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [revenue, setRevenue] = useState('');
  const [purchase, setPurchase] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [period, setPeriod] = useState(1);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult('');

    const revenueNum = parseNumber(revenue);
    const purchaseNum = parseNumber(purchase);

    if (!revenueNum || !businessType.trim()) {
      setError('매출액과 업종명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const data = await aiApi.analyze(
        { revenue: revenueNum, purchase: purchaseNum, business_type: businessType.trim(), period },
        token,
      );
      setResult(data.analysis);
    } catch (err) {
      setError(err.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-gray-600 transition"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-indigo-600">수익·지출 AI 분석</h1>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">업종명</label>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="예: 카페, 치킨집, 편의점"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">매출액 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              value={revenue}
              onChange={(e) => setRevenue(formatNumber(e.target.value))}
              placeholder="예: 5,000,000"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">매입액 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              value={purchase}
              onChange={(e) => setPurchase(formatNumber(e.target.value))}
              placeholder="예: 3,000,000"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">분석 기간</label>
            <div className="flex gap-2 flex-wrap">
              {PERIOD_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPeriod(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition
                    ${period === m
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                >
                  {m}개월
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            {loading ? 'AI 분석 중...' : 'AI 분석 시작'}
          </button>
        </form>

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">AI가 매출 데이터를 분석하고 있습니다...</p>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💡</span>
              <h2 className="font-semibold text-gray-800 text-sm">AI 분석 결과</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </main>
    </div>
  );
}
