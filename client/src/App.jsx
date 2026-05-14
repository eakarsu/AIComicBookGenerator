import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import StoryDetail from './pages/StoryDetail.jsx';
import CreateStory from './pages/CreateStory.jsx';
import Login from './pages/Login.jsx';
import AITools from './pages/AITools.jsx';

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('comic_token'));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('comic_user');
    return u ? JSON.parse(u) : null;
  });

  function login(token, user) {
    localStorage.setItem('comic_token', token);
    localStorage.setItem('comic_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem('comic_token');
    localStorage.removeItem('comic_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const styles = {
  nav: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderBottom: '1px solid #2d3748',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    color: '#a78bfa',
    fontWeight: 800,
    fontSize: '1.2rem',
    textDecoration: 'none',
    letterSpacing: '-0.5px',
  },
  navLinks: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  navLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  btn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
};

function NavBar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>Comic AI</Link>
      <div style={styles.navLinks}>
        <Link to="/" style={styles.navLink}>Browse</Link>
        {isLoggedIn && (
          <Link to="/create" style={styles.navLink}>Create Story</Link>
        )}
        <Link to="/ai-tools" style={styles.navLink}>AI Tools</Link>
        {isLoggedIn ? (
          <>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{user?.email}</span>
            <button style={styles.btn} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">
            <button style={styles.btn}>Login</button>
          </Link>
        )}
      </div>
    </nav>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stories/:id" element={<StoryDetail />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateStory />
              </ProtectedRoute>
            }
          />
          <Route path="/ai-tools" element={<AITools />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
