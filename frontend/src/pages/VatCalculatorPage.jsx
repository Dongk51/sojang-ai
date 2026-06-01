import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taxApi } from '../services/api';

function formatKRW(value) {
  if (value === null || value === undefined || value === '') return '-';
  return Number(value).toLocaleString('ko-KR') + '원';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function VatCalculatorPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [revenue, setRevenue] = useState('');
  const [purchase, setPurchase] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      const data = await taxApi.getVatHistory(token);
      setHistory(data);
    } catch {
      // 히스토리 로드 실패는 조용히 처리
    }
  }, [token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const rev = parseFloat(revenue.replace(/,/g, ''));
    const pur = parseFloat(purchase.replace(/,/g, ''));

    if (isNaN(rev) || isNaN(pur)) {
      setError('매출액과 매입액을 올바르게 입력해 주세요.');
      return;
    }
    if (rev < 0 || pur < 0) {
      setError('매출액과 매입액은 0 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const data = await taxApi.calculateVat({ revenue: rev, purchase: pur }, token);
      setResult(data);
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleNumberInput(setter) {
    return (e) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      setter(raw === '' ? '' : Number(raw).toLocaleString('ko-KR'));
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-indigo-600 transition"
            aria-label="대시보드로 돌아가기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-indigo-600">부가세 계산기</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          로그아웃
        </button>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 계산 폼 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">매출·매입 입력</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매출액 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={revenue}
                  onChange={handleNumberInput(setRevenue)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-right text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매입액 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={purchase}
                  onChange={handleNumberInput(setPurchase)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-right text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '계산 중...' : '부가세 계산하기'}
            </button>
          </form>
        </div>

        {/* 계산 결과 */}
        {result && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-indigo-800 mb-4">계산 결과</h2>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">매출액</span>
              <span className="font-medium text-gray-800">{formatKRW(result.revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">매입액</span>
              <span className="font-medium text-gray-800">{formatKRW(result.purchase)}</span>
            </div>
            <div className="border-t border-indigo-200 pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-indigo-700">납부할 부가세</span>
              <span className="text-xl font-bold text-indigo-700">{formatKRW(result.vat_amount)}</span>
            </div>
          </div>
        )}

        {/* 최근 계산 내역 */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">최근 계산 내역</h2>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      매출 {formatKRW(item.revenue)} · 매입 {formatKRW(item.purchase)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600 whitespace-nowrap ml-4">
                    {formatKRW(item.vat_amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 면책 문구 */}
        <p className="text-xs text-gray-400 text-center leading-relaxed px-2">
          본 계산기는 참고용이며 정확한 세무는 전문가 상담을 권장합니다.
        </p>
      </main>
    </div>
  );
}
