import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { salaryApi } from '../services/api';

function formatKRW(value) {
  if (value === null || value === undefined || value === '') return '-';
  return Math.round(Number(value)).toLocaleString('ko-KR') + '원';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const INITIAL_FORM = {
  hourly_wage: '',
  daily_hours: '',
  work_days: '',
  overtime_hours: '',
  night_hours: '',
  holiday_hours: '',
};

const FIELDS = [
  { key: 'hourly_wage', label: '시급', unit: '원', required: true, inputMode: 'numeric' },
  { key: 'daily_hours', label: '일일 근무시간', unit: '시간', required: true, inputMode: 'decimal' },
  { key: 'work_days', label: '월 근무일수', unit: '일', required: true, inputMode: 'numeric' },
  { key: 'overtime_hours', label: '연장근무시간 (월 합계)', unit: '시간', required: false, inputMode: 'decimal' },
  { key: 'night_hours', label: '야간근무시간 (월 합계)', unit: '시간', required: false, inputMode: 'decimal' },
  { key: 'holiday_hours', label: '휴일근무시간 (월 합계)', unit: '시간', required: false, inputMode: 'decimal' },
];

const RESULT_ROWS = [
  { key: 'base_salary', label: '기본급' },
  { key: 'weekly_holiday_pay', label: '주휴수당' },
  { key: 'overtime_pay', label: '연장수당' },
  { key: 'night_pay', label: '야간수당' },
  { key: 'holiday_pay', label: '휴일수당' },
];

export default function SalaryCalculatorPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      const data = await salaryApi.getHistory(token);
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

  function handleChange(key) {
    return (e) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      setForm((prev) => ({ ...prev, [key]: raw }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const parsed = {
      hourly_wage: parseFloat(form.hourly_wage),
      daily_hours: parseFloat(form.daily_hours),
      work_days: parseInt(form.work_days, 10),
      overtime_hours: parseFloat(form.overtime_hours) || 0,
      night_hours: parseFloat(form.night_hours) || 0,
      holiday_hours: parseFloat(form.holiday_hours) || 0,
    };

    if (isNaN(parsed.hourly_wage) || isNaN(parsed.daily_hours) || isNaN(parsed.work_days)) {
      setError('시급, 일일 근무시간, 월 근무일수를 올바르게 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const data = await salaryApi.calculate(parsed, token);
      setResult(data);
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-lg font-bold text-indigo-600">인건비 계산기</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          로그아웃
        </button>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">근무 조건 입력</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode={field.inputMode}
                    value={form[field.key]}
                    onChange={handleChange(field.key)}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-right text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    {field.unit}
                  </span>
                </div>
              </div>
            ))}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '계산 중...' : '인건비 계산하기'}
            </button>
          </form>
        </div>

        {/* 계산 결과 */}
        {result && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-indigo-800 mb-4">계산 결과</h2>
            {RESULT_ROWS.map((row) => (
              <div key={row.key} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className={`font-medium ${result[row.key] > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                  {formatKRW(result[row.key])}
                </span>
              </div>
            ))}
            {result.weekly_holiday_pay === 0 && (
              <p className="text-xs text-gray-400 bg-white rounded-lg px-3 py-2">
                주 15시간 미만 근무로 주휴수당이 적용되지 않습니다.
              </p>
            )}
            <div className="border-t border-indigo-200 pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-indigo-700">총 인건비</span>
              <span className="text-xl font-bold text-indigo-700">{formatKRW(result.total_salary)}</span>
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
                      시급 {formatKRW(item.hourly_wage)} · {item.work_days}일 근무
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600 whitespace-nowrap ml-4">
                    {formatKRW(item.total_salary)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 면책 문구 */}
        <p className="text-xs text-gray-400 text-center leading-relaxed px-2">
          본 계산기는 참고용이며 정확한 계산은 전문가 상담을 권장합니다.
        </p>
      </main>
    </div>
  );
}
