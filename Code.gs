/**
 * SPARKORA FIRE CHALLENGE — Google Sheets backend (Apps Script Web App)
 *
 * Setup (once):
 *  1. Open the Google Sheet → Extensions → Apps Script → paste this whole file → Save.
 *  2. Choose function "setup" in the toolbar → Run → allow permissions.
 *  3. Deploy → New deployment → type: Web app
 *       Execute as: Me   ·   Who has access: Anyone
 *     → Deploy → copy the Web app URL (ends with /exec) into config.js (SHEET_API_URL).
 *  After editing this code later: Deploy → Manage deployments → ✏️ → Version: New version → Deploy
 *  (the /exec URL stays the same).
 *
 * Sheets:
 *  Scores  — one row per submitted score. Type X in "Hide" to remove a rude name from all boards.
 *  Rewards — every reward code issued. Staff can tick "Redeemed" after giving the reward.
 */

const TZ = 'Asia/Jakarta';
const SCORES = 'Scores';
const REWARDS = 'Rewards';
const SCORE_HEADERS = ['Timestamp', 'Day', 'ID', 'Name', 'Score', 'Time (s)', 'Taps', 'Outlet', 'Hide (type X)'];
const REWARD_HEADERS = ['Timestamp', 'Day', 'Code', 'Reward', 'Tier', 'Name', 'Score', 'Outlet', 'Redeemed'];
const CACHE_SECONDS = 5;     // many TVs/phones reading at once → the sheet is read at most every 5 s
const MAX_SCORE = 8000;      // anything above is rejected as fake

function setup() {
  sheet_(SCORES, SCORE_HEADERS);
  const r = sheet_(REWARDS, REWARD_HEADERS);
  r.getRange('I2:I').insertCheckboxes();
  SpreadsheetApp.getActive().setSpreadsheetTimeZone(TZ);
}

function doGet(e) { return handle_((e && e.parameter) || {}); }
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'Bad JSON' }); }
  return handle_(body);
}

function handle_(p) {
  try {
    switch (p.action) {
      case 'board':  return out_(board_(p));
      case 'add':    return out_(add_(p));
      case 'reward': return out_(reward_(p));
      case 'ping':   return out_({ ok: true, time: new Date().toISOString() });
      default:       return out_({ ok: false, error: 'Unknown action' });
    }
  } catch (err) {
    return out_({ ok: false, error: String((err && err.message) || err) });
  }
}

/* ---------------- read: top N + total + latest (+ rank of one id) ---------------- */
function board_(p) {
  const scope = p.scope === 'all' ? 'all' : 'today';
  const limit = Math.max(1, Math.min(50, parseInt(p.limit, 10) || 10));
  const outlet = clean_(p.outlet, 40);
  const cache = CacheService.getScriptCache();
  const key = ['b', cache.get('ver') || '0', scope, outlet, limit, today_()].join('|');

  if (!p.id) { const hit = cache.get(key); if (hit) return JSON.parse(hit); }

  const rows = readScores_().filter(r => !r.hidden && (!outlet || r.outlet === outlet) && (scope === 'all' || r.day === today_()));
  let latest = null;
  rows.forEach(r => { if (!latest || r.ts > latest.ts) latest = r; });
  rows.sort((a, b) => (b.score - a.score) || ((a.time == null ? 1e9 : a.time) - (b.time == null ? 1e9 : b.time)) || (a.ts - b.ts));

  const res = { ok: true, top: rows.slice(0, limit).map(pub_), total: rows.length, latest: latest ? pub_(latest) : null };
  if (p.id) { const i = rows.findIndex(r => r.id === String(p.id)); res.rank = i < 0 ? -1 : i + 1; }
  else cache.put(key, JSON.stringify(res), CACHE_SECONDS);
  return res;
}

/* ---------------- write: one score ---------------- */
function add_(p) {
  const id = String(p.id || '');
  if (!/^[A-Za-z0-9]{6,24}$/.test(id)) throw new Error('Bad id');
  const score = Math.round(Number(p.score));
  if (!(score >= 0 && score <= MAX_SCORE)) throw new Error('Score out of range');
  const time = p.time === null || p.time === '' || p.time === undefined ? '' : Number(p.time);
  if (time !== '' && !(time >= 3 && time <= 120)) throw new Error('Time out of range');
  const taps = Math.round(Number(p.taps) || 0);
  if (!(taps >= 0 && taps <= 1000)) throw new Error('Taps out of range');
  const name = clean_(p.name, 16) || 'SPARKORA FAN';
  const outlet = clean_(p.outlet, 40);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_(SCORES, SCORE_HEADERS);
    const last = sh.getLastRow();
    if (last > 1) {   // ignore double-submits of the same game
      const n = Math.min(200, last - 1);
      const ids = sh.getRange(last - n + 1, 3, n, 1).getValues().map(r => String(r[0]));
      if (ids.indexOf(id) >= 0) return { ok: true, duplicate: true };
    }
    const now = new Date();
    sh.appendRow([now, Utilities.formatDate(now, TZ, 'yyyy-MM-dd'), id, name, score, time, taps, outlet, '']);
    CacheService.getScriptCache().put('ver', String(now.getTime()), 21600);   // invalidate cached boards
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/* ---------------- write: reward code log ---------------- */
function reward_(p) {
  const code = clean_(p.code, 20);
  if (!/^[A-Z0-9-]{4,20}$/.test(code)) throw new Error('Bad code');
  const now = new Date();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_(REWARDS, REWARD_HEADERS);
    sh.appendRow([now, Utilities.formatDate(now, TZ, 'yyyy-MM-dd'), code, clean_(p.reward, 40), clean_(p.tier, 40),
      clean_(p.name, 16), Math.round(Number(p.score) || 0), clean_(p.outlet, 40), false]);
    sh.getRange(sh.getLastRow(), 9).insertCheckboxes();
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/* ---------------- helpers ---------------- */
function readScores_() {
  const sh = sheet_(SCORES, SCORE_HEADERS);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 9).getValues().map(v => {
    const ts = v[0] instanceof Date ? v[0] : new Date(v[0]);
    return {
      ts: ts.getTime(),
      day: Utilities.formatDate(ts, TZ, 'yyyy-MM-dd'),
      id: String(v[2]),
      name: String(v[3]),
      score: Number(v[4]) || 0,
      time: v[5] === '' || v[5] === null ? null : Number(v[5]),
      taps: Number(v[6]) || 0,
      outlet: String(v[7] || ''),
      hidden: v[8] === true || (typeof v[8] === 'string' && v[8].trim() !== '')   // 'X' or a ticked checkbox
    };
  }).filter(r => r.id && !isNaN(r.ts));
}
function pub_(r) { return { id: r.id, name: r.name, score: r.score, time: r.time, created_at: new Date(r.ts).toISOString() }; }
function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function clean_(s, max) {
  // strip control chars and leading formula characters (= + - @) so names can't run spreadsheet formulas
  return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').replace(/^[\s=+\-@]+/, '').trim().slice(0, max);
}
function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#F26B2C').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
