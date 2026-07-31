import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

// 로그인/회원가입 화면을 잠시 숨기는 동안, 고정된 게스트 계정으로 자동 로그인한다.
// 로그인 화면을 다시 쓰기로 하면 이 값을 false로 바꾸면 된다.
const AUTO_GUEST_LOGIN = true;
const GUEST_EMAIL = 'guest@sojang.app';
const GUEST_PASSWORD = 'Guest1234!';

function decodeValidToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(AUTO_GUEST_LOGIN);

  function login(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    const payload = decodeValidToken(token);
    if (!payload) {
      logout();
      return;
    }
    setUser({ id: payload.sub, email: payload.email });
  }, [token]);

  useEffect(() => {
    if (!AUTO_GUEST_LOGIN) return;
    if (decodeValidToken(localStorage.getItem('token'))) {
      setInitializing(false);
      return;
    }
    (async () => {
      try {
        const { access_token } = await authApi.login({
          email: GUEST_EMAIL,
          password: GUEST_PASSWORD,
        });
        login(access_token);
      } catch {
        try {
          const { access_token } = await authApi.register({
            email: GUEST_EMAIL,
            password: GUEST_PASSWORD,
          });
          login(access_token);
        } catch (err) {
          console.error('게스트 자동 로그인에 실패했습니다:', err);
        }
      } finally {
        setInitializing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
