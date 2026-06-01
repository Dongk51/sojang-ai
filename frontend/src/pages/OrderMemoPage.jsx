import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../services/api';

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.error('SW 등록 실패:', e);
    }
  }
}

async function requestNotifPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return await Notification.requestPermission();
}

async function showBrowserNotification(title, body, memoId) {
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: '/favicon.svg',
        tag: `order-memo-${memoId}`,
      });
      return;
    }
  } catch {
    // SW 없으면 fallback
  }
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.svg' });
  }
}

function toLocalDatetimeValue(dtStr) {
  const dt = new Date(dtStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function formatDateTime(dtStr) {
  return new Date(dtStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isOverdue(dtStr) {
  return new Date(dtStr) < new Date();
}

// ─── 메모 카드 ─────────────────────────────────────────────────────────────────
function MemoCard({ memo, onEdit, onDelete }) {
  const overdue = isOverdue(memo.alert_datetime);

  let badge;
  if (memo.is_alerted) {
    badge = <span className="shrink-0 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">알림 완료</span>;
  } else if (overdue) {
    badge = <span className="shrink-0 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">시간 지남</span>;
  } else {
    badge = <span className="shrink-0 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">알림 예정</span>;
  }

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-4 transition
        ${memo.is_alerted ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-indigo-200 hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">📦</span>
          <p className="font-semibold text-gray-800 text-sm truncate">{memo.title}</p>
        </div>
        {badge}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-3 whitespace-pre-wrap line-clamp-3">
        {memo.content}
      </p>

      <div className="flex items-center justify-between">
        <span
          className={`flex items-center gap-1 text-xs ${
            overdue && !memo.is_alerted ? 'text-orange-500 font-medium' : 'text-gray-400'
          }`}
        >
          🕐 {formatDateTime(memo.alert_datetime)}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition"
          >
            수정
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ───────────────────────────────────────────────────────────────
export default function OrderMemoPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [notifPerm, setNotifPerm] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  // 모달
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', alert_datetime: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const timersRef = useRef([]);
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  // 알림 발송 + is_alerted 처리
  const fireNotification = useCallback(async (memo) => {
    try {
      await orderApi.update(memo.id, { is_alerted: true }, tokenRef.current);
      await showBrowserNotification(`📦 발주 알림: ${memo.title}`, memo.content, memo.id);
      setMemos((prev) => prev.map((m) => (m.id === memo.id ? { ...m, is_alerted: true } : m)));
    } catch (e) {
      console.error('알림 발송 오류:', e);
    }
  }, []);

  // setTimeout 스케줄링
  const scheduleAll = useCallback(
    (list) => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      const now = Date.now();
      list.forEach((memo) => {
        if (memo.is_alerted) return;
        const delay = new Date(memo.alert_datetime).getTime() - now;
        if (delay <= 0) {
          fireNotification(memo);
        } else {
          timersRef.current.push(setTimeout(() => fireNotification(memo), delay));
        }
      });
    },
    [fireNotification]
  );

  // 메모 목록 로드
  const loadMemos = useCallback(async () => {
    try {
      const data = await orderApi.list(tokenRef.current);
      setMemos(data);
      return data;
    } catch (e) {
      setPageError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기화
  useEffect(() => {
    registerSW();
    requestNotifPermission().then((p) => {
      if (p !== 'unsupported') setNotifPerm(p);
    });
    loadMemos().then(scheduleAll);
    return () => timersRef.current.forEach(clearTimeout);
  }, [loadMemos, scheduleAll]);

  // 모달 열기
  function openCreate() {
    setEditTarget(null);
    setForm({ title: '', content: '', alert_datetime: '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(memo) {
    setEditTarget(memo);
    setForm({
      title: memo.title,
      content: memo.content,
      alert_datetime: toLocalDatetimeValue(memo.alert_datetime),
    });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setFormError('');
  }

  // 저장
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setFormError('제목을 입력해 주세요.');
    if (!form.content.trim()) return setFormError('내용을 입력해 주세요.');
    if (!form.alert_datetime) return setFormError('알림 날짜/시간을 선택해 주세요.');

    setSubmitting(true);
    setFormError('');
    try {
      if (editTarget) {
        await orderApi.update(editTarget.id, form, tokenRef.current);
      } else {
        await orderApi.create(form, tokenRef.current);
      }
      closeModal();
      const data = await loadMemos();
      scheduleAll(data);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // 삭제
  async function handleDelete(id) {
    if (!window.confirm('메모를 삭제하시겠습니까?')) return;
    try {
      await orderApi.remove(id, tokenRef.current);
      const data = await loadMemos();
      scheduleAll(data);
    } catch (e) {
      alert(e.message);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="대시보드로 돌아가기"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-indigo-600">발주 메모</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        {/* 알림 권한 배너 */}
        {notifPerm === 'default' && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl shrink-0">🔔</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-yellow-800 font-medium">브라우저 알림 권한이 필요합니다</p>
              <p className="text-xs text-yellow-600 mt-0.5">알림 시간이 되면 브라우저 알림을 보내드립니다.</p>
            </div>
            <button
              onClick={() =>
                requestNotifPermission().then((p) => {
                  if (p !== 'unsupported') setNotifPerm(p);
                })
              }
              className="shrink-0 text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition"
            >
              허용하기
            </button>
          </div>
        )}
        {notifPerm === 'denied' && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
            브라우저 알림이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해 주세요.
          </div>
        )}

        {/* 목록 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">발주 메모 목록</h2>
            <p className="text-xs text-gray-400 mt-0.5">알림 시간 순으로 정렬됩니다.</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 active:scale-95 transition"
          >
            + 새 메모
          </button>
        </div>

        {/* 오류 */}
        {pageError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
            {pageError}
          </div>
        )}

        {/* 목록 */}
        {loading ? (
          <div className="text-center text-gray-400 py-20 text-sm">불러오는 중...</div>
        ) : memos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-400 text-sm">등록된 발주 메모가 없습니다.</p>
            <p className="text-gray-400 text-xs mt-1">새 메모를 작성해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onEdit={() => openEdit(memo)}
                onDelete={() => handleDelete(memo.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 작성/수정 모달 */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">{editTarget ? '메모 수정' : '새 발주 메모'}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="예: 주간 식재료 발주"
                  maxLength={100}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">발주 내용</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder={"예: 상추 2박스\n삼겹살 5kg\n두부 10모"}
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">알림 날짜/시간</label>
                <input
                  type="datetime-local"
                  value={form.alert_datetime}
                  onChange={(e) => setForm((f) => ({ ...f, alert_datetime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>

              {formError && <p className="text-red-500 text-xs">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {submitting ? '저장 중...' : editTarget ? '수정하기' : '저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
