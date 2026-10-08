import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { initials } from '../utils.js';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <header className="topbar">
      <button className="icon-btn burger" onClick={onMenu} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <button className="icon-btn" onClick={toggle} aria-label="Toggle theme" title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
        {theme === 'light' ? <Sun size={21} /> : <Moon size={21} />}
      </button>
      <div className="vr" />
      <div ref={ref} style={{ position: 'relative' }}>
        <button className="user-btn" onClick={() => setOpen((v) => !v)} aria-label="Account menu">
          <span className="avatar">{initials(user.name)}</span>
          <ChevronDown size={18} color="var(--text-2)" />
        </button>
        {open && (
          <div className="user-menu">
            <div className="who">
              <b>{user.name}</b>
              <span className="hint">@{user.username}</span>
              <div style={{ marginTop: 6 }}>
                <span className="badge blue">{user.role}</span>
              </div>
            </div>
            <div className="menu" style={{ position: 'static', border: 0, boxShadow: 'none', padding: 0 }}>
              <Link to="/settings/account" onClick={() => setOpen(false)}>
                <User size={16} /> Account
              </Link>
              <button className="danger" onClick={logout}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
