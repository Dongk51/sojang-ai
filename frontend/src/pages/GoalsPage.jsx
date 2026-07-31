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

function toDateInputValue(dateStr) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

const INITIAL_FORM = { title: '', target_amount: '', target_date: '' };

export default function GoalsPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);

  const [depositAmounts, setDepositAmounts] = useState({});

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

  async function handleCreate(e) {
    e.preventDefault();
    setError('');

    const target_amount = parseFloat(form.target_amount);
    if (!form.title.trim() || isNaN(target_amount) || target_amount <= 0 || !form.target_date) {
      setError('목표명, 목표 금액, 목표 기한을 올바르게 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      await goalsApi.create(
        { title: form.title.trim(), target_amount, target_date: new Date(form.target_date).toISOString() },
        token,
      );
      setForm(INITIAL_FORM);
      await loadGoals();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(goal) {
    setEditingId(goal.id);
    setEditForm({
      title: goal.title,
      target_amount: String(goal.target_amount),
      target_date: toDateInputValue(goal.target_date),
    });
  }

  async function handleUpdate(e, goalId) {
    e.preventDefault();
    setError('');
    try {
      await goalsApi.update(
        goalId,
        {
          title: editForm.title.trim(),
          target_amount: parseFloat(editForm.target_amount),
          target_date: new Date(editForm.target_date).toISOString(),
        },
        token,
      );
      setEditingId(null);
      await loadGoals();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeposit(goalId) {
    const amount = parseFloat(depositAmounts[goalId]);
    if (isNaN(amount) || amount <= 0) return;
    setError('');
    try {
      await goalsApi.deposit(goalId, amount, token);
      setDepositAmounts((prev) => ({ ...prev, [goalId]: '' }));
      await loadGoals();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(goalId) {
    setError('');
    try {
      await goalsApi.remove(goalId, token);
      await loadGoals();
    } catch (err) {
      setError(err.message);
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
          <h1 className="text-lg font-bold text-indigo-600">목적자금 관리</h1>
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
          <h2 className="text-base font-semibold text-gray-800 mb-5">새 목표 만들기</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">목표명</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="예: 내집마련 종잣돈"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">목표 금액</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.target_amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, target_amount: e.target.value.replace(/[^0-9.]/g, '') }))
                }
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">목표 기한</label>
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm((prev) => ({ ...prev, target_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              목표 추가하기
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {goals.map((goal) => {
            const progressPercent = Math.min(Math.round(goal.progress_rate * 100), 100);
            return (
              <div key={goal.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {editingId === goal.id ? (
                  <form onSubmit={(e) => handleUpdate(e, goal.id)} className="space-y-3">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editForm.target_amount}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, target_amount: e.target.value.replace(/[^0-9.]/g, '') }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-right"
                    />
                    <input
                      type="date"
                      value={editForm.target_date}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, target_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium">
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-2 text-sm font-medium"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">{goal.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">목표일 {formatDate(goal.target_date)}</p>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <button onClick={() => startEdit(goal)} className="hover:text-indigo-600 transition">수정</button>
                        <button onClick={() => handleDelete(goal.id)} className="hover:text-red-500 transition">삭제</button>
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                      <div
                        className="bg-indigo-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                      <span>{formatKRW(goal.current_amount)} / {formatKRW(goal.target_amount)}</span>
                      <span className="font-medium text-indigo-600">{progressPercent}%</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      목표 달성을 위해 월 {formatKRW(goal.required_monthly_saving)}씩 저축이 필요해요.
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={depositAmounts[goal.id] || ''}
                        onChange={(e) =>
                          setDepositAmounts((prev) => ({ ...prev, [goal.id]: e.target.value.replace(/[^0-9.]/g, '') }))
                        }
                        placeholder="입금액"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right"
                      />
                      <button
                        onClick={() => handleDeposit(goal.id)}
                        className="bg-indigo-50 text-indigo-600 font-medium px-4 py-2 rounded-lg text-sm hover:bg-indigo-100 transition"
                      >
                        입금 추가
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {goals.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">아직 등록된 목표가 없어요. 첫 목표를 만들어보세요.</p>
          )}
        </div>
      </main>
    </div>
  );
}
