// All demo times are Malaysia local (UTC+08:00, no DST). Stored as epoch ms.
const MYT = 8 * 3600 * 1000;
export const HOUR = 3600 * 1000;
export const MIN = 60 * 1000;
export const DAY = 24 * HOUR;

/** Build an epoch from a Malaysia-local wall clock. month is 1-12. */
export function myt(y: number, m: number, d: number, hh = 0, mm = 0) {
  return Date.UTC(y, m - 1, d, hh, mm) - MYT;
}
function parts(ms: number) {
  const d = new Date(ms + MYT);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay(), h: d.getUTCHours(), mi: d.getUTCMinutes() };
}
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MOL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const fmtTime = (ms: number) => {
  const p = parts(ms);
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${String(h12).padStart(2, '0')}:${String(p.mi).padStart(2, '0')} ${p.h < 12 ? 'AM' : 'PM'}`;
};
export const fmtDate = (ms: number) => { const p = parts(ms); return `${WD[p.wd]}, ${p.d} ${MO[p.m]}`; };
export const fmtDateLong = (ms: number) => { const p = parts(ms); return `${WDL[p.wd]}, ${p.d} ${MOL[p.m]} ${p.y}`; };
export const fmtDateTime = (ms: number) => `${fmtDate(ms)} · ${fmtTime(ms)}`;
export const fmtShort = (ms: number) => { const p = parts(ms); return `${p.d} ${MO[p.m]}`; };
export const weekday = (ms: number) => WD[parts(ms).wd];
export const dayNum = (ms: number) => parts(ms).d;
export const monthLabel = (ms: number) => { const p = parts(ms); return `${MOL[p.m]} ${p.y}`; };
export const startOfDay = (ms: number) => { const p = parts(ms); return myt(p.y, p.m + 1, p.d); };
export const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);
export const startOfWeek = (ms: number) => { const s = startOfDay(ms); const wd = parts(ms).wd; return s - ((wd + 6) % 7) * DAY; };

export function relative(ms: number, now: number) {
  const diff = now - ms;
  if (diff < MIN) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return fmtShort(ms);
}
export function until(ms: number, now: number) {
  const diff = ms - now;
  if (diff <= 0) return 'now';
  if (diff < HOUR) return `in ${Math.ceil(diff / MIN)} min`;
  if (diff < DAY) return `in ${Math.round(diff / HOUR)} h`;
  return `in ${Math.round(diff / DAY)} days`;
}

export const rm = (n: number) => `RM ${n.toFixed(2)}`;
export const rm0 = (n: number) => (n === 0 ? 'Free' : `RM ${Number.isInteger(n) ? n : n.toFixed(2)}`);
export const dist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
/** Given name: "Mei Ling Tan" → "Mei Ling", "Aisyah Rahman" → "Aisyah". */
export const firstName = (n: string) => { const w = n.split(' '); return w.length >= 3 ? w.slice(0, 2).join(' ') : w[0]; };
