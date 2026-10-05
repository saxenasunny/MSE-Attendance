require('dotenv').config();
const fs = require('fs'), path = require('path');
const express = require('express'), cors = require('cors'), mysql = require('mysql2/promise'), jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'), multer = require('multer'), XLSX = require('xlsx');
const { parseStudents, parseSeating } = require('./parse');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const clean = s => (typeof s === 'string' ? s.trim().replace(/^['"]|['"]$/g, '') : s);

function extractDbFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url.replace(/^mysql:\/\//i, 'http://'));
    const p = u.pathname.replace(/^\/+/, '').split('?')[0].trim();
    return p || null;
  } catch {
    return null;
  }
}

const dbUrl = clean(process.env.DATABASE_URL || process.env.MYSQL_URL);
const isSSL = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';
const sslOption = isSSL ? { rejectUnauthorized: false } : undefined;

const hasIndividual = Boolean(process.env.DB_HOST && process.env.DB_USER);
let targetDb = (hasIndividual ? clean(process.env.DB_NAME) : null) || extractDbFromUrl(dbUrl) || clean(process.env.DB_NAME) || 'test';

let pool;
if (hasIndividual) {
  const host = clean(process.env.DB_HOST);
  const port = +clean(process.env.DB_PORT) || 4000;
  const user = clean(process.env.DB_USER);
  const pass = clean(process.env.DB_PASSWORD) || '';
  console.log(`Using individual DB config: host=${host}, port=${port}, user=${user}, database=${targetDb}, passwordLength=${pass.length}`);
  pool = mysql.createPool({
    host,
    port,
    user,
    password: pass,
    database: targetDb,
    connectionLimit: 10,
    dateStrings: true,
    ssl: sslOption
  });
} else if (dbUrl) {
  let maskedUrl = dbUrl.replace(/:([^@]+)@/, ':***@');
  try {
    const parsed = new URL(dbUrl.replace(/^mysql:\/\//i, 'http://'));
    maskedUrl = `mysql://${parsed.username}:${parsed.password ? '***(len ' + parsed.password.length + ')' : '(EMPTY)'}@${parsed.host}${parsed.pathname}`;
  } catch {}
  console.log(`Using DATABASE_URL: ${maskedUrl}`);
  pool = mysql.createPool({
    uri: dbUrl,
    database: targetDb,
    connectionLimit: 10,
    dateStrings: true,
    ...(sslOption ? { ssl: sslOption } : {})
  });
} else {
  console.log(`Using local fallback database: localhost:3306/${targetDb}`);
  pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: targetDb,
    connectionLimit: 10,
    dateStrings: true,
    ssl: sslOption
  });
}

const app = express();
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean)
  : null;

app.use(cors({
  origin: corsOrigins && corsOrigins.length ? corsOrigins : true,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25e6 } });
const h = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: e.message }); });
const auth = (...roles) => (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').slice(7), SECRET); }
  catch { return res.status(401).json({ error: 'Please log in again' }); }
  if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Not allowed' });
  next();
};
const JA = 'LEFT JOIN attendance a ON a.exam_date=s.exam_date AND a.session=s.session AND a.enrollment_no=s.enrollment_no AND a.subject_code=s.subject_code';

app.get(['/', '/health'], (q, r) => r.json({ ok: true, status: 'healthy', uptime: process.uptime() }));
app.post('/api/login', h(async (req, res) => {
  const { username, password } = req.body;
  const [[u]] = await pool.query('SELECT * FROM users WHERE username=?', [username || '']);
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) return res.status(401).json({ error: 'Invalid username or password' });
  res.json({ token: jwt.sign({ id: u.id, role: u.role, name: u.name }, SECRET, { expiresIn: '12h' }), user: { name: u.name, role: u.role } });
}));

// ---- Invigilator flow: date -> session -> room -> roster
app.get('/api/dates', auth(), h(async (req, res) => {
  const [rows] = await pool.query('SELECT DISTINCT exam_date d FROM exam_seating ORDER BY d');
  let dates = rows.map(x => x.d);
  if (req.user.role !== 'admin' && req.query.all !== 'true') {
    const today = req.query.today || new Date().toISOString().slice(0, 10);
    dates = dates.filter(d => d >= today);
  }
  // Cache for 30 seconds — dates rarely change during an exam session
  res.set('Cache-Control', 'private, max-age=30');
  res.json(dates);
}));
app.get('/api/sessions', auth(), h(async (q, r) => {
  // Cache for 30 seconds — sessions are stable once seating is uploaded
  r.set('Cache-Control', 'private, max-age=30');
  r.json((await pool.query('SELECT DISTINCT session s FROM exam_seating WHERE exam_date=? ORDER BY s', [q.query.date]))[0].map(x => x.s));
}));
app.get('/api/rooms', auth(), h(async (q, r) => {
  const [rows] = await pool.query(`SELECT s.room_no room, COUNT(*) total, COUNT(a.enrollment_no) marked, MAX(l.room_no IS NOT NULL) locked
    FROM exam_seating s ${JA} LEFT JOIN room_locks l ON l.exam_date=s.exam_date AND l.session=s.session AND l.room_no=s.room_no
    WHERE s.exam_date=? AND s.session=? GROUP BY s.room_no ORDER BY s.room_no`, [q.query.date, q.query.session]);
  // Cache for 5 seconds — marked count updates frequently, but a tiny cache avoids rapid duplicate calls
  r.set('Cache-Control', 'private, max-age=5');
  r.json(rows);
}));
app.get('/api/roster', auth(), h(async (q, r) => {
  const { date, session, room } = q.query;
  // Single query: fetch students + lock status together to avoid two round-trips
  const [students] = await pool.query(
    `SELECT s.enrollment_no, s.name, s.program, s.section, s.subject_code, s.subject_name,
      COALESCE(s.seat_order, 0) seat_order, a.status,
      (SELECT COUNT(*) FROM room_locks rl WHERE rl.exam_date=s.exam_date AND rl.session=s.session AND rl.room_no=s.room_no) AS is_locked
    FROM exam_seating s ${JA}
    WHERE s.exam_date=? AND s.session=? AND s.room_no=? ORDER BY s.enrollment_no`,
    [date, session, room]
  );
  const locked = students.length > 0 && students[0].is_locked > 0;
  // Strip is_locked field from each student object before returning
  const clean = students.map(({ is_locked, ...rest }) => rest);
  r.json({ students: clean, locked });
}));
// Upsert on the (date, session, enrollment, subject) key: no duplicates, re-save simply updates.
app.post('/api/attendance', auth(), h(async (req, res) => {
  const { date, session, room, records } = req.body;
  const [lk] = await pool.query('SELECT 1 FROM room_locks WHERE exam_date=? AND session=? AND room_no=?', [date, session, room]);
  if (lk.length && req.user.role !== 'admin') return res.status(423).json({ error: 'This room is locked. Ask an admin to unlock it.' });
  const [seats] = await pool.query('SELECT enrollment_no,subject_code FROM exam_seating WHERE exam_date=? AND session=? AND room_no=?', [date, session, room]);
  const ok = new Set(seats.map(s => s.enrollment_no + '|' + s.subject_code));
  const rows = (records || []).filter(x => ok.has(x.enrollment_no + '|' + x.subject_code) && ['Present', 'Absent'].includes(x.status))
    .map(x => [date, session, room, x.enrollment_no, x.subject_code, x.status, req.user.id]);
  if (rows.length) await pool.query('INSERT INTO attendance (exam_date,session,room_no,enrollment_no,subject_code,status,marked_by) VALUES ? ON DUPLICATE KEY UPDATE status=VALUES(status),room_no=VALUES(room_no),marked_by=VALUES(marked_by)', [rows]);
  res.json({ saved: rows.length });
}));

// ---- Date-wise report + export
const reportRows = async d => (await pool.query(`SELECT s.enrollment_no 'Enrollment No',s.name 'Name',s.program 'Program',s.section 'Section',s.subject_code 'Subject Code',
  s.subject_name 'Subject Name',DATE_FORMAT(s.exam_date,'%d-%m-%Y') 'Exam Date',s.session 'Session',s.room_no 'Room No',COALESCE(a.status,'Not Marked') 'Attendance Status'
  FROM exam_seating s ${JA} WHERE s.exam_date=? ORDER BY s.session,s.room_no,s.enrollment_no`, [d]))[0];
app.get('/api/report', auth('admin'), h(async (q, r) => {
  const rows = await reportRows(q.query.date);
  const [locks] = await pool.query('SELECT session,room_no FROM room_locks WHERE exam_date=?', [q.query.date]);
  const lk = new Set(locks.map(l => l.session + '|' + l.room_no)), m = {};
  for (const x of rows) {
    const k = x.Session + '|' + x['Room No'];
    const e = m[k] ||= { session: x.Session, room: x['Room No'], total: 0, present: 0, absent: 0, notMarked: 0, locked: lk.has(k) };
    e.total++; x['Attendance Status'] === 'Present' ? e.present++ : x['Attendance Status'] === 'Absent' ? e.absent++ : e.notMarked++;
  }
  r.json({ summary: Object.values(m), rows: rows.filter(x => x['Attendance Status'] !== 'Present') });
}));
app.get('/api/report/export', auth('admin'), h(async (q, res) => {
  const { date, format } = q.query, rows = await reportRows(date);
  const ws = XLSX.utils.json_to_sheet(rows);
  if (format === 'csv') return res.type('text/csv').send(XLSX.utils.sheet_to_csv(ws));
  const wb = XLSX.utils.book_new(), by = {};
  XLSX.utils.book_append_sheet(wb, ws, 'All Rooms');
  for (const x of rows) (by[`${x.Session[0]}-${x['Room No']}`.slice(0, 31)] ||= []).push(x);
  for (const k in by) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(by[k]), k);
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}));

// ---- Admin: imports, locks, users
async function bulk(conn, sql, rows) { for (let i = 0; i < rows.length; i += 1000) await conn.query(sql, [rows.slice(i, i + 1000)]); }
app.post('/api/admin/import/students', auth('admin'), upload.single('file'), h(async (req, res) => {
  const rows = parseStudents(req.file.buffer);
  if (!rows.length) return res.status(400).json({ error: 'No valid rows. Needed columns: Enrollment/Roll No, Name, Program, Section, Subject Code, Subject Name, Exam Date, Session.' });
  const conn = await pool.getConnection();
  try { await conn.beginTransaction(); await bulk(conn, 'INSERT INTO students_master (enrollment_no,name,program,section,subject_code,subject_name,exam_date,session) VALUES ? ON DUPLICATE KEY UPDATE name=VALUES(name),program=VALUES(program),section=VALUES(section),subject_name=VALUES(subject_name)',
    rows.map(r => [r.enrollment_no, r.name, r.program, r.section, r.subject_code, r.subject_name, r.exam_date, r.session])); await conn.commit(); }
  catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  res.json({ imported: rows.length });
}));
app.post('/api/admin/import/seating', auth('admin'), upload.single('file'), h(async (req, res) => {
  const { seats, flat } = parseSeating(req.file.buffer), rows = [...flat], unmatched = [];
  if (seats.length) {   // room-wise grid: enrich enrollment+subject with student details from the master data
    const [m] = await pool.query('SELECT * FROM students_master WHERE exam_date IN (?)', [[...new Set(seats.map(s => s.date))]]);
    const map = new Map(m.map(r => [[r.enrollment_no, r.subject_code, r.exam_date, r.session].join('|'), r]));
    for (const s of seats) {
      const r = map.get([s.enrollment_no, s.subject_code, s.date, s.session].join('|'));
      r ? rows.push({ ...r, room_no: s.room }) : unmatched.push(`${s.enrollment_no} (${s.subject_code}) in ${s.room}`);
    }
  }
  if (!rows.length) return res.status(400).json({ error: 'No seating rows found. Import the student data first, or check the file format.' });
  const pairs = [...new Set(rows.map(r => r.exam_date + '|' + r.session))], conn = await pool.getConnection();
  try {
    await conn.beginTransaction();    // re-importing a date+session replaces its seating; saved attendance is kept
    for (const p of pairs) await conn.query('DELETE FROM exam_seating WHERE exam_date=? AND session=?', p.split('|'));
    const roomCounters = {};
    for (const r of rows) {
      const k = `${r.exam_date}|${r.session}|${r.room_no}`;
      roomCounters[k] = (roomCounters[k] || 0) + 1;
      r.seat_order = roomCounters[k];
    }
    await bulk(conn, 'INSERT INTO exam_seating (enrollment_no,name,program,section,subject_code,subject_name,exam_date,session,room_no,seat_order) VALUES ? ON DUPLICATE KEY UPDATE room_no=VALUES(room_no),seat_order=VALUES(seat_order)',
      rows.map(r => [r.enrollment_no, r.name, r.program, r.section, r.subject_code, r.subject_name, r.exam_date, r.session, r.room_no, r.seat_order || 0]));
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  res.json({ seated: rows.length, sessions: pairs, unmatched: unmatched.length, unmatchedSample: unmatched.slice(0, 20) });
}));
app.post('/api/admin/lock', auth('admin'), h(async (req, res) => {
  const { date, session, room, locked } = req.body;
  await pool.query(locked ? 'INSERT IGNORE INTO room_locks (exam_date,session,room_no) VALUES (?,?,?)' : 'DELETE FROM room_locks WHERE exam_date=? AND session=? AND room_no=?', [date, session, room]);
  res.json({ ok: true });
}));

app.post('/api/admin/lock-all', auth('admin'), h(async (req, res) => {
  const { date, session, locked } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  if (locked) {
    let sql = 'SELECT DISTINCT exam_date, session, room_no FROM exam_seating WHERE exam_date=?';
    const params = [date];
    if (session) {
      sql += ' AND session=?';
      params.push(session);
    }
    const [rooms] = await pool.query(sql, params);
    if (rooms.length) {
      const rows = rooms.map(r => [r.exam_date, r.session, r.room_no]);
      await pool.query('INSERT IGNORE INTO room_locks (exam_date, session, room_no) VALUES ?', [rows]);
    }
    res.json({ ok: true, count: rooms.length, locked: true });
  } else {
    let sql = 'DELETE FROM room_locks WHERE exam_date=?';
    const params = [date];
    if (session) {
      sql += ' AND session=?';
      params.push(session);
    }
    await pool.query(sql, params);
    res.json({ ok: true, unlocked: true });
  }
}));
app.get('/api/admin/users', auth('admin'), h(async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, name, role FROM users ORDER BY role, username');
  res.json(rows);
}));
app.post('/api/admin/users', auth('admin'), h(async (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || password.length < 6) return res.status(400).json({ error: 'Username and a password of 6+ characters are required' });
  try { await pool.query('INSERT INTO users (username,password_hash,name,role) VALUES (?,?,?,?)', [username, await bcrypt.hash(password, 10), name || username, role === 'admin' ? 'admin' : 'invigilator']); }
  catch (e) { if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username already exists' }); throw e; }
  res.json({ ok: true });
}));

// Admin can reset/change password for any user
app.post('/api/admin/reset-password', auth('admin'), h(async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'User ID and a new password of 6+ characters are required' });
  }
  const [[u]] = await pool.query('SELECT id, username FROM users WHERE id=?', [userId]);
  if (!u) return res.status(404).json({ error: 'User not found' });
  await pool.query('UPDATE users SET password_hash=? WHERE id=?', [await bcrypt.hash(newPassword, 10), userId]);
  res.json({ ok: true, message: `Password for "${u.username}" updated successfully!` });
}));

// Only admin can change password
app.post('/api/change-password', auth('admin'), h(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  const [[u]] = await pool.query('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (!(await bcrypt.compare(currentPassword || '', u.password_hash))) return res.status(400).json({ error: 'Current password is incorrect' });
  await pool.query('UPDATE users SET password_hash=? WHERE id=?', [await bcrypt.hash(newPassword, 10), req.user.id]);
  res.json({ ok: true, message: 'Password updated successfully' });
}));

(async () => {
  // Ensure we are inside a database
  try {
    await pool.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\``);
  } catch {}
  try {
    await pool.query(`USE \`${targetDb}\``);
  } catch (err) {
    if (targetDb !== 'test') {
      console.warn(`Could not switch to '${targetDb}', falling back to 'test'...`);
      await pool.query('USE `test`');
      targetDb = 'test';
    } else {
      throw err;
    }
  }

  for (const st of fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8').split(';').map(s => s.trim()).filter(Boolean)) await pool.query(st);
  try { await pool.query('ALTER TABLE exam_seating ADD COLUMN seat_order INT DEFAULT 0'); } catch {}
  const [[c]] = await pool.query('SELECT COUNT(*) n FROM users');
  if (!c.n) {
    await pool.query('INSERT INTO users (username,password_hash,name,role) VALUES (?,?,?,?)', [process.env.ADMIN_USERNAME || 'admin', await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10), 'Administrator', 'admin']);
    console.log('Seeded admin user. Set ADMIN_PASSWORD and change it after first login.');
  }
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`API running on port ${port}`));
})().catch(e => {
  console.error('Failed to start server:', e.message);
  console.error('Verify your MySQL connection (DB_HOST/PORT/USER/PASSWORD/NAME or DATABASE_URL, and DB_SSL if required).');
  process.exit(1);
});
