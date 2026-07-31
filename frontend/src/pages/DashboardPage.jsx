import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TOOLS = [
  {
    id: 'asset-formula',
    icon: '📐',
    title: '자산형성 공식',
    description: '월수입을 입력하면 저축·투자 배분을 추천합니다.',
    path: '/asset-formula',
    available: true,
  },
  {
    id: 'goals',
    icon: '🎯',
    title: '목적자금 관리',
    description: '목표 금액과 기한을 정하고 저축 진행률을 추적합니다.',
    path: '/goals',
    available: true,
  },
  {
    id: 'roadmap',
    icon: '🗺️',
    title: '나만의 로드맵',
    description: '내 목표들을 기한순으로 한눈에 모아봅니다.',
    path: '/roadmap',
    available: true,
  },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-indigo-600">자산형성 도우미</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">안녕하세요 👋</h2>
          <p className="text-sm text-gray-500 mt-1">필요한 도구를 선택하세요.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => tool.available && navigate(tool.path)}
              disabled={!tool.available}
              className={`text-left bg-white rounded-2xl border p-5 shadow-sm transition
                ${tool.available
                  ? 'border-gray-100 hover:border-indigo-300 hover:shadow-md cursor-pointer active:scale-95'
                  : 'border-gray-100 opacity-50 cursor-not-allowed'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{tool.icon}</span>
                {!tool.available && (
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">준비 중</span>
                )}
              </div>
              <p className="font-semibold text-gray-800 text-sm">{tool.title}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{tool.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
