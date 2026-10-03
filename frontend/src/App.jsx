import { useState, useEffect } from 'react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
let token = localStorage.getItem('token');
async function api(path, opt = {}) {
  const isForm = opt.body instanceof FormData;
  const r = await fetch(API + path, { ...opt, headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), Authorization: 'Bearer ' + token },
    body: opt.body && !isForm ? JSON.stringify(opt.body) : opt.body });
  if (r.status === 401 && token) { localStorage.clear(); location.reload(); }
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Request failed');
  return opt.raw ? r : r.json();
}
const fmt = d => d.split('-').reverse().join('-');
const sel = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base disabled:bg-slate-100';
const btn = 'rounded-lg px-4 py-3 text-sm font-semibold active:scale-95 disabled:opacity-50';

function Login({ onDone }) {
  const [u, setU] = useState(''), [p, setP] = useState(''), [err, setErr] = useState('');
  const go = async e => {
    e.preventDefault(); setErr('');
    try {
      const r = await api('/api/login', { method: 'POST', body: { username: u, password: p } });
      token = r.token; localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(r.user)); onDone(r.user);
    } catch (x) { setErr(x.message); }
  };
  return (
    <form onSubmit={go} className="mx-auto mt-16 max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow">
      <h1 className="text-xl font-bold">Exam Attendance</h1>
      <input className={sel} placeholder="Username" value={u} onChange={e => setU(e.target.value)} autoCapitalize="none" />
      <input className={sel} placeholder="Password" type="password" value={p} onChange={e => setP(e.target.value)} />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button className={btn + ' w-full bg-indigo-600 text-white'}>Log in</button>
    </form>
  );
}

function Mark({ user }) {
  const [dates, setDates] = useState([]), [date, setDate] = useState(''), [sessions, setSessions] = useState([]), [session, setSession] = useState('');
  const [rooms, setRooms] = useState([]), [room, setRoom] = useState(''), [list, setList] = useState([]), [locked, setLocked] = useState(false);
  const [q, setQ] = useState(''), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => { api('/api/dates').then(setDates).catch(e => setMsg({ t: e.message })); }, []);
  useEffect(() => { setSession(''); setSessions([]); if (date) api('/api/sessions?date=' + date).then(setSessions); }, [date]);
  const loadRooms = () => session && api(`/api/rooms?date=${date}&session=${session}`).then(setRooms);
  useEffect(() => { setRoom(''); setRooms([]); loadRooms(); }, [session]);
  const loadRoster = () => api(`/api/roster?date=${date}&session=${session}&room=${room}`).then(r => { setList(r.students); setLocked(r.locked); });
  useEffect(() => { setList([]); setMsg(null); if (room) loadRoster(); }, [room]);

  const set = (i, s) => setList(l => l.map((x, j) => (j === i ? { ...x, status: s } : x)));
  const all = s => setList(l => l.map(x => ({ ...x, status: s })));
  const readOnly = locked && user.role !== 'admin';
  const n = s => list.filter(x => x.status === s).length, un = list.filter(x => !x.status).length;
  const save = async () => {
    if (un && !confirm(`${un} student(s) are still unmarked and will not be saved. Save anyway?`)) return;
    setBusy(true);
    try {
      const r = await api('/api/attendance', { method: 'POST', body: { date, session, room,
        records: list.filter(x => x.status).map(x => ({ enrollment_no: x.enrollment_no, subject_code: x.subject_code, status: x.status })) } });
      setMsg({ ok: true, t: `Saved ${r.saved} records` }); loadRooms();
    } catch (e) { setMsg({ t: e.message }); }
    setBusy(false);
  };
  const shown = list.map((s, i) => [s, i]).filter(([s]) => !q || (s.enrollment_no + s.name).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="pb-48">
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        <select className={sel} value={date} onChange={e => setDate(e.target.value)}><option value="">Exam date…</option>{dates.map(d => <option key={d} value={d}>{fmt(d)}</option>)}</select>
        <select className={sel} value={session} onChange={e => setSession(e.target.value)} disabled={!date}><option value="">Session…</option>{sessions.map(s => <option key={s}>{s}</option>)}</select>
        <select className={sel} value={room} onChange={e => setRoom(e.target.value)} disabled={!session}><option value="">Room…</option>
          {rooms.map(r => <option key={r.room} value={r.room}>{r.room} ({r.marked}/{r.total} marked){r.locked ? ' 🔒' : ''}</option>)}</select>
      </div>
      {room && <div className="px-3"><input className={sel} placeholder="Search enrollment no. or name" value={q} onChange={e => setQ(e.target.value)} /></div>}
      {locked && <p className="m-3 rounded-lg bg-amber-100 p-2 text-sm text-amber-800">This room is locked{readOnly ? ' — view only. Ask an admin to unlock.' : ' (you are admin, edits allowed).'}</p>}
      <ul className="mt-3">
        {shown.map(([s, i]) => (
          <li key={s.enrollment_no + s.subject_code} className="flex items-center justify-between gap-3 border-b bg-white px-3 py-2">
            <div className="min-w-0">
              <div className="font-mono text-base font-semibold">{s.enrollment_no}</div>
              <div className="truncate text-[11px] leading-tight text-slate-500">{s.name} · {s.subject_code}</div>
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-lg border">
              {['Present', 'Absent'].map(v => (
                <button key={v} disabled={readOnly} onClick={() => set(i, v)}
                  className={'h-11 w-[4.5rem] text-xs font-semibold ' + (s.status === v ? (v === 'Present' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-white text-slate-500')}>{v}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {room && (
        <div className="fixed inset-x-0 bottom-0 space-y-2 border-t bg-white p-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="flex justify-between text-sm">
            <span><b className="text-green-700">{n('Present')}</b> present · <b className="text-red-700">{n('Absent')}</b> absent · <b>{un}</b> unmarked</span>
            {msg && <span className={msg.ok ? 'text-green-700' : 'text-red-600'}>{msg.t}</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={readOnly} onClick={() => all('Present')} className={btn + ' bg-green-100 text-green-800'}>Mark All Present</button>
            <button disabled={readOnly} onClick={() => all('Absent')} className={btn + ' bg-red-100 text-red-800'}>Mark All Absent</button>
          </div>
          <button disabled={readOnly || busy} onClick={save} className={btn + ' w-full bg-indigo-600 py-3.5 text-base text-white'}>{busy ? 'Saving…' : 'Save Attendance'}</button>
        </div>
      )}
    </div>
  );
}

function Report() {
  const [dates, setDates] = useState([]), [date, setDate] = useState(''), [d, setD] = useState(null), [open, setOpen] = useState(null);
  useEffect(() => { api('/api/dates').then(x => { setDates(x); if (x.length) setDate(x[0]); }); }, []);
  const load = () => date && api('/api/report?date=' + date).then(setD);
  useEffect(() => { setD(null); load(); }, [date]);
  const dl = async f => {
    const r = await api(`/api/report/export?date=${date}&format=${f}`, { raw: true }), a = document.createElement('a');
    a.href = URL.createObjectURL(await r.blob()); a.download = `attendance_${date}.${f}`; a.click();
  };
  const lock = async x => { await api('/api/admin/lock', { method: 'POST', body: { date, session: x.session, room: x.room, locked: !x.locked } }); load(); };
  const tot = k => (d ? d.summary.reduce((a, x) => a + x[k], 0) : 0);
  return (
    <div className="space-y-3 p-3">
      <div className="flex gap-2">
        <select className={sel} value={date} onChange={e => setDate(e.target.value)}>{dates.map(x => <option key={x} value={x}>{fmt(x)}</option>)}</select>
        <button onClick={() => dl('xlsx')} className={btn + ' bg-emerald-600 text-white'}>Excel</button>
        <button onClick={() => dl('csv')} className={btn + ' bg-slate-700 text-white'}>CSV</button>
      </div>
      {d && (<>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[['Total', 'total', ''], ['Present', 'present', 'text-green-700'], ['Absent', 'absent', 'text-red-700'], ['Unmarked', 'notMarked', 'text-amber-700']].map(([l, k, c]) =>
            <div key={k} className="rounded-xl bg-white p-2 shadow-sm"><div className={'text-xl font-bold ' + c}>{tot(k)}</div>{l}</div>)}
        </div>
        {d.summary.map(x => {
          const key = x.session + x.room, absent = d.rows.filter(r => r.Session === x.session && r['Room No'] === x.room);
          return (
            <div key={key} className="rounded-xl bg-white shadow-sm">
              <div className="flex items-center justify-between p-3" onClick={() => setOpen(open === key ? null : key)}>
                <div><div className="font-semibold">{x.room} <span className="text-xs font-normal text-slate-500">{x.session}</span></div>
                  <div className="text-xs"><span className="text-green-700">{x.present}P</span> · <span className="text-red-700">{x.absent}A</span> · <span className="text-amber-700">{x.notMarked} unmarked</span> / {x.total}</div></div>
                <button onClick={e => { e.stopPropagation(); lock(x); }} className="rounded-lg border px-3 py-2 text-xs">{x.locked ? '🔒 Unlock' : 'Lock'}</button>
              </div>
              {open === key && <ul className="border-t px-3 py-2 text-xs">{absent.length ? absent.map(r => <li key={r['Enrollment No'] + r['Subject Code']} className="flex justify-between py-0.5"><span className="font-mono">{r['Enrollment No']} · {r.Name}</span><span>{r['Attendance Status']}</span></li>) : <li>Everyone present.</li>}</ul>}
            </div>
          );
        })}
      </>)}
    </div>
  );
}

function Upload({ label, path, hint }) {
  const [r, setR] = useState(null), [busy, setBusy] = useState(false);
  const go = async e => {
    const f = e.target.files[0]; if (!f) return; setBusy(true); const fd = new FormData(); fd.append('file', f);
    try { setR(await api(path, { method: 'POST', body: fd })); } catch (x) { setR({ error: x.message }); }
    setBusy(false); e.target.value = '';
  };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="font-semibold">{label}</h3><p className="mb-2 text-xs text-slate-500">{hint}</p>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={go} disabled={busy} className="text-sm" />
      {busy && <p className="mt-2 text-sm">Importing…</p>}
      {r && <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-50 p-2 text-xs">{JSON.stringify(r, null, 1)}</pre>}
    </div>
  );
}

function Admin() {
  const [f, setF] = useState({ username: '', name: '', password: '', role: 'invigilator' }), [m, setM] = useState('');
  const add = async () => { try { await api('/api/admin/users', { method: 'POST', body: f }); setM('User created'); setF({ ...f, username: '', name: '', password: '' }); } catch (e) { setM(e.message); } };
  return (
    <div className="space-y-3 p-3">
      <Upload label="1. Student data" path="/api/admin/import/students" hint="Std_Data sheet: Roll_No/Enrollment No, Name, Course_Name/Program, Section, Subject_Code, Subject_Name, Exam_Date, Session." />
      <Upload label="2. Seating plan" path="/api/admin/import/seating" hint="Room-wise workbook (one sheet per room, like 05-10-2026_Evening.xlsx), or a flat sheet that also has a Room No column. Re-uploading a date+session replaces its seating; saved attendance is kept." />
      <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Add user</h3>
        {['username', 'name', 'password'].map(k => <input key={k} className={sel} placeholder={k} type={k === 'password' ? 'password' : 'text'} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />)}
        <select className={sel} value={f.role} onChange={e => setF({ ...f, role: e.target.value })}><option value="invigilator">Invigilator</option><option value="admin">Admin</option></select>
        <button onClick={add} className={btn + ' w-full bg-indigo-600 text-white'}>Create user</button>{m && <p className="text-sm">{m}</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => (token ? JSON.parse(localStorage.getItem('user') || 'null') : null)), [tab, setTab] = useState('mark');
  if (!user) return <Login onDone={setUser} />;
  const tabs = user.role === 'admin' ? [['mark', 'Mark'], ['report', 'Report'], ['admin', 'Admin']] : [['mark', 'Mark']];
  return (
    <div className="mx-auto max-w-3xl">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-indigo-700 px-3 py-2 text-white" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <div className="flex gap-1">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={'rounded-md px-3 py-2 text-sm ' + (tab === k ? 'bg-white/25 font-semibold' : '')}>{l}</button>)}</div>
        <button className="text-xs" onClick={() => { localStorage.clear(); location.reload(); }}>{user.name} · Log out</button>
      </header>
      {tab === 'mark' && <Mark user={user} />}{tab === 'report' && <Report />}{tab === 'admin' && <Admin />}
    </div>
  );
}
