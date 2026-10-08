import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useMatch, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, MessageSquare, MoreVertical, Pencil, Plus, Settings, Trash2 } from 'lucide-react';
import Logo from './Logo.jsx';
import { useChats } from '../context/ChatsContext.jsx';
import { formatWhen } from '../utils.js';

function RecentItem({ chat, active, onNavigate }) {
  const { remove, rename } = useChats();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Link to={`/chat/${chat.id}`} className={`recent-item ${active ? 'active' : ''}`} onClick={onNavigate}>
        <MessageSquare size={20} color="var(--text-2)" />
        <div className="grow">
          <div className="t">{chat.title}</div>
          <div className="s">{formatWhen(chat.updatedAt)}</div>
        </div>
        <button
          className="icon-btn kebab"
          aria-label="Chat options"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <MoreVertical size={16} />
        </button>
      </Link>
      {open && (
        <div className="menu">
          <button
            onClick={async () => {
              setOpen(false);
              const t = window.prompt('Rename chat', chat.title);
              if (t && t.trim()) await rename(chat.id, t.trim()).catch((e) => alert(e.message));
            }}
          >
            <Pencil size={15} /> Rename
          </button>
          <button
            className="danger"
            onClick={async () => {
              setOpen(false);
              if (!window.confirm('Delete this chat?')) return;
              await remove(chat.id).catch((e) => alert(e.message));
              if (active) navigate('/');
            }}
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  const { chats, loaded } = useChats();
  const id = useMatch('/chat/:id')?.params.id;
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo size={30} /> Need2Know
      </div>
      <button
        className="btn primary new-chat"
        onClick={() => {
          navigate('/');
          onNavigate?.();
        }}
      >
        <Plus size={20} /> New Chat
      </button>

      <nav className="nav">
        <NavLink to="/history" className="nav-item" onClick={onNavigate}>
          <Clock size={20} /> Chat History
        </NavLink>
        <NavLink to="/knowledge" className="nav-item" onClick={onNavigate}>
          <BookOpen size={20} /> Knowledge Base
        </NavLink>
      </nav>

      <div className="side-section">Recent Chats</div>
      <div className="recent">
        {loaded && chats.length === 0 && <div className="hint" style={{ padding: '6px 10px' }}>No chats yet. Ask your first question!</div>}
        {chats.slice(0, 8).map((c) => (
          <RecentItem key={c.id} chat={c} active={c.id === id} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="side-bottom">
        <NavLink to="/settings" className="nav-item" onClick={onNavigate}>
          <Settings size={20} /> Settings
        </NavLink>
      </div>
    </aside>
  );
}
