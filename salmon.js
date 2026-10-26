"use strict";
/* Salmon: purely cosmetic office mascot for the trading floor (added 2026-10-26, comedy only).
   NOT a trader: not in CAST/ORDER/TRADERS, never read from or written to state.json, no roster, leaderboard, awards,
   P&L or Indy comparison, and no trades. Wanders open floor tiles (same blocked/seat grid as everyone else), keeps out of
   the stair openings and never steals their clicks. Drawn with the RimWorld-style vector pawn look (rim_common.js).
   Loaded last; it only wraps RIM.floor.drawPost (draw him) and render (his tag + bubble) and adds a capture click.
   2026-10-26 (b): personality + office life. Elon super-fan: always buys, never sells until TSLA $2,600 (a joke; he has no
   account). He reads state READ-ONLY for context (market open/closed, SPY day up/down, CORE trend), walks over to idle
   coworkers to pitch Tesla/SpaceX/Starship/Optimus and they answer in their own voice through social.js (same bubbles +
   Office Chatter log as every other chat); coworkers heckle him back when he passes. He also cheers (never copies) trades. */
(function () {
if (typeof chars === "undefined" || typeof blocked === "undefined" || typeof astar !== "function" || !window.RIM || !window.RIM.floor) return;
const R_ = window.RIM, P = R_.P;
// voice lines live in salmon_lines.json (shared with bin/daily_report.py); these five are the offline fallback
const LINES = ["TESLA!", "TERAFAB!", "$2600 DIAMOND HANDS \u{1F48E}\u{1F64C}", "Only Tesla and SpaceX!", "TSLA to $2600 a share!"];
let V = { general: LINES, red: [], green: [], closed: [], coreUp: [], coreDown: [], trade: [], tradeSell: [], closer: ["Diamond hands \u{1F48E}\u{1F64C}"],
  pitch: { _any: ["{B}! TSLA to $2600, you in?"] }, reply: { _any: ["Paper only, Salmon"] }, heckle: { _any: ["Salmon, ever sold anything?"] }, heckleBack: ["Never. Not until $2600"] };
fetch("salmon_lines.json?v=salmon2", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && Array.isArray(j.general) && j.general.length) V = Object.assign({}, V, j); }).catch(() => { /* keep fallback */ });
const CARD = "Salmon, Mascot, not a trader. Only trades TSLA (and SpaceX). Target: $2,600/share.";
const SPEED = 2.1;                       // tiles per second
const now = () => performance.now() / 1000;
const M = { id: "salmon", tx: null, ty: null, x: 0, y: 0, path: [], face: "S", walkT: 0, until: 0, wait: 0, line: -1, bubble: null, nextLine: 0, moved: 0 };
// stair openings live in the south wall: tiles 11-13 (Research) and 15-17 (Executive); keep him a row clear of them
const nearStairs = (x, y) => y >= 15 && x >= 10 && x <= 18;
const free = (x, y) => x > 0 && y > 2 && x < GW - 1 && y < GH - 1 && !blocked[I(x, y)] && !seat[I(x, y)] && !nearStairs(x, y);
function people() { const s = new Set(); for (const id of ORDER) { const c = chars[id]; if (c && !c.hidden) { s.add(I(c.tx, c.ty)); if (c.path && c.path[0]) s.add(I(c.path[0][0], c.path[0][1])); } }
  const L = window.LIFE; for (const p of (L && L.pets) || []) if (p.tx != null) s.add(I(p.tx, p.ty)); return s; }
function randFree(ppl) { for (let k = 0; k < 300; k++) { const x = 1 + Math.floor(Math.random() * (GW - 2)), y = 3 + Math.floor(Math.random() * (GH - 4)); if (free(x, y) && !ppl.has(I(x, y))) return [x, y]; } return null; }

// ---------------------------------------------------------------- personality: context lines + chats with coworkers (cosmetic, read-only)
const SOC = () => window.__social;
if (typeof COL !== "undefined" && !COL.salmon) COL.salmon = "#f27d52";   // his name colour in Office Chatter / squawk
const rpick = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : "");
const nameOf = (id) => (typeof DISP === "function" ? DISP(id) : String(id).toUpperCase());
const pretty = (id) => { const n = nameOf(id); return n === n.toUpperCase() ? n.split(" ").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ") : n; };
const fillB = (str, id, sym) => String(str || "").replace(/\{B\}/g, pretty(id)).replace(/\{SYM\}/g, sym || "TSLA");
function mood() {   // read-only peek at the published state
  const st = (typeof S !== "undefined" && S) || null, mk = (st && st.market && st.market.status) || "closed";
  const bench = st && st.accounts && st.accounts.bench, sw = st && st.accounts && st.accounts.swing, core = sw && sw.core;
  const day = bench && typeof bench.pnl_today === "number" ? bench.pnl_today : null;   // SPY benchmark's day = "the market today"
  return { open: mk === "open", mk, up: day == null ? null : day >= 0, trend: core && core.enabled ? !!core.trend_on : null };
}
function ownLine() {
  const c = mood(), r = Math.random(), pool = [];
  if (!c.open && r < 0.3) pool.push(...V.closed);
  else if (c.up === false && r < 0.4) pool.push(...V.red);
  else if (c.up === true && r < 0.4) pool.push(...V.green);
  else if (c.trend != null && r < 0.5) pool.push(...(c.trend ? V.coreUp : V.coreDown));
  return rpick(pool.length ? pool : V.general) || rpick(LINES);
}
function salmonSay(text, secs) { M.bubble = { text, until: now() + (secs || 3.6) }; M.nextLine = now() + (secs || 3.6) + 4 + Math.random() * 3;
  const so = SOC(); if (so && so.log) so.log("salmon", text); }
const visible = (id) => { const c = chars[id]; return !!(c && !c.hidden && !(typeof LAID_OFF !== "undefined" && LAID_OFF.has(id))); };
const still = (id) => { const c = chars[id]; return visible(id) && !c.moving && !(c.path && c.path.length); };
const SKIP = new Set(["courier", "salmon"]);
function approach(id, ppl) {   // nearest free tile 1-2 tiles from a coworker that A* can reach
  const c = chars[id]; let best = null;
  for (let r = 1; r <= 2 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = c.tx + dx, y = c.ty + dy; if (!free(x, y) || ppl.has(I(x, y))) continue;
    const d = Math.abs(x - M.tx) + Math.abs(y - M.ty); if (!best || d < best.d) best = { x, y, d };
  }
  if (!best) return null;
  if (best.x === M.tx && best.y === M.ty) return [];
  const p = astar(M.tx, M.ty, best.x, best.y, ppl); return p && p.length && p.every(([x, y]) => free(x, y)) ? p : null;
}
function faceTo(id) { const c = chars[id]; if (!c) return; const dx = c.tx - M.tx, dy = c.ty - M.ty; M.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N"); }
const later = (fn, s) => setTimeout(() => { try { fn(); } catch (e) { /* cosmetic */ } }, s * 1000);
function convo(id) {   // he arrived next to a coworker: pitch -> their reply (social.js talk) -> his closer
  const so = SOC(); M.goal = null; if (!so || !visible(id)) return false;
  faceTo(id); M.chat = { with: id, at: now() }; M.until = now() + 9; M.chats = (M.chats || 0) + 1;
  try { if (typeof amb === "function") amb("salmon", "pitches Tesla to " + pretty(id)); } catch (e) { /* */ }
  salmonSay(fillB(rpick((V.pitch && V.pitch[id]) || []) || rpick(V.pitch._any), id), 4.4);
  later(() => { if (visible(id)) so.talk(id, rpick((V.reply && V.reply[id]) || []) || rpick(V.reply._any), 4.4); }, 2.8);
  later(() => { salmonSay(rpick(V.closer), 3.6); M.chat = null; }, 6.2);
  return true;
}
function shoutSunny() {   // Sunny works the swing book but has no pawn on this floor yet: a shout across the room
  const so = SOC(); if (!so || !so.log) return false;
  salmonSay(rpick(V.pitch.sunny || V.pitch._any).replace(/\{B\}/g, "Sunny"), 4.2);
  later(() => so.log("sunny", rpick(V.reply.sunny || V.reply._any) + " (from the swing desk)"), 2.8);
  return true;
}
function heckle(id) {   // a coworker starts it as he walks by
  const so = SOC(); if (!so || !visible(id)) return false;
  so.talk(id, rpick((V.heckle && V.heckle[id]) || []) || rpick(V.heckle._any), 4); M.lastHeckle = now();
  later(() => { faceTo(id); salmonSay(rpick(V.heckleBack), 3.8); }, 2.4);
  return true;
}
function candidates() { return Object.keys(chars).filter((id) => !SKIP.has(id) && still(id)); }
function busyOffice() { const so = SOC(); return !so || (so.activeBubbles && so.activeBubbles() >= 2) || (so.lunch && so.lunch() && so.lunch().phase === "eating"); }
function planChat(ppl, forced) {
  const ids = forced ? [forced] : candidates().sort(() => Math.random() - 0.5);
  for (const id of ids.slice(0, 6)) {
    if (!still(id)) continue;
    const p = approach(id, ppl); if (p == null) continue;
    M.goal = { id, at: now() }; M.path = p; if (!p.length) convo(id);
    return true;
  }
  return false;
}
M.nextChat = now() + 10 + Math.random() * 8; M.nextHeckle = now() + 30;
function social(t, ppl) {
  if (M.chat || M.goal) return;
  if (t >= M.nextChat && !busyOffice()) {
    M.nextChat = t + 24 + Math.random() * 22;
    if (Math.random() < 0.12 && !visible("sunny")) { shoutSunny(); return; }
    if (planChat(ppl)) return;
  }
  if (t >= M.nextHeckle && !M.path.length && !busyOffice()) {
    const near = candidates().filter((id) => Math.max(Math.abs(chars[id].tx - M.tx), Math.abs(chars[id].ty - M.ty)) <= 2);
    if (near.length) { M.nextHeckle = t + 45 + Math.random() * 40; heckle(rpick(near)); }
  }
}
// trades on the floor: he cheers in Tesla terms (never trades himself, never reads or writes orders)
if (typeof onTrade === "function") {
  const _ot = onTrade;
  onTrade = function (tr) {
    _ot.apply(this, arguments);
    try { if ((typeof STRESS === "undefined" || !STRESS) && tr && tr.symbol && Math.random() < 0.6)
      later(() => { if (!M.chat) salmonSay(fillB(rpick(tr.side === "SELL" ? V.tradeSell : V.trade), "", tr.symbol), 3.6); }, 4.5); } catch (e) { /* */ }
  };
}
let last = null;
function tick() {
  const t = now(), dt = last == null ? 0 : Math.min(0.25, t - last); last = t; if (!dt) return;
  const ppl = people();
  if (M.tx == null) { const p = randFree(ppl); if (!p) return; M.tx = p[0]; M.ty = p[1]; M.x = p[0] * TS + 8; M.y = p[1] * TS + 8; M.until = t + 1; }
  // speech bubble: a new line every ~5 s, shown for ~3.4 s
  if (t >= M.nextLine && !M.chat && !M.goal) { M.line++; M.bubble = { text: ownLine(), until: t + 3.6 }; M.nextLine = t + 6 + Math.random() * 3; }
  if (M.bubble && t > M.bubble.until) M.bubble = null;
  if (M.goal) {   // walking over to someone: give up if they wander off or it takes too long
    const g = chars[M.goal.id];
    if (!g || !visible(M.goal.id) || t - M.goal.at > 20) { M.goal = null; M.path = []; }
    else if (!M.path.length) { if (Math.max(Math.abs(g.tx - M.tx), Math.abs(g.ty - M.ty)) <= 2) convo(M.goal.id); else M.goal = null; }
  }
  social(t, ppl);
  if (M.path.length) {
    const [nx, ny] = M.path[0], gx = nx * TS + 8, gy = ny * TS + 8, dx = gx - M.x, dy = gy - M.y, d = Math.hypot(dx, dy), sp = SPEED * TS * dt;
    if (!free(nx, ny) || (ppl.has(I(nx, ny)) && d > TS * 0.6)) { M.wait += dt; if (M.wait > 1.2) { M.path = []; M.wait = 0; M.until = t + 0.4; } return; }   // someone in the aisle: wait, then re-route
    M.wait = 0; M.walkT += dt; M.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N");
    if (d <= sp) { M.x = gx; M.y = gy; M.tx = nx; M.ty = ny; M.path.shift(); M.moved++; if (!M.path.length) { M.until = t + 0.8 + Math.random() * 2.2; M.face = "S"; } }
    else { M.x += (dx / d) * sp; M.y += (dy / d) * sp; }
    return;
  }
  if (ppl.has(I(M.tx, M.ty))) { for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (free(M.tx + ax, M.ty + ay) && !ppl.has(I(M.tx + ax, M.ty + ay))) { M.path = [[M.tx + ax, M.ty + ay]]; return; } }   // scoot out of the way
  if (t < M.until) return;
  const g = randFree(ppl); if (!g) { M.until = t + 1; return; }
  const path = astar(M.tx, M.ty, g[0], g[1], ppl);
  if (path && path.length && path.every(([x, y]) => free(x, y))) M.path = path; else M.until = t + 0.6;
}
setInterval(() => { try { tick(); } catch (e) { /* mascot must never break the floor */ } }, 50);

// ---------------------------------------------------------------- drawing (logical px, same vector style as the pawns)
const SUIT = "#2f5fb3", SUIT_D = "#244b8f", SKIN = "#f1c9a5", HAWK = "#1d1a17";
function nigiri(a, b, s) {   // rice block + salmon slice with fat stripes
  P.ell(a, b + 0.35 * s, 1.7 * s, 0.95 * s, 0, "#f7f4ec", { lw: 0.22 });
  P.ell(a, b - 0.2 * s, 1.95 * s, 0.85 * s, -0.08, "#f27d52", { lw: 0.22 });
  for (const o of [-0.9, 0, 0.9]) P.line([a + o * s - 0.35 * s, b - 0.75 * s, a + o * s + 0.35 * s, b + 0.3 * s], "rgba(255,240,230,.85)", 0.22 * s);
}
function drawSalmon() {
  if (M.tx == null) return;
  const x = P.ctx(), view = M.face, dir = M.face === "W" ? -1 : 1, side = view === "E" || view === "W", moving = M.path.length > 0;
  let cx = M.x, cy = M.y - 0.4; if (moving) cy -= Math.abs(Math.sin(M.walkT * 9)) * 0.7;
  x.fillStyle = "rgba(20,14,8,.26)"; x.beginPath(); x.ellipse(M.x, M.y + 5.2, 5, 1.5, 0, 0, 7); x.fill();
  // torso: blue suit, white shirt V, red tie, nigiri lapel pin
  const brx = side ? 4.2 : 5.2, bry = 4.6, bx = cx, by = cy + 1.6;
  x.beginPath(); x.ellipse(bx, by, brx, bry, 0, 0, 7);
  P.shadow(() => { x.fillStyle = SUIT; x.fill(); }, 1.4, 0.7, 0.3); x.fillStyle = SUIT; x.fill();
  const gr = x.createRadialGradient(bx - 1.4, by - 1.6, 0.4, bx, by, brx * 1.1); gr.addColorStop(0, "rgba(255,255,255,.2)"); gr.addColorStop(1, "rgba(0,0,0,.2)"); x.fillStyle = gr; x.fill();
  x.lineWidth = 0.45; x.strokeStyle = P.INK; x.stroke();
  if (view !== "N") {
    P.poly([bx - 1.7, by - bry + 0.5, bx, by + 1.6, bx + 1.7, by - bry + 0.5], "#f4f2ec", { lw: 0.25 });
    P.poly([bx - 0.5, by - bry + 1.1, bx + 0.5, by - bry + 1.1, bx + 0.4, by + 0.9, bx, by + 1.5, bx - 0.4, by + 0.9], "#b3261e", { lw: 0.2 });
    P.line([bx - 1.7, by - bry + 0.5, bx - 2.6, by + 0.4], SUIT_D, 0.5); P.line([bx + 1.7, by - bry + 0.5, bx + 2.6, by + 0.4], SUIT_D, 0.5);
    nigiri(bx + (side ? dir * 1.6 : -2.7), by - 0.6, 0.6);   // lapel pin
  } else P.line([bx, by - bry + 0.8, bx, by + bry - 0.8], SUIT_D, 0.45);   // jacket back seam
  // head (shaved sides) + mohawk crest
  const r = 3.9, hy = cy - 2.3, hx = cx + (side ? dir * 0.7 : 0);
  P.shadow(() => P.ell(hx, hy, r, r, 0, SKIN, { stroke: false }), 0.9, 0.3); P.ell(hx, hy, r, r, 0, SKIN, { lw: 0.42 });
  x.save(); x.globalAlpha = 0.18; P.ell(hx, hy - 0.2, r * 0.95, r * 0.9, 0, "#3a2a1a", { stroke: false }); x.restore();   // buzzed sides
  if (view !== "N") { x.fillStyle = "#2a2620"; const ex = side ? [hx + dir * r * 0.5] : [hx - r * 0.38, hx + r * 0.38]; for (const e of ex) { x.beginPath(); x.arc(e, hy + 0.35, 0.42, 0, 7); x.fill(); }
    const mx = side ? hx + dir * r * 0.45 : hx; P.line([mx - 0.9, hy + r * 0.5, mx + 0.9, hy + r * 0.5], "#7a3b2a", 0.35); }
  if (side) { for (let i = 0; i < 5; i++) { const ax = hx - dir * r * 0.75 + dir * i * r * 0.36; P.poly([ax - 0.7, hy - r * 0.72 + Math.abs(i - 2) * 0.12, ax + 0.7, hy - r * 0.72 + Math.abs(i - 2) * 0.12, ax + dir * 0.6, hy - r - 2.1 + Math.abs(i - 2) * 0.35], HAWK, { lw: 0.28 }); } }
  else if (view === "S") { for (let i = -1; i <= 1; i++) P.poly([hx + i * 0.55 - 0.7, hy - r * 0.78, hx + i * 0.55 + 0.7, hy - r * 0.78, hx + i * 0.4, hy - r - 2.4 + Math.abs(i) * 0.6], HAWK, { lw: 0.28 }); P.ell(hx, hy - r * 0.55, 0.95, r * 0.35, 0, HAWK, { lw: 0.25 }); }
  else { P.ell(hx, hy, 1.15, r * 0.98, 0, HAWK, { lw: 0.3 }); for (let i = -2; i <= 2; i++) P.circ(hx, hy + i * r * 0.36, 0.75, HAWK, { shadow: false, lw: 0.2, shade: false }); }
  // he carries a little salmon nigiri around
  if (view !== "N") { const hx2 = cx + (view === "W" ? -5.6 : 5.6), hy2 = cy + 1.6; P.ell(hx2, hy2 + 0.2, 1.4, 1.2, 0, SKIN, { lw: 0.25 }); nigiri(hx2, hy2 - 0.9, 0.85); }
}
const F = R_.floor, _post = F.drawPost;
F.drawPost = function (t) { try { drawSalmon(); } catch (e) { if (!M.err) { M.err = 1; console.warn("salmon draw", e); } } if (_post) return _post.apply(this, arguments); };

// ---------------------------------------------------------------- name tag + bubble (device px, drawn after the main overlay)
const FONT = '"Segoe UI","DejaVu Sans","Helvetica Neue",Arial,sans-serif';
function overlaySalmon() {
  if (M.tx == null) return; const c2 = ctx, D2 = DPR, cssK = SC / D2;
  const tagPx = Math.round(D2 * Math.max(8, Math.min(11, cssK * 4.7))), bubPx = Math.round(D2 * Math.max(8.5, Math.min(12, cssK * 5)));
  c2.save(); c2.setTransform(1, 0, 0, 1, 0, 0); c2.textBaseline = "middle";
  const cx = M.x * SC, nm = "Salmon", mt = "MASCOT";
  c2.font = `600 ${tagPx}px ${FONT}`; const tw = c2.measureText(nm).width; c2.font = `800 ${Math.round(tagPx * 0.72)}px ${FONT}`; const mw = c2.measureText(mt).width + tagPx * 0.6;
  const pad = tagPx * 0.38, h = tagPx * 1.35, w = tw + pad * 2 + mw + pad * 0.5, lx = Math.round(cx - w / 2), ly = Math.round((M.y + 6.3) * SC);
  c2.fillStyle = "rgba(18,16,13,.66)"; c2.beginPath(); c2.roundRect(lx, ly, w, h, h * 0.28); c2.fill();
  c2.fillStyle = "#f27d52"; c2.fillRect(lx + h * 0.28, ly + h - Math.max(1.5, D2), w - h * 0.56, Math.max(1.5, D2));
  c2.textAlign = "left"; c2.font = `600 ${tagPx}px ${FONT}`; c2.fillStyle = "#f3efe6"; c2.fillText(nm, lx + pad, ly + h / 2 + 0.5);
  c2.fillStyle = "#f27d52"; c2.beginPath(); c2.roundRect(lx + pad * 1.5 + tw, ly + h * 0.16, mw, h * 0.68, h * 0.18); c2.fill();
  c2.font = `800 ${Math.round(tagPx * 0.72)}px ${FONT}`; c2.fillStyle = "#2a1208"; c2.textAlign = "center"; c2.fillText(mt, lx + pad * 1.5 + tw + mw / 2, ly + h / 2 + 0.5);
  M.tagRect = { x: lx, y: ly, w, h };
  if (M.bubble) {
    c2.font = `600 ${bubPx}px ${FONT}`; const txt = M.bubble.text, maxW = Math.max(bubPx * 9, Math.min(cv.width * 0.62, bubPx * 19));
    let rows = [txt]; if (c2.measureText(txt).width > maxW) { const ws = txt.split(" "); let a = "", k = 0; for (; k < ws.length; k++) { const n = a ? a + " " + ws[k] : ws[k]; if (c2.measureText(n).width > maxW && a) break; a = n; } rows = [a, ws.slice(k).join(" ")].filter(Boolean); }
    const bw = Math.max(...rows.map((r2) => c2.measureText(r2).width)) + bubPx * 1.1, bh = bubPx * 1.22 * rows.length + bubPx * 0.6;
    let bx = Math.round(cx - bw / 2); bx = Math.max(2, Math.min(cv.width - bw - 2, bx));
    let by = Math.round((M.y - 9.5) * SC - bh - bubPx * 0.5), down = false; if (by < 2) { by = ly + h + bubPx * 0.6; down = true; }
    const tx = Math.max(bx + bubPx, Math.min(bx + bw - bubPx, cx));
    c2.shadowColor = "rgba(0,0,0,.28)"; c2.shadowBlur = 3 * D2; c2.shadowOffsetY = 1.2 * D2; c2.fillStyle = "#fffdf5"; c2.beginPath(); c2.roundRect(bx, by, bw, bh, bubPx * 0.5); c2.fill();
    c2.shadowColor = "transparent"; c2.beginPath();
    if (down) { c2.moveTo(tx - bubPx * 0.45, by + 1); c2.lineTo(tx + bubPx * 0.45, by + 1); c2.lineTo(tx, by - bubPx * 0.6); } else { c2.moveTo(tx - bubPx * 0.45, by + bh - 1); c2.lineTo(tx + bubPx * 0.45, by + bh - 1); c2.lineTo(tx, by + bh + bubPx * 0.6); }
    c2.fillStyle = "#fffdf5"; c2.fill(); c2.lineWidth = Math.max(1, D2 * 0.7); c2.strokeStyle = "#2a2620"; c2.stroke();
    c2.beginPath(); c2.roundRect(bx, by, bw, bh, bubPx * 0.5); c2.stroke();
    c2.fillStyle = "#fffdf5"; c2.fillRect(tx - bubPx * 0.4, down ? by + 0.5 : by + bh - 1.5 * D2, bubPx * 0.8, 1.6 * D2);
    c2.fillStyle = "#b3261e"; c2.textAlign = "center"; rows.forEach((r2, i) => c2.fillText(r2, bx + bw / 2, by + bh / 2 + 0.5 + (i - (rows.length - 1) / 2) * bubPx * 1.22));
    M.bubbleRect = { x: bx, y: by, w: bw, h: bh }; M.bubblesShown = (M.bubblesShown || 0) + (M._lastB !== M.bubble ? 1 : 0); M._lastB = M.bubble;
  }
  c2.restore();
}
const _render = render;
render = function (t) { _render(t); try { overlaySalmon(); } catch (e) { if (!M.err2) { M.err2 = 1; console.warn("salmon overlay", e); } } };

// ---------------------------------------------------------------- click: his mascot card (stairs always win)
function showSalmonCard() {
  const card = document.getElementById("card"), body = document.getElementById("cardBody"); if (!card || !body) return;
  body.innerHTML = '<h3 style="color:#c2410c">Salmon</h3><div><span class="badge" style="background:#f27d52;color:#2a1208">MASCOT, NOT A TRADER</span></div>'
    + '<div style="margin:6px 0">' + CARD.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</div>"
    + '<div class="mut">Joke character. No account, no positions, no simulated trades, no P&amp;L, not on the roster or leaderboard.</div>';
  card.classList.remove("hidden"); try { selected = null; } catch (e) { /* */ }
}
cv.addEventListener("click", (ev) => {
  if (M.tx == null) return;
  const r = cv.getBoundingClientRect(), lx = (ev.clientX - r.left) * (cv.width / r.width) / SC, ly = (ev.clientY - r.top) * (cv.height / r.height) / SC;
  for (const h of HOT) if ((h.id === "phstair" || h.id === "research") && lx >= h.x && lx <= h.x + h.w && ly >= h.y && ly <= h.y + h.h) return;   // never block the stairs
  if (lx >= M.x - 7 && lx <= M.x + 7 && ly >= M.y - 12 && ly <= M.y + 7) { ev.stopImmediatePropagation(); showSalmonCard(); }
}, true);

window.__salmon = { M, LINES, CARD, free, onBlocked: () => M.tx != null && !free(M.tx, M.ty), showCard: showSalmonCard,
  lines: () => V, context: mood, ownLine,
  chatNow(id) { if (!visible(id) || M.tx == null) return false; M.chat = null; M.goal = null; M.path = []; return planChat(people(), id); },
  heckleNow(id) { return heckle(id); } };
})();
