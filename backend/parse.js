// Excel/CSV parsing: flat student sheets and room-wise seating workbooks.
const XLSX = require('xlsx');
const cap = s => { s = String(s || '').trim(); return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s; };
function toDate(v) {
  if (v instanceof Date) return new Date(v.getTime() + 12 * 36e5).toISOString().slice(0, 10);
  const s = String(v || '').trim();
  let m = s.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})/); if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : null;
}
const ALIAS = { enrollmentno: 'enrollment_no', enrollment: 'enrollment_no', rollno: 'enrollment_no', name: 'name', studentname: 'name',
  program: 'program', coursename: 'program', section: 'section', subjectcode: 'subject_code', subjectname: 'subject_name',
  examdate: 'exam_date', date: 'exam_date', session: 'session', roomno: 'room_no', room: 'room_no' };
function readFlat(ws) {
  return XLSX.utils.sheet_to_json(ws, { defval: '' }).map(r => {
    const o = {};
    for (const k in r) { const a = ALIAS[String(k).toLowerCase().replace(/[^a-z]/g, '')]; if (a) o[a] = r[k]; }
    for (const k of ['enrollment_no', 'name', 'program', 'section', 'subject_code', 'subject_name', 'room_no']) o[k] = String(o[k] ?? '').trim();
    o.exam_date = toDate(o.exam_date); o.session = cap(o.session); return o;
  }).filter(o => o.enrollment_no && o.exam_date && o.session && o.subject_code);
}
exports.parseStudents = buf => { const wb = XLSX.read(buf, { cellDates: true }); return readFlat(wb.Sheets[wb.SheetNames[0]]); };
exports.parseSeating = buf => {
  const wb = XLSX.read(buf, { cellDates: true }), seats = [], flat = [];
  for (const n of wb.SheetNames) {
    const a = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '' });
    const room = String(a[2]?.[0] || '').match(/^Room:\s*(.+)$/i);
    const dm = String(a[1]?.[0] || '').match(/Date:\s*(\S+)\s*\|\s*Session:\s*(\w+)/i);
    if (room && dm) {                       // room-wise grid sheet: header row 4 holds "Subject (CODE)" per column
      const codes = (a[3] || []).map(h => (String(h).match(/\(([A-Za-z0-9]+)\)\s*$/) || [])[1]);
      const dataRows = a.slice(4);
      // Column-wise order: first column students (top to bottom), then second column, then so on
      for (let colIdx = 0; colIdx < codes.length; colIdx++) {
        const code = codes[colIdx];
        if (!code) continue;
        for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
          const val = dataRows[rowIdx]?.[colIdx];
          const e = String(val ?? '').trim();
          if (/^\d{9,}$/.test(e)) {
            seats.push({ room: room[1].trim(), date: toDate(dm[1]), session: cap(dm[2]), enrollment_no: e, subject_code: code });
          }
        }
      }
    } else if (n !== 'Master Sheet') flat.push(...readFlat(wb.Sheets[n]).filter(o => o.room_no));
  }
  return { seats, flat };
};
