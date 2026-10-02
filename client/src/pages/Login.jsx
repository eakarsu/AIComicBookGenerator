import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

function __demoAutofill() {
  (async () => {
    let email = "";
    let password = "";
    try {
      const response = await fetch("/api/auth/demo-credentials", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        email = data.email || data.username || "";
        password = data.password || "";
      }
    } catch (error) {
      /* fall back to build-time credentials below */
    }
    if (!email || !password) {
      const env = (typeof process !== "undefined" && process.env) ? process.env : {};
      email = email || env.REACT_APP_DEMO_EMAIL || env.VITE_DEMO_EMAIL || "";
      password = password || env.REACT_APP_DEMO_PASSWORD || env.VITE_DEMO_PASSWORD || "";
    }
    const form = document.querySelector("form");
    const setValue = (element, value) => {
      if (!element) return;
      const prototype = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
      setter.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const scope = form || document;
    setValue(scope.querySelector('input[type="email"], input[name="email"], input[name="username"]') || scope.querySelectorAll("input")[0], email);
    setValue(scope.querySelector('input[type="password"], input[name="password"]') || scope.querySelectorAll("input")[1], password);
    window.setTimeout(() => {
      if (form && typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        const submit = scope.querySelector('button[type="submit"], input[type="submit"]');
        if (submit) submit.click();
      }
    }, 50);
  })();
}

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: '2rem' },
  card: { background: '#1e293b', border: '1px solid #2d3748', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem', textAlign: 'center' },
  subtitle: { color: '#64748b', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  label: { color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' },
  input: { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', padding: '0.7rem 1rem', fontSize: '0.9rem' },
  btn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.8rem', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', width: '100%' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  error: { color: '#f87171', fontSize: '0.85rem', textAlign: 'center', background: '#2d1b1b', padding: '0.6rem', borderRadius: '6px' },
  hint: { color: '#475569', fontSize: '0.78rem', textAlign: 'center', marginTop: '1rem', padding: '0.75rem', background: '#0f172a', borderRadius: '8px' },
  defaultsBtn: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' },
};

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn) navigate('/');
  }, [isLoggedIn]);

  async function loadDefaults() {
    try {
      const res = await fetch('/api/auth/defaults');
      const data = await res.json();
      setEmail(data.email);
      setPassword(data.password);
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to create and manage comic stories</p>

        {error && <div style={{ ...styles.error, marginBottom: '1rem' }}>{error}</div>}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.hint}>
          Need credentials?{' '}
          <button style={styles.defaultsBtn} type="button" onClick={__demoAutofill}>
            Auto Fill Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
