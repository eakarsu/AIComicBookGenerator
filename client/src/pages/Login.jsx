import { useRef as useDemoLoginRef, useState as useDemoLoginState } from 'react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

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
  const demoLoginLock = useDemoLoginRef(false);
  const [demoLoginBusy, setDemoLoginBusy] = useDemoLoginState(false);

  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const demoEmail = import.meta.env.VITE_DEMO_EMAIL;
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
  const demoConfigured = Boolean(demoEmail && demoPassword);

  useEffect(() => {
    if (isLoggedIn) navigate('/');
  }, [isLoggedIn]);

  async function handleFillDemoCredentials() {
    if (demoConfigured) { setEmail(demoEmail); setPassword(demoPassword); setError(''); return; }
    try {
      const res = await fetch('/api/auth/demo-credentials', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data && data.email && data.password) { setEmail(data.email); setPassword(data.password); setError(''); return; }
    } catch {}
    setError('Demo credentials are not configured for this environment.');
  }

  async function loadDefaults() {
    try {
      const res = await fetch('/api/auth/defaults');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo credentials are unavailable');
      setEmail(data.email);
      setPassword(data.password);
    } catch {}
  }

  async function handleSubmit(e, demoLoginCredentials) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (demoLoginCredentials?.email ?? email), password: (demoLoginCredentials?.password ?? password) }),
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
          <button type="button" aria-label="Fill demo credentials" disabled={loading} onClick={handleFillDemoCredentials} style={{ background: 'transparent', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', padding: '0.8rem', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
            Fill demo credentials
          </button>
        </form>

        <div style={styles.hint}>
          Need credentials?{' '}
          <button disabled={demoLoginBusy} style={styles.defaultsBtn} type="button" onClick={async (event) => {
 if (demoLoginLock.current) return;
 demoLoginLock.current = true; setDemoLoginBusy(true);
 const values = {};
 const captureDemoValue = (key, value) => { values[key] = value; return value; };
 try {
  await (async () => {
    try {
      const res = await fetch('/api/auth/defaults');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo credentials are unavailable');
      setEmail(captureDemoValue("email", data.email));
      setPassword(captureDemoValue("password", data.password));
    } catch (error) {captureDemoValue('error', error.message || 'Demo credentials are unavailable');}
  })(event);
  if (values.error || typeof values.email !== 'string' || !values.email || typeof values.password !== 'string' || !values.password) { setError(typeof values.error === 'string' ? values.error : 'Demo credentials are unavailable.'); return; }
  await handleSubmit(event, { email: values.email, password: values.password });
 } finally { demoLoginLock.current = false; setDemoLoginBusy(false); }
}}>
            Log In as Demo
          </button>
        </div>
      </div>
    </div>
  );
}
