import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BUSINESS_TYPES = [
  '음식점/카페',
  '소매업/편의점',
  '서비스업',
  '미용/뷰티',
  '교육/학원',
  '기타',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    business_type: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function validate() {
    if (form.password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (form.password !== form.passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    if (!form.business_type) return '업종을 선택해 주세요.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { access_token } = await authApi.register({
        email: form.email,
        password: form.password,
        business_type: form.business_type,
      });
      login(access_token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const passwordMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">소장 AI</h1>
          <p className="text-gray-500 mt-1 text-sm">소상공인 AI 업무 도우미</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">회원가입</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
                <span className="ml-1 text-xs text-gray-400 font-normal">(8자 이상)</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPw ? '숨김' : '보기'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                required
                placeholder="비밀번호를 다시 입력하세요"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${
                  passwordMismatch
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-indigo-400'
                }`}
              />
              {passwordMismatch && (
                <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업종
              </label>
              <select
                name="business_type"
                value={form.business_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-white"
              >
                <option value="">업종을 선택하세요</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || passwordMismatch}
              className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
