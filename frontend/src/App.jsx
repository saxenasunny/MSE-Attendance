import { useState, useEffect } from 'react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
let token = localStorage.getItem('token');

async function api(path, opt = {}) {
  const isForm = opt.body instanceof FormData;
  const r = await fetch(API + path, {
    ...opt,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      Authorization: 'Bearer ' + token
    },
    body: opt.body && !isForm ? JSON.stringify(opt.body) : opt.body
  });
  if (r.status === 401 && token) {
    localStorage.clear();
    location.reload();
  }
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed');
  }
  return opt.raw ? r : r.json();
}

const fmt = d => (d ? d.split('-').reverse().join('-') : '');

// ---- SVG Icons ----
const Icons = {
  User: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  EyeOff: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Key: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  FileSpreadsheet: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
};

// ---- Password Change Modal ----
function ChangePasswordModal({ onClose }) {
  const [curr, setCurr] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 6) {
      return setMsg({ ok: false, t: 'New password must be at least 6 characters long.' });
    }
    if (next !== confirm) {
      return setMsg({ ok: false, t: 'New password and confirmation do not match.' });
    }
    setBusy(true);
    try {
      await api('/api/change-password', {
        method: 'POST',
        body: { currentPassword: curr, newPassword: next }
      });
      setMsg({ ok: true, t: 'Password changed successfully! You can now log in with your new password.' });
      setCurr('');
      setNext('');
      setConfirm('');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setMsg({ ok: false, t: err.message });
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Icons.Key />
            </div>
            <h3 className="font-bold text-base">Change Password</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
            <input
              required
              type="password"
              placeholder="Enter current password"
              value={curr}
              onChange={e => setCurr(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
            <input
              required
              type="password"
              placeholder="At least 6 characters"
              value={next}
              onChange={e => setNext(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
            <input
              required
              type="password"
              placeholder="Re-enter new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {msg && (
            <div className={`p-3 rounded-xl text-xs font-medium border ${
              msg.ok ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}>
              {msg.t}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-[2] py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {busy ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Login Component ----
function Login({ onDone }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const go = async e => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const r = await api('/api/login', { method: 'POST', body: { username: u, password: p } });
      token = r.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(r.user));
      onDone(r.user);
    } catch (x) {
      setErr(x.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col justify-center items-center px-4 py-12 text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/25 mb-4 ring-4 ring-indigo-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">MSE Exam Attendance</h1>
          <p className="text-sm text-slate-400 mt-1">Live Invigilator & Examination Management Portal</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <form onSubmit={go} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Icons.User />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={u}
                  onChange={e => setU(e.target.value)}
                  autoCapitalize="none"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Icons.Lock />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={p}
                  onChange={e => setP(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white focus:outline-none"
                >
                  {showPass ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </div>

            {err && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging in…</span>
                </>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>

          {/* Quick Help */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">First time logging in?</strong> Log in as <code className="px-1.5 py-0.5 bg-slate-800 rounded text-indigo-400 font-mono font-semibold">admin</code> using your Render password.
            </p>
          </div>
        </div>

        {/* Footer Copyright */}
        <footer className="mt-8 text-center text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} <span className="text-slate-300 font-semibold tracking-wide">Cryptic-Automations</span>. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

// ---- Mark Attendance Tab ----
function Mark({ user }) {
  const [dates, setDates] = useState([]);
  const [date, setDate] = useState('');
  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState('');
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState('');
  const [list, setList] = useState([]);
  const [locked, setLocked] = useState(false);
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('roll');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/dates').then(setDates).catch(e => setMsg({ t: e.message }));
  }, []);

  useEffect(() => {
    setSession('');
    setSessions([]);
    if (date) api('/api/sessions?date=' + date).then(setSessions);
  }, [date]);

  const loadRooms = () => {
    if (session) api(`/api/rooms?date=${date}&session=${session}`).then(setRooms);
  };

  useEffect(() => {
    setRoom('');
    setRooms([]);
    loadRooms();
  }, [session]);

  const loadRoster = () => {
    api(`/api/roster?date=${date}&session=${session}&room=${room}`).then(r => {
      setList(r.students);
      setLocked(r.locked);
    });
  };

  useEffect(() => {
    setList([]);
    setMsg(null);
    if (room) loadRoster();
  }, [room]);

  const setStatus = (idx, status) => {
    setList(l => l.map((x, j) => (j === idx ? { ...x, status } : x)));
  };

  const setAllStatus = status => {
    setList(l => l.map(x => ({ ...x, status })));
  };

  const readOnly = locked && user.role !== 'admin';
  const presentCount = list.filter(x => x.status === 'Present').length;
  const absentCount = list.filter(x => x.status === 'Absent').length;
  const unmarkedCount = list.filter(x => !x.status).length;
  const totalCount = list.length;
  const progressPercent = totalCount ? Math.round(((presentCount + absentCount) / totalCount) * 100) : 0;

  const save = async () => {
    if (unmarkedCount && !confirm(`${unmarkedCount} student(s) are still unmarked and will not be saved. Save anyway?`)) return;
    setBusy(true);
    try {
      const r = await api('/api/attendance', {
        method: 'POST',
        body: {
          date,
          session,
          room,
          records: list.filter(x => x.status).map(x => ({
            enrollment_no: x.enrollment_no,
            subject_code: x.subject_code,
            status: x.status
          }))
        }
      });
      setMsg({ ok: true, t: `Successfully saved ${r.saved} attendance records!` });
      loadRooms();
    } catch (e) {
      setMsg({ ok: false, t: e.message });
    }
    setBusy(false);
  };

  const filteredStudents = list
    .map((s, i) => [s, i])
    .filter(([s]) => !q || (s.enrollment_no + ' ' + s.name + ' ' + s.subject_code).toLowerCase().includes(q.toLowerCase()));

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const sA = a[0], sB = b[0];
    if (sortBy === 'name') {
      return (sA.name || '').localeCompare(sB.name || '');
    }
    if (sortBy === 'subject') {
      const cmp = (sA.subject_code || '').localeCompare(sB.subject_code || '');
      return cmp !== 0 ? cmp : (sA.enrollment_no || '').localeCompare(sB.enrollment_no || '', undefined, { numeric: true });
    }
    if (sortBy === 'unmarked') {
      const rank = s => (!s.status ? 0 : s.status === 'Absent' ? 1 : 2);
      const diff = rank(sA) - rank(sB);
      return diff !== 0 ? diff : (sA.enrollment_no || '').localeCompare(sB.enrollment_no || '', undefined, { numeric: true });
    }
    // Default 'roll': Numerical/alphabetical Roll Number order
    return (sA.enrollment_no || '').localeCompare(sB.enrollment_no || '', undefined, { numeric: true });
  });

  return (
    <div className="pb-44 text-white">
      {/* Selector Header Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-4 mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Icons.Calendar /> Exam Date
            </label>
            <select
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Date…</option>
              {dates.map(d => (
                <option key={d} value={d}>{fmt(d)}</option>
              ))}
            </select>
          </div>

          {/* Session Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Icons.Clock /> Session
            </label>
            <select
              value={session}
              onChange={e => setSession(e.target.value)}
              disabled={!date}
              className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
            >
              <option value="">Select Session…</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Room Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Icons.Building /> Room No.
            </label>
            <select
              value={room}
              onChange={e => setRoom(e.target.value)}
              disabled={!session}
              className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
            >
              <option value="">Select Room…</option>
              {rooms.map(r => (
                <option key={r.room} value={r.room}>
                  Room {r.room} ({r.marked}/{r.total} marked){r.locked ? ' 🔒 Locked' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Info, Search Bar & Sort Toggle */}
        {room && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Search roll no, name, subject…"
                value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Sort Toggle */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-slate-800/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="roll">🔢 Roll Number (Default)</option>
                  <option value="name">🔤 Student Name (A-Z)</option>
                  <option value="subject">📚 Subject Code</option>
                  <option value="unmarked">⏳ Unmarked First</option>
                </select>
              </div>

              <div className="text-xs text-slate-400 text-right font-medium">
                Showing <span className="font-bold text-white">{sortedStudents.length}</span> of {totalCount} students
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lock Notice */}
      {locked && (
        <div className="mb-4 rounded-xl bg-amber-950/40 border border-amber-500/30 p-3.5 text-xs text-amber-300 flex items-center gap-2.5">
          <span className="text-base">🔒</span>
          <span>
            {readOnly ? (
              <strong>This room is locked by an administrator. Attendance is view-only.</strong>
            ) : (
              <span>This room is locked for invigilators, but you are logged in as admin (edits allowed).</span>
            )}
          </span>
        </div>
      )}

      {/* Notification Toast */}
      {msg && (
        <div className={`mb-4 p-3.5 rounded-xl border text-sm flex items-center justify-between ${
          msg.ok ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <span>{msg.ok ? '✓' : '⚠'}</span>
            <span className="font-medium">{msg.t}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-xs opacity-60 hover:opacity-100 font-bold">Dismiss</button>
        </div>
      )}

      {/* Students List */}
      {room && (
        <div className="space-y-2">
          {sortedStudents.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 text-slate-400 text-sm">
              No students found matching your criteria.
            </div>
          ) : (
            sortedStudents.map(([s, i], displayIndex) => {
              const isPresent = s.status === 'Present';
              const isAbsent = s.status === 'Absent';
              return (
                <div
                  key={s.enrollment_no + '|' + s.subject_code}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl backdrop-blur-md border transition-all ${
                    isPresent
                      ? 'border-emerald-500/40 bg-emerald-950/20 shadow-md shadow-emerald-950/40'
                      : isAbsent
                      ? 'border-rose-500/40 bg-rose-950/20 shadow-md shadow-rose-950/40'
                      : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isPresent ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isAbsent ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {displayIndex + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-bold text-white tracking-wide">{s.enrollment_no}</span>
                        {s.section && (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[11px] font-semibold border border-white/5">
                            Sec: {s.section}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md text-[11px] font-semibold border border-indigo-500/30">
                          {s.subject_code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium truncate mt-0.5">{s.name}</div>
                      {s.subject_name && (
                        <div className="text-[11px] text-slate-400 truncate">{s.subject_name}</div>
                      )}
                    </div>
                  </div>

                  {/* Present / Absent Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => setStatus(i, isPresent ? '' : 'Present')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40 ${
                        isPresent
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-500/40'
                          : 'bg-slate-800/90 hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-300 border border-white/10'
                      }`}
                    >
                      <Icons.Check />
                      <span>Present</span>
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => setStatus(i, isAbsent ? '' : 'Absent')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40 ${
                        isAbsent
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-500/40'
                          : 'bg-slate-800/90 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-white/10'
                      }`}
                    >
                      <span>✕</span>
                      <span>Absent</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      {room && (
        <div className="fixed inset-x-0 bottom-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 p-3 sm:p-4 pointer-events-auto space-y-3">
            {/* Live Progress Bar & Stats */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    <strong>{presentCount}</strong> Present
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400" />
                    <strong>{absentCount}</strong> Absent
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                    <strong>{unmarkedCount}</strong> Unmarked
                  </span>
                </div>
                <span className="text-slate-400 font-mono">{progressPercent}% marked</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex border border-white/5">
                <div style={{ width: `${(presentCount / (totalCount || 1)) * 100}%` }} className="bg-emerald-500 transition-all duration-300" />
                <div style={{ width: `${(absentCount / (totalCount || 1)) * 100}%` }} className="bg-rose-500 transition-all duration-300" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setAllStatus('Present')}
                className="flex-1 py-2.5 px-3 bg-emerald-950/40 hover:bg-emerald-900/50 active:scale-95 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/30 transition-all disabled:opacity-40"
              >
                Mark All Present
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setAllStatus('Absent')}
                className="flex-1 py-2.5 px-3 bg-rose-950/40 hover:bg-rose-900/50 active:scale-95 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition-all disabled:opacity-40"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                disabled={readOnly || busy}
                onClick={save}
                className="flex-[2] py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Icons.Check />
                    <span>Save Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Report Tab ----
function Report() {
  const [dates, setDates] = useState([]);
  const [date, setDate] = useState('');
  const [d, setD] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api('/api/dates').then(x => {
      setDates(x);
      if (x.length) setDate(x[0]);
    });
  }, []);

  const load = () => {
    if (date) api('/api/report?date=' + date).then(setD);
  };

  useEffect(() => {
    setD(null);
    load();
  }, [date]);

  const dl = async f => {
    const r = await api(`/api/report/export?date=${date}&format=${f}`, { raw: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(await r.blob());
    a.download = `attendance_${date}.${f}`;
    a.click();
  };

  const toggleLock = async x => {
    await api('/api/admin/lock', {
      method: 'POST',
      body: { date, session: x.session, room: x.room, locked: !x.locked }
    });
    load();
  };

  const tot = k => (d ? d.summary.reduce((a, x) => a + x[k], 0) : 0);

  return (
    <div className="space-y-4 text-white">
      {/* Top Filter and Download Bar */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Exam Date</label>
          <select
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {dates.map(x => (
              <option key={x} value={x}>{fmt(x)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => dl('xlsx')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Icons.FileSpreadsheet />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => dl('csv')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {d && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Seated', key: 'total', color: 'text-white', bg: 'bg-slate-900/60 border-indigo-500/30' },
              { label: 'Present', key: 'present', color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/30' },
              { label: 'Absent', key: 'absent', color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-500/30' },
              { label: 'Unmarked', key: 'notMarked', color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/30' }
            ].map(item => (
              <div key={item.key} className={`rounded-2xl border backdrop-blur-xl p-4 shadow-xl ${item.bg}`}>
                <div className={`text-2xl sm:text-3xl font-extrabold ${item.color}`}>{tot(item.key)}</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Rooms Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Wise Status</h3>
            {d.summary.map(x => {
              const key = x.session + x.room;
              const absentees = d.rows.filter(r => r.Session === x.session && r['Room No'] === x.room);
              const isOpen = open === key;

              return (
                <div key={key} className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden transition-all">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setOpen(isOpen ? null : key)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">Room {x.room}</span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                          {x.session}
                        </span>
                        {x.locked && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center gap-1 border border-amber-500/30">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span className="text-emerald-400 font-semibold">{x.present}P</span>
                        <span className="text-rose-400 font-semibold">{x.absent}A</span>
                        <span className="text-amber-400 font-semibold">{x.notMarked} Unmarked</span>
                        <span>/ Total {x.total}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleLock(x);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          x.locked
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                            : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {x.locked ? 'Unlock Room' : 'Lock Room'}
                      </button>
                      <div className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        <Icons.ChevronDown />
                      </div>
                    </div>
                  </div>

                  {/* Absent & Unmarked Student Accordion */}
                  {isOpen && (
                    <div className="border-t border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Absent & Unmarked Students ({absentees.length})</div>
                      {absentees.length === 0 ? (
                        <p className="text-xs text-emerald-400 font-medium">All seated students in this room are marked Present! 🎉</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {absentees.map(r => (
                            <div key={r['Enrollment No'] + r['Subject Code']} className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-white">{r['Enrollment No']}</span>
                                <div className="text-[11px] text-slate-400 truncate">{r.Name} · {r['Subject Code']}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                r['Attendance Status'] === 'Absent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {r['Attendance Status']}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Upload Card ----
function UploadCard({ label, path, hint, step }) {
  const [r, setR] = useState(null);
  const [busy, setBusy] = useState(false);

  const go = async e => {
    const f = e.target.files[0];
    if (!f) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', f);
    try {
      setR(await api(path, { method: 'POST', body: fd }));
    } catch (x) {
      setR({ error: x.message });
    }
    setBusy(false);
    e.target.value = '';
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl p-5 border border-white/10 shadow-xl space-y-3 text-white">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center justify-center">
          {step}
        </span>
        <h3 className="font-bold text-white text-base">{label}</h3>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{hint}</p>

      <label className="block">
        <div className="w-full border-2 border-dashed border-indigo-500/30 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-indigo-950/30">
          <div className="flex justify-center text-indigo-400 mb-2">
            <Icons.Upload />
          </div>
          <span className="text-xs font-semibold text-slate-200 block">Click to choose Excel or CSV file</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Supports .xlsx, .xls, .csv</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={go}
            disabled={busy}
            className="hidden"
          />
        </div>
      </label>

      {busy && (
        <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold pt-1">
          <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          <span>Importing data into database…</span>
        </div>
      )}

      {r && (
        <div className={`mt-2 p-3 rounded-xl text-xs font-mono overflow-auto max-h-48 border ${
          r.error ? 'bg-rose-950/50 border-rose-500/30 text-rose-300' : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
        }`}>
          <pre>{JSON.stringify(r, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ---- Admin Tab ----
function Admin({ onOpenPasswordModal }) {
  const [f, setF] = useState({ username: '', name: '', password: '', role: 'invigilator' });
  const [m, setM] = useState(null);
  const [busy, setBusy] = useState(false);

  const add = async e => {
    e.preventDefault();
    setBusy(true);
    setM(null);
    try {
      await api('/api/admin/users', { method: 'POST', body: f });
      setM({ ok: true, t: `User "${f.username}" created successfully!` });
      setF({ username: '', name: '', password: '', role: 'invigilator' });
    } catch (e) {
      setM({ ok: false, t: e.message });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4 text-white">
      {/* Quick Security Action Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-900/80 border border-indigo-500/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <Icons.Key />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Administrator Security</h4>
            <p className="text-xs text-slate-400">Want to update your current login password?</p>
          </div>
        </div>
        <button
          onClick={onOpenPasswordModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
        >
          Change Password
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UploadCard
          step="1"
          label="Student Master Data"
          path="/api/admin/import/students"
          hint="Upload Std_Data sheet with columns: Roll_No / Enrollment No, Name, Program / Course_Name, Section, Subject_Code, Subject_Name, Exam_Date, Session."
        />
        <UploadCard
          step="2"
          label="Seating Plan Workbook"
          path="/api/admin/import/seating"
          hint="Upload room-wise workbook (e.g. 05-10-2026_Evening.xlsx) or a flat sheet with a Room No column. Re-uploading replaces seating for that date+session while keeping marked attendance."
        />
      </div>

      {/* Add User Card */}
      <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl p-5 border border-white/10 shadow-xl">
        <h3 className="font-bold text-white text-base mb-1">Create System User</h3>
        <p className="text-xs text-slate-400 mb-4">Add invigilators or additional admins who can log into the portal.</p>

        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Username</label>
            <input
              required
              className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. invigilator1"
              value={f.username}
              onChange={e => setF({ ...f, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
            <input
              required
              className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Prof. Sharma"
              value={f.name}
              onChange={e => setF({ ...f, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <input
              required
              type="password"
              className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Minimum 6 characters"
              value={f.password}
              onChange={e => setF({ ...f, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Role</label>
            <select
              className="w-full bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={f.role}
              onChange={e => setF({ ...f, role: e.target.value })}
            >
              <option value="invigilator">Invigilator</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="sm:col-span-2 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40"
            >
              {busy ? 'Creating User…' : 'Create User Account'}
            </button>
          </div>
        </form>

        {m && (
          <div className={`mt-3 p-3 rounded-xl text-xs font-medium border ${
            m.ok ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
          }`}>
            {m.t}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main App Component ----
export default function App() {
  const [user, setUser] = useState(() => (token ? JSON.parse(localStorage.getItem('user') || 'null') : null));
  const [tab, setTab] = useState('mark');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  if (!user) return <Login onDone={setUser} />;

  const tabs = user.role === 'admin'
    ? [
        { id: 'mark', label: 'Mark Attendance' },
        { id: 'report', label: 'Summary Report' },
        { id: 'admin', label: 'Admin Setup' }
      ]
    : [
        { id: 'mark', label: 'Mark Attendance' }
      ];

  const handleLogout = () => {
    localStorage.clear();
    location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-lg" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500/20">
              MSE
            </div>
            <div>
              <div className="font-bold text-sm text-white leading-none">Exam Attendance</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Examination Management Portal</div>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                user.role === 'admin'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {user.role}
              </span>
            </div>

            {/* Change Password Button */}
            <button
              onClick={() => setPasswordModalOpen(true)}
              title="Change Password"
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
            >
              <Icons.Key />
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
            >
              <Icons.Logout />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-2 border-t border-white/5 pt-1.5 pb-2 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {tab === 'mark' && <Mark user={user} />}
        {tab === 'report' && <Report />}
        {tab === 'admin' && <Admin onOpenPasswordModal={() => setPasswordModalOpen(true)} />}
      </main>

      {/* Global Page Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-xs text-slate-500 font-medium border-t border-white/5 mt-4">
        <p>© {new Date().getFullYear()} <span className="text-slate-300 font-semibold tracking-wide">Cryptic-Automations</span>. All rights reserved.</p>
      </footer>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <ChangePasswordModal onClose={() => setPasswordModalOpen(false)} />
      )}
    </div>
  );
}
