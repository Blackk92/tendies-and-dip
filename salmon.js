"use strict";
/* Salmon: purely cosmetic office mascot for the trading floor (added 2026-10-26, comedy only).
   NOT a trader: not in CAST/ORDER/TRADERS, never read from or written to state.json, no roster, leaderboard, awards,
   P&L or Indy comparison, and no trades. Wanders open floor tiles (same blocked/seat grid as everyone else), keeps out of
   the stair openings and never steals their clicks. Drawn with the RimWorld-style vector pawn look (rim_common.js).
   Loaded last; it only wraps RIM.floor.drawPost (draw him) and render (his tag + bubble) and adds a capture click. */
(function () {
if (typeof chars === "undefined" || typeof blocked === "undefined" || typeof astar !== "function" || !window.RIM || !window.RIM.floor) return;
const R_ = window.RIM, P = R_.P;
const LINES = ["TESLA!", "TERAFAB!", "$2600 DIAMOND HANDS \u{1F48E}\u{1F64C}", "Only Tesla and SpaceX!", "TSLA to $2600 a share!"];
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
let last = null;
function tick() {
  const t = now(), dt = last == null ? 0 : Math.min(0.25, t - last); last = t; if (!dt) return;
  const ppl = people();
  if (M.tx == null) { const p = randFree(ppl); if (!p) return; M.tx = p[0]; M.ty = p[1]; M.x = p[0] * TS + 8; M.y = p[1] * TS + 8; M.until = t + 1; }
  // speech bubble: a new line every ~5 s, shown for ~3.4 s
  if (t >= M.nextLine) { M.line = (M.line + 1) % LINES.length; M.bubble = { text: LINES[M.line], until: t + 3.4 }; M.nextLine = t + 5 + Math.random() * 1.5; }
  if (M.bubble && t > M.bubble.until) M.bubble = null;
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
    c2.font = `600 ${bubPx}px ${FONT}`; const txt = M.bubble.text, bw = c2.measureText(txt).width + bubPx * 1.1, bh = bubPx * 1.22 + bubPx * 0.6;
    let bx = Math.round(cx - bw / 2); bx = Math.max(2, Math.min(cv.width - bw - 2, bx));
    let by = Math.round((M.y - 9.5) * SC - bh - bubPx * 0.5), down = false; if (by < 2) { by = ly + h + bubPx * 0.6; down = true; }
    const tx = Math.max(bx + bubPx, Math.min(bx + bw - bubPx, cx));
    c2.shadowColor = "rgba(0,0,0,.28)"; c2.shadowBlur = 3 * D2; c2.shadowOffsetY = 1.2 * D2; c2.fillStyle = "#fffdf5"; c2.beginPath(); c2.roundRect(bx, by, bw, bh, bubPx * 0.5); c2.fill();
    c2.shadowColor = "transparent"; c2.beginPath();
    if (down) { c2.moveTo(tx - bubPx * 0.45, by + 1); c2.lineTo(tx + bubPx * 0.45, by + 1); c2.lineTo(tx, by - bubPx * 0.6); } else { c2.moveTo(tx - bubPx * 0.45, by + bh - 1); c2.lineTo(tx + bubPx * 0.45, by + bh - 1); c2.lineTo(tx, by + bh + bubPx * 0.6); }
    c2.fillStyle = "#fffdf5"; c2.fill(); c2.lineWidth = Math.max(1, D2 * 0.7); c2.strokeStyle = "#2a2620"; c2.stroke();
    c2.beginPath(); c2.roundRect(bx, by, bw, bh, bubPx * 0.5); c2.stroke();
    c2.fillStyle = "#fffdf5"; c2.fillRect(tx - bubPx * 0.4, down ? by + 0.5 : by + bh - 1.5 * D2, bubPx * 0.8, 1.6 * D2);
    c2.fillStyle = "#b3261e"; c2.textAlign = "center"; c2.fillText(txt, bx + bw / 2, by + bh / 2 + 0.5);
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

window.__salmon = { M, LINES, CARD, free, onBlocked: () => M.tx != null && !free(M.tx, M.ty), showCard: showSalmonCard };
})();
