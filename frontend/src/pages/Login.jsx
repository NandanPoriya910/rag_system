import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, MessagesSquare, BookOpenText, ShieldCheck, User } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const GoogleG = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.2 5.6c4.3-3.9 7.1-9.7 7.1-17.1z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.6 2.3-8.7 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const FEATURES = [
  { icon: MessagesSquare, bg: 'var(--blue-bg)', color: '#3b82f6', title: 'Smart Conversations', text: 'Get accurate, relevant and cited responses instantly.' },
  { icon: BookOpenText, bg: 'var(--purple-bg)', color: '#8b5cf6', title: 'Knowledge Base', text: 'Access your documents, files and internal knowledge.' },
  { icon: ShieldCheck, bg: 'var(--green-bg)', color: '#12b886', title: 'Secure & Private', text: 'You only see data your role is authorised to access.' },
];

export default function Login() {
  const { user, login, signup } = useAuth();
  const [mode, setMode] = useState('signin'); // signin | signup
  const [form, setForm] = useState({ identifier: '', password: '', name: '', email: '' });
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (user) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signin') await login(form.identifier, form.password, remember);
      else await signup({ name: form.name, email: form.email, password: form.password });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-left">
        <div className="brand">
          <Logo size={34} /> AI Assistant
        </div>
        <div className="login-hero">
          <h1>
            Your AI companion
            <br />
            for <span className="grad-text">better answers</span>
          </h1>
          <p>Ask questions, get insights, and explore your knowledge base — all in one place.</p>
          <div className="features">
            {FEATURES.map(({ icon: Icon, bg, color, title, text }) => (
              <div className="feature" key={title}>
                <div className="ico" style={{ background: bg, color }}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div style={{ marginLeft: 110 }}>
            <Logo size={110} />
          </div>
          <div className="bubble-demo" style={{ marginTop: 30 }}>
            <span className="dot"><Logo size={22} /></span>
            <div>Hello! I’m your AI assistant.<br />How can I help you today?</div>
          </div>
          <div className="bubble-typing"><i /><i /><i /></div>
        </div>
        <div className="tagline">Smarter queries. Bigger possibilities.</div>
      </section>

      <section className="login-card">
        <div className="center">
          <Logo size={44} />
          <h2>{mode === 'signin' ? 'AI Assistant' : 'Create your account'}</h2>
          <p className="sub">{mode === 'signin' ? 'Sign in to continue to your AI assistant' : 'New accounts start with the standard Employee role.'}</p>
        </div>

        <form onSubmit={submit} noValidate>
          {error && <div className="notice error">{error}</div>}
          {info && <div className="notice info">{info}</div>}

          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Full name</label>
              <div className="input-icon">
                <User className="lead" size={20} />
                <input id="name" className="input" placeholder="Your name" value={form.name} onChange={set('name')} autoComplete="name" />
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="identifier">{mode === 'signin' ? 'Username or Email' : 'Email Address'}</label>
            <div className="input-icon">
              <Mail className="lead" size={20} />
              {mode === 'signin' ? (
                <input id="identifier" className="input" placeholder="admin or you@example.com" value={form.identifier} onChange={set('identifier')} autoComplete="username" autoFocus />
              ) : (
                <input id="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-icon">
              <Lock className="lead" size={20} />
              <input id="password" className="input" type={show ? 'text' : 'password'} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'} value={form.password} onChange={set('password')} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} style={{ paddingRight: 50 }} />
              <button type="button" className="icon-btn trail" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          {mode === 'signin' && (
            <div className="row-between" style={{ marginBottom: 22 }}>
              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
              </label>
              <button type="button" className="link-btn" onClick={() => setInfo('Password resets are handled by your administrator. Please contact them.')}>
                Forgot password?
              </button>
            </div>
          )}

          <button className="btn primary btn-xl" type="submit" disabled={busy} style={{ marginTop: mode === 'signup' ? 8 : 0 }}>
            {busy ? <Loader2 className="spin" size={20} /> : mode === 'signin' ? <>Sign In <ArrowRight size={19} /></> : <>Create account <ArrowRight size={19} /></>}
          </button>
        </form>

        <div className="divider">or</div>
        <button className="btn btn-google" type="button" onClick={() => setInfo('Google sign-in isn’t configured for this deployment. Use your username and password.')}>
          <GoogleG /> Continue with Google
        </button>

        <p className="login-foot">
          {mode === 'signin' ? (
            <>Don’t have an account? <button className="link-btn" onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>Sign up</button></>
          ) : (
            <>Already have an account? <button className="link-btn" onClick={() => { setMode('signin'); setError(''); setInfo(''); }}>Sign in</button></>
          )}
        </p>
      </section>
    </div>
  );
}
