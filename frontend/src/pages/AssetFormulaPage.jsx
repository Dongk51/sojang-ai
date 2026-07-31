import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formulaApi } from '../services/api';

function formatKRW(value) {
  if (value === null || value === undefined || value === '') return '-';
  return Math.round(Number(value)).toLocaleString('ko-KR') + '원';
}

const RESULT_ROWS = [
  { key: 'recommended_saving', label: '저축·투자' },
  { key: 'recommended_fixed_expense', label: '고정지출' },
  { key: 'recommended_free_spending', label: '자유소비' },
];

export default function AssetFormulaPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpense, setMonthlyExpense] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handleNumberChange(setter) {
    return (e) => setter(e.target.value.replace(/[^0-9.]/g, ''));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const income = parseFloat(monthlyIncome);
    if (isNaN(income) || income <= 0) {
      setError('월수입을 올바르게 입력해 주세요.');
      return;
    }
    const expense = monthlyExpense === '' ? undefined : parseFloat(monthlyExpense);

    setLoading(true);
    try {
      const data = await formulaApi.calculate(
        { monthly_income: income, monthly_expense: expense },
        token,
      );
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
          <h1 className="text-lg font-bold text-indigo-600">자산형성 공식</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          로그아웃
        </button>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">월 소득 입력</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                월수입 <span className="text-red-400 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={monthlyIncome}
                  onChange={handleNumberChange(setMonthlyIncome)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-right text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                월지출 <span className="text-xs text-gray-400 font-normal">(선택, 미입력 시 자동 추정)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={monthlyExpense}
                  onChange={handleNumberChange(setMonthlyExpense)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-right text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
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
              {loading ? '계산 중...' : '추천 배분 계산하기'}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-indigo-800 mb-4">추천 배분</h2>
            {RESULT_ROWS.map((row) => (
              <div key={row.key} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className="font-medium text-gray-800">{formatKRW(result[row.key])}</span>
              </div>
            ))}
            <div className="border-t border-indigo-200 pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-indigo-700">비상자금 목표</span>
              <span className="text-xl font-bold text-indigo-700">{formatKRW(result.emergency_fund_target)}</span>
            </div>
            <p className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 leading-relaxed">
              {result.message}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
