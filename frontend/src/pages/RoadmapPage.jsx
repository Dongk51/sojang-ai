import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { goalsApi } from '../services/api';

function formatKRW(value) {
  if (value === null || value === undefined || value === '') return '-';
  return Math.round(Number(value)).toLocaleString('ko-KR') + '원';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function dDay(dateStr) {
  const diffMs = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return '기한 지남';
  if (days === 0) return 'D-day';
  return `D-${days}`;
}

export default function RoadmapPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [error, setError] = useState('');

  const loadGoals = useCallback(async () => {
    try {
      const data = await goalsApi.list(token);
      setGoals(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
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
          <h1 className="text-lg font-bold text-indigo-600">나만의 로드맵</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          로그아웃
        </button>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 mb-4">{error}</p>
        )}

        {goals.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">
            등록된 목표가 없어요. 목적자금 관리에서 목표를 먼저 만들어보세요.
          </p>
        ) : (
          <ol className="relative border-l-2 border-indigo-100 ml-3 space-y-8">
            {goals.map((goal) => {
              const progressPercent = Math.min(Math.round(goal.progress_rate * 100), 100);
              return (
                <li key={goal.id} className="ml-6">
                  <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-indigo-500 border-4 border-gray-50" />
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-800">{goal.title}</p>
                      <span className="text-xs font-medium text-indigo-600 whitespace-nowrap ml-2">{dDay(goal.target_date)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">목표일 {formatDate(goal.target_date)}</p>

                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatKRW(goal.current_amount)} / {formatKRW(goal.target_amount)}</span>
                      <span>{progressPercent}%</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}
