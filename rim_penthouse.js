"use strict";
/* Penthouse drawing layer. Same desks, chairs, glass, and stair size as the floors below.
   Light gold room: corner offices, a secretary in front of each, board table in the middle.
   Simulation stays in penthouse.js. */
(function () {
if (!window.RIM || !window.RIM.on) return;
const R_ = window.RIM, P = R_.P;
const { box, circ, ell, line, poly, hex, rug, wallSeg, glassSeg, plant, chair, screen, planks, tiles } = P;
const { wtext, frame, bunting, mug, deskTop } = R_.D;
R_.stairs = [{ tile: 15, label: "TRADING FLOOR", dir: "down", kind: "gold" }];
const X = () => P.ctx(), tx = (n) => n * TS;
const hourF = () => { try { return etNow().h; } catch (e) { return 12; } };
function nightFactor(h) {
  if (h >= 7.5 && h <= 17) return 0;
  if (h > 17 && h < 19.5) return (h - 17) / 2.5;
  if (h >= 5.5 && h < 7.5) return 1 - (h - 5.5) / 2;
  return 1;
}
function skyCols(h) {
  if (h >= 7.5 && h < 16.5) return ["#6eb0e4", "#d5e7f6"];
  if (h >= 16.5 && h < 18.5) return ["#3b4f8f", "#f59e5b"];
  if (h >= 5.5 && h < 7.5) return ["#2d3a6b", "#f2a65a"];
  if (h >= 18.5 && h < 20) return ["#1c2350", "#7a4b7a"];
  return ["#070b1f", "#18214a"];
}
const seated = (id) => { const c = chars[id]; const s = SPOTS[HOME[id]]; return c && s && !c.hidden && c.tx === s.x && c.ty === s.y && !c.moving && !(c.path && c.path.length); };
function glowAt(a, b, r, rgba) {
  const x = X(); x.save(); x.globalCompositeOperation = "lighter";
  const gr = x.createRadialGradient(a, b, 0.5, a, b, r); gr.addColorStop(0, rgba); gr.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = gr; x.fillRect(a - r, b - r, r * 2, r * 2); x.restore();
}
function windowGlass(a, b, w, h, t) {
  const x = X(), hr = hourF(), [top, bot] = skyCols(hr), n = nightFactor(hr), th = theme();
  x.save(); x.beginPath(); x.rect(a, b, w, h); x.clip();
  const gr = x.createLinearGradient(0, b, 0, b + h);
  gr.addColorStop(0, th.weather === "rain" && n < 0.5 ? "#7d8c9a" : top);
  gr.addColorStop(1, th.weather === "rain" && n < 0.5 ? "#b6c0c8" : bot);
  x.fillStyle = gr; x.fillRect(a, b, w, h);
  if (hr >= 7 && hr < 18 && th.weather === "clear") circ(a + w * 0.78, b + 5, 3.2, "#fff3c0", { shadow: false, stroke: false });
  else if (n > 0.6) circ(a + w * 0.18, b + 5, 2, "#f4f1d0", { shadow: false, stroke: false });
  const towers = 14;
  for (let i = 0; i < towers; i++) {
    const bw = w / towers, bh = h * (0.22 + ((i * 17) % 8) / 18);
    x.fillStyle = n > 0.5 ? "#1a2036" : "#6f8496";
    x.fillRect(a + i * bw, b + h - bh, bw - 0.7, bh);
    if (n > 0.25) for (let k = 0; k < 3; k++) { x.fillStyle = `rgba(255,220,140,${0.45 * Math.max(n, 0.35)})`; x.fillRect(a + i * bw + 1.2 + (k % 2) * 2.2, b + h - bh + 2 + k * 2.2, 0.8, 1); }
  }
  if (th.weather === "rain") { x.strokeStyle = "rgba(220,235,255,.7)"; x.lineWidth = 0.35; for (let i = 0; i < 16; i++) { const rx = a + ((i * 11 + t * 30) % w), ry = b + ((i * 5 + t * 55) % h); x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - 1, ry + 2.4); x.stroke(); } }
  if (th.weather === "snow") for (let i = 0; i < 16; i++) circ(a + ((i * 13 + Math.sin(t + i) * 2) % w), b + ((i * 3.7 + t * 6) % h), 0.55, "#fff", { shadow: false, stroke: false, shade: false });
  x.restore();
  line([a + w * 0.33, b, a + w * 0.33, b + h], "#8a6a32", 0.7);
  line([a + w * 0.66, b, a + w * 0.66, b + h], "#8a6a32", 0.7);
}
function officeGlass(wx) {
  const x = tx(wx) + 8, y0 = tx(3), y1 = tx(8), door = tx(6);
  X().fillStyle = "rgba(190,230,255,.22)";
  X().fillRect(x - 4, y0, 8, door - 8 - y0);
  X().fillRect(x - 4, door + 8, 8, y1 - door - 8);
  glassSeg(x, y0, x, door - 8); glassSeg(x, door + 8, x, y1);
  for (let y = 3; y <= 8; y++) if (y !== 6) circ(x, tx(y), 0.9, "#c79a3a", { shadow: false, lw: 0.25 });
}
function carpet(x, y, w, h, fill, edge, dot) {
  box(x, y, w, h, 0, fill, { shadow: false, shade: false, stroke: false });
  const c = X();
  c.strokeStyle = edge; c.lineWidth = 2.4; c.strokeRect(x + 1.3, y + 1.3, w - 2.6, h - 2.6);
  c.strokeStyle = "rgba(255,246,220,.7)"; c.lineWidth = 0.7; c.strokeRect(x + 4.2, y + 4.2, w - 8.4, h - 8.4);
  for (let yy = y + 9; yy < y + h - 5; yy += 11) for (let xx = x + 9; xx < x + w - 5; xx += 11) circ(xx, yy, 0.6, dot, { shadow: false, stroke: false, shade: false });
}
function gilt(a, b, w, h, fill) {
  frame(a, b, w, h, fill, "#c79a3a");
  const c = X(); c.strokeStyle = "#f8e7b0"; c.lineWidth = 0.45; c.strokeRect(a + 1.3, b + 1.3, w - 2.6, h - 2.6);
}
function artAbstract(a, b, w, h) {
  gilt(a, b, w, h, "#1a1208");
  const c = X(); c.save(); c.beginPath(); c.rect(a + 2, b + 2, w - 4, h - 4); c.clip();
  poly([a + 4, b + h - 4, a + w * 0.42, b + 4, a + w * 0.58, b + h - 4], "#c79a3a", { lw: 0.25 });
  poly([a + w * 0.38, b + h - 4, a + w * 0.7, b + 6, a + w - 4, b + h - 4], "#7a1e32", { lw: 0.25 });
  circ(a + w * 0.78, b + 8, 3.6, "#f2c14e", { shadow: false, lw: 0.25 });
  c.restore();
}
function artCity(a, b, w, h) {
  gilt(a, b, w, h, "#10243a");
  const c = X(); c.save(); c.beginPath(); c.rect(a + 2, b + 2, w - 4, h - 4); c.clip();
  c.fillStyle = "#6eb0e4"; c.fillRect(a + 2, b + 2, w - 4, h * 0.42);
  c.fillStyle = "#1a4a78"; c.fillRect(a + 2, b + 2 + h * 0.42, w - 4, h * 0.58);
  box(a + 6, b + 9, 7, h - 14, 0, "#e7c56a", { shadow: false, stroke: false });
  box(a + 15, b + 12, 9, h - 17, 0, "#c79a3a", { shadow: false, stroke: false });
  box(a + 26, b + 7, 6, h - 12, 0, "#f6e2a8", { shadow: false, stroke: false });
  box(a + 34, b + 11, 8, h - 16, 0, "#8d6a2a", { shadow: false, stroke: false });
  c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(a + 2, b + h * 0.55, w - 4, 1.2);
  c.restore();
}
function artStill(a, b, w, h) {
  gilt(a, b, w, h, "#2a160e");
  const c = X(); c.save(); c.beginPath(); c.rect(a + 2, b + 2, w - 4, h - 4); c.clip();
  c.fillStyle = "#3a2014"; c.fillRect(a + 2, b + 2, w - 4, h - 4);
  c.fillStyle = "#5a3018"; c.fillRect(a + 2, b + h * 0.58, w - 4, h * 0.42);
  box(a + 5, b + h * 0.46, 12, 5, 0.3, "#f2c14e", { lw: 0.2 });
  box(a + 6, b + h * 0.44, 10, 2, 0.2, "#ffe9a0", { shadow: false, lw: 0.15 });
  box(a + 22, b + 6, 4.2, 12, 0.3, "#1f6b45", { lw: 0.2 });
  circ(a + 24.1, b + 5.2, 1.5, "#1f6b45", { shadow: false, lw: 0.15 });
  box(a + 28, b + 8, 3.2, 10, 0.3, "#7a1e32", { lw: 0.2 });
  circ(a + w - 12, b + h * 0.48, 3.1, "#a33b3b", { lw: 0.2 });
  circ(a + w - 7, b + h * 0.54, 2.4, "#c45c28", { lw: 0.2 });
  c.restore();
}
function bookPts() {
  const j = window.PHBOOK;
  if (!j || !Array.isArray(j.curve)) return null;
  const pts = j.curve.map((p) => +p.swing).filter((v) => isFinite(v));
  return pts.length >= 2 ? pts : null;
}
function artBook(a, b, w, h) {
  const j = window.PHBOOK, sw = j && j.accounts && j.accounts.swing, eq = sw && +sw.equity, start = sw && +sw.starting_cash;
  const c = X();
  c.save(); c.beginPath(); c.rect(a + 2, b + 2, w - 4, h - 4); c.clip();
  c.fillStyle = "#140e08"; c.fillRect(a + 2, b + 2, w - 4, h - 4);
  const raw = bookPts();
  let pts = null;
  if (isFinite(eq) && raw && Math.abs(raw[raw.length - 1] - eq) / Math.max(eq, 1) < 0.25) pts = raw;
  else if (isFinite(eq) && isFinite(start) && start > 0) pts = [start, eq];
  if (!pts) { c.restore(); wtext("BOOK", a + w / 2, b + h / 2, { size: 3.4, col: "#e7c56a", align: "center", base: "middle", w: 800 }); return; }
  const min = Math.min.apply(null, pts), max = Math.max.apply(null, pts);
  const pad = Math.max(1, (max - min) * 0.45, (eq || max) * 0.0015);
  const lo = min - pad, span = max + pad - lo;
  c.strokeStyle = "rgba(231,197,106,.28)"; c.lineWidth = 0.35;
  c.beginPath(); c.moveTo(a + 4, b + h - 6); c.lineTo(a + w - 4, b + h - 6); c.stroke();
  c.strokeStyle = pts[pts.length - 1] >= pts[0] ? "#3ddc84" : "#ff5c5c"; c.lineWidth = 1.25; c.beginPath();
  pts.forEach((v, i) => {
    const xx = a + 6 + (i / (pts.length - 1)) * (w - 12);
    const yy = b + h - 6 - ((v - lo) / span) * (h - 14);
    i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
  });
  c.stroke(); c.restore();
  wtext(isFinite(eq) ? "$" + Math.round(eq).toLocaleString("en-US") : "SWING", a + w / 2, b + 3.1, { size: 2.7, col: "#f6e2a8", align: "center", base: "top", w: 800, maxW: w - 8, shrink: 2.1 });
}

function drawStatic() {
  const x = X(), rnd = R_.rng(9091), th = theme();
  planks(16, 48, LW - 32, LH - 64, "#9c7650", "rgba(50,30,14,.35)", rnd);
  carpet(32, 50, 80, 74, "#0f8a52", "#f6e2a8", "#e7fff2");
  carpet(320, 50, 80, 74, "#f4e7c8", "#6e2436", "#e7c56a");
  carpet(120, 58, 64, 36, "#1d4ed8", "#f6e2a8", "#dbe7ff");
  carpet(200, 58, 48, 44, "#10243a", "#f6e2a8", "#9bb4d6");
  carpet(144, 164, 96, 56, "#0f9d8e", "#f6e2a8", "#e7fff8");
  carpet(16, 218, 88, 44, "#141c2e", "#f6e2a8", "#9bb0d4");
  carpet(18, 148, 60, 32, "#1e3fbf", "#f6e2a8", "#dbe6ff");
  carpet(322, 148, 60, 32, "#e36a2c", "#fff1c8", "#ffe0c4");
  x.fillStyle = "#6e2436"; x.fillRect(0, 0, LW, 48);
  x.fillStyle = "rgba(255,220,180,.07)"; for (let a = 0; a < LW; a += 12) x.fillRect(a, 3, 0.5, 33);
  x.fillStyle = "#4a1c28"; x.fillRect(0, 36, LW, 12); x.fillStyle = "#e7c56a"; x.fillRect(0, 36, LW, 1.6); x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(0, 46.6, LW, 1.4);
  const wc = "#642433";
  wallSeg(0, 0, LW, 3.2, "#3a1520"); wallSeg(0, 0, 16, LH, wc); wallSeg(LW - 16, 0, 16, LH, wc);
  wallSeg(0, LH - 16, tx(15) - 1, 16, wc); wallSeg(tx(18) + 1, LH - 16, LW - tx(18) - 17, 16, wc);
  artAbstract(20, 7, 50, 26);
  gilt(78, 8, 34, 24, "#9fc6d8");
  gilt(120, 6, 74, 28, "#140e08");
  gilt(202, 8, 34, 24, "#9fc6d8");
  artCity(244, 7, 52, 26);
  gilt(304, 8, 34, 24, "#9fc6d8");
  artStill(346, 7, 50, 26);
  if (th.id) bunting(th.id, 39.2);
  officeGlass(7); officeGlass(18);
  wallSeg(tx(1), tx(8) - 2, tx(6), 11, wc);
  wallSeg(tx(19), tx(8) - 2, tx(6), 11, wc);
  box(54, tx(8) - 8, 36, 7, 1, "#e7c56a", { lw: 0.35 });
  wtext("CHAIR", 72, tx(8) - 4.6, { size: R_.small() ? 4.6 : 3.4, col: "#3a2a10", align: "center", base: "middle", w: 800, maxW: 34 });
  box(344, tx(8) - 8, 32, 7, 1, "#e7c56a", { lw: 0.35 });
  wtext("CEO", 360, tx(8) - 4.6, { size: R_.small() ? 4.8 : 3.5, col: "#3a2a10", align: "center", base: "middle", w: 800 });
  const FACE = { vance: 0, mags: 0, wade: Math.PI / 2, priya: -Math.PI / 2, otto: Math.PI, june: 0, hollis: 0 };
  const CCOL = { vance: "#8d2433", mags: "#1f7a4a", wade: "#1f7a4a", priya: "#a33b3b", otto: "#c79a3a", june: "#f2c14e", hollis: "#1e4b7a" };
  for (const id in CHAIRS) { const [cx, cy] = CHAIRS[id]; chair(tx(cx) + 8, tx(cy) + 9, FACE[id] || 0, CCOL[id] || "#c79a3a"); }
  for (const f of FURN) { const fn = ART[f.type]; try { if (fn && fn.s) fn.s(f); } catch (e) { console.warn("rim ph", f.type, e); } }
}
const ART = {
  cdesk: { s(f) { const px = tx(f.x), py = tx(f.y);
      box(px, py, 48, 15, 2, "#5a2f1c", { blur: 2.4, oy: 1.2 });
      box(px + 2, py + 1.5, 44, 10, 1.4, "#6e3a22", { shadow: false, stroke: "rgba(0,0,0,.35)", lw: 0.3 });
      X().fillStyle = "#c79a3a"; X().fillRect(px + 1, py + 13, 46, 0.7);
      screen(px + 24, py + 7.4, 16, false, "#f2c94c");
      box(px + 15, py + 2.2, 18, 3, 0.6, "#2b2b2b", { shadow: false, lw: 0.25 });
      box(px + 34, py + 8.5, 9, 3, 0.6, "#e7c56a", { lw: 0.3 });
      box(px + 4, py + 3, 8, 5, 0.6, "#3f8f4e", { lw: 0.25 }); box(px + 5, py + 4, 8, 5, 0.6, "#4fa65d", { lw: 0.25 });
      circ(px + 41, py + 4, 2.2, "#c2703a", { lw: 0.3 }); box(px + 40.2, py - 1.4, 1.8, 5, 0.9, "#5f9a52", { lw: 0.25, shadow: false });
      box(px + 44.5, py + 12, 3, 4.5, 0.8, "#6b4423", { lw: 0.25 }); box(px + 47.6, py + 12, 3, 4.5, 0.8, "#5b3a1e", { lw: 0.25 }); },
    d(f) { const px = tx(f.x), py = tx(f.y); if (!seated("vance")) return; screen(px + 24, py + 7.4, 16, true, "#f2c94c"); glowAt(px + 24, py + 4, 14, "rgba(255,210,90,.28)"); } },
  mdesk: { s(f) { const px = tx(f.x), py = tx(f.y);
      box(px, py, 48, 15, 2, "#5a2f1c", { blur: 2.4, oy: 1.2 });
      box(px + 2, py + 1.5, 44, 10, 1.4, "#6e3a22", { shadow: false, stroke: "rgba(0,0,0,.35)", lw: 0.3 });
      X().fillStyle = "#c79a3a"; X().fillRect(px + 1, py + 13, 46, 0.7);
      screen(px + 24, py + 7.4, 16, false, "#3ddc84");
      box(px + 15, py + 2.2, 18, 3, 0.6, "#2b2b2b", { shadow: false, lw: 0.25 });
      box(px + 34, py + 8.5, 9, 3, 0.6, "#e7c56a", { lw: 0.3 });
      box(px + 4, py + 3, 8, 5, 0.6, "#3f8f4e", { lw: 0.25 }); box(px + 5, py + 4, 8, 5, 0.6, "#4fa65d", { lw: 0.25 });
      mug(px + 42, py + 4.5, "#fff"); },
    d(f) { const px = tx(f.x), py = tx(f.y); if (!seated("mags")) return; screen(px + 24, py + 7.4, 16, true, "#3ddc84"); glowAt(px + 24, py + 4, 14, "rgba(61,220,132,.26)"); } },
  sdesk: { s(f) { const px = tx(f.x), py = tx(f.y); deskTop(px, py, 32, "#f1dfe8"); X().fillStyle = "#c79a3a"; X().fillRect(px + 1, py + 11.2, 30, 0.6);
      box(px + 6, py + 2.2, 11, 3, 0.6, "#e7e2ea", { shadow: false, lw: 0.25 }); screen(px + 12, py + 7.2, 13, false, "#f2c14e");
      box(px + 21, py + 8, 7, 2.4, 0.5, "#c79a3a", { lw: 0.25 }); mug(px + 26, py + 4, "#fff");
      for (let i = 0; i < 4; i++) circ(px + 3 + i * 1.2, py + 9.5, 0.45, "#fbf7ee", { shadow: false, lw: 0.12 }); },
    d(f) { const px = tx(f.x), py = tx(f.y); if (!seated(f.who)) return; screen(px + 12, py + 7.2, 13, true, "#f2c14e"); glowAt(px + 12, py + 4, 11, "rgba(242,193,78,.26)"); } },
  btable: { s(f) { const px = tx(f.x), py = tx(f.y), w = tx(f.w), h = tx(f.h);
      box(px + 1, py + 1, w - 2, h - 2, 5, "#c4923a", { blur: 2.2, oy: 1.2 });
      box(px + 4, py + 4, w - 8, h - 8, 3.5, "#f0cb7a", { shadow: false, stroke: "rgba(90,50,10,.35)", lw: 0.35 });
      box(px + 8, py + 7, w - 16, h - 14, 2.2, "#1f9a45", { shadow: false, stroke: "#e7c56a", lw: 0.45 });
      box(px + w / 2 - 6, py + h / 2 - 1, 12, 2.2, 0.4, "#e7c56a", { lw: 0.25 }); },
    d(f) { const px = tx(f.x), py = tx(f.y), w = tx(f.w);
      const pts = [3, 5, 4, 7, 6, 5, 8, 7];
      X().strokeStyle = "#d9ffe4"; X().lineWidth = 0.7; X().beginPath();
      pts.forEach((v, i) => { const xx = px + 14 + i * ((w - 28) / 7), yy = py + 16 - v * 0.7; i ? X().lineTo(xx, yy) : X().moveTo(xx, yy); }); X().stroke(); } },
  bar: { s(f) { const px = tx(f.x), py = tx(f.y), w = tx(f.w);
      box(px + 1, py - 12, w - 2, 14, 0.8, "#3a1c10", { blur: 1.6, stroke: "#c79a3a", lw: 0.35 });
      const cols = ["#7a1f2b", "#1a4a78", "#f2c14e", "#1f6b45", "#c79a3a", "#5a2a6a", "#e7c56a", "#8d2433", "#143d28", "#f6e2a8"];
      for (let i = 0; i < 10; i++) {
        const bx = px + 5 + i * ((w - 14) / 10);
        box(bx, py - 9, 3.1, 8, 0.3, cols[i], { shadow: false, lw: 0.18 });
        circ(bx + 1.55, py - 10.1, 1.05, cols[i], { shadow: false, lw: 0.12 });
      }
      box(px, py + 1, w, 14, 1.1, "#4a2414", { blur: 2.2, oy: 1 });
      box(px + 1.2, py + 2.2, w - 2.4, 5.5, 0.5, "#6b3418", { shadow: false, lw: 0.25 });
      X().fillStyle = "#e7c56a"; X().fillRect(px, py + 1, w, 1.35);
      X().fillStyle = "#8a6420"; X().fillRect(px, py + 13.2, w, 1.1);
      for (let i = 0; i < 6; i++) {
        const gx = px + 8 + i * 12;
        line([gx, py + 5.2, gx + 3.2, py + 5.2], "#d8e6f0", 0.55);
        line([gx + 0.3, py + 5.2, gx + 0.8, py + 8.4], "#d8e6f0", 0.4);
        line([gx + 2.9, py + 5.2, gx + 2.4, py + 8.4], "#d8e6f0", 0.4);
      }
      wtext("BAR", px + w / 2, py + 11.2, { size: 3.6, col: "#f6e2a8", align: "center", base: "middle", w: 800, maxW: w - 8 }); },
    d(f, t) { const px = tx(f.x), py = tx(f.y), w = tx(f.w), party = typeof partyOn === "function" && partyOn();
      if (!party) { circ(px + 18, py - 6, 0.7, "rgba(255,246,200,.7)", { shadow: false, stroke: false, shade: false }); return; }
      for (let i = 0; i < 8; i++) circ(px + 6 + ((i * 11 + t * 16) % (w - 12)), py - 4 - Math.abs(Math.sin(t * 2.2 + i)) * 5, 0.7, i % 2 ? "#fff6c8" : "#f2c14e", { shadow: false, stroke: false, shade: false }); } },
  couch: { s(f) { const px = tx(f.x), py = tx(f.y), w = tx(f.w);
      box(px, py + 2, w, 22, 3.4, "#e7c56a", { blur: 2.4, oy: 1.2 });
      box(px + 1.5, py + 3, w - 3, 7, 2.4, "#f6e2a4", { shadow: false, lw: 0.35 });
      box(px - 1, py + 6, 5, 17, 2, "#c79a3a", { lw: 0.35, blur: 1 });
      box(px + w - 4, py + 6, 5, 17, 2, "#c79a3a", { lw: 0.35, blur: 1 });
      for (let i = 0; i < 3; i++) box(px + 4.5 + i * (w - 9) / 3, py + 11, (w - 9) / 3 - 1, 11, 2, "#f2c14e", { shadow: false, lw: 0.3 }); } },
  bull: { s(f) { const px = tx(f.x), py = tx(f.y);
      box(px + 2, py + 6, 28, 22, 2, "#5a4630", { blur: 2.4, oy: 1.2 });
      box(px + 4, py + 8, 24, 18, 1.4, "#6b5438", { shadow: false, lw: 0.3 });
      ell(px + 15, py + 15, 9.5, 5.5, 0, "#e0b050", { lw: 0.45, shadow: true });
      ell(px + 13, py + 13.6, 6, 2.4, 0, "rgba(255,236,170,.55)", { stroke: false });
      circ(px + 25.5, py + 13, 4, "#c4922a", { lw: 0.4 });
      const x = X(); x.strokeStyle = "#fff1c2"; x.lineWidth = 0.9; x.beginPath();
      x.moveTo(px + 24, py + 10); x.quadraticCurveTo(px + 26, py + 4.5, px + 30, py + 6);
      x.moveTo(px + 24, py + 16); x.quadraticCurveTo(px + 26, py + 21.5, px + 30, py + 20); x.stroke();
      line([px + 5.5, py + 15, px + 2.5, py + 11], "#8a5a20", 0.7);
      wtext("BULLS", px + 16, py + 24.2, { size: 3.4, col: "#e7c56a", align: "center", base: "middle", w: 800 }); } },
  trophy: { s(f) { const px = tx(f.x), py = tx(f.y);
      box(px + 1, py - 6, 14, 20, 1, "#fff6df", { blur: 1.4, stroke: "#c79a3a", lw: 0.4 });
      box(px + 2.2, py - 4.4, 11.6, 14, 0.4, "rgba(255,255,255,.45)", { shadow: false, stroke: "#e7c56a", lw: 0.3 });
      const x = X(); x.beginPath(); x.moveTo(px + 5, py - 1); x.lineTo(px + 11, py - 1); x.quadraticCurveTo(px + 10.2, py + 3.2, px + 8, py + 3.2); x.quadraticCurveTo(px + 5.8, py + 3.2, px + 5, py - 1); x.fillStyle = "#f2c14e"; x.fill(); x.lineWidth = 0.3; x.strokeStyle = "#8a6420"; x.stroke();
      box(px + 6.2, py + 3, 3.6, 2.4, 0.2, "#a87b00", { shadow: false, lw: 0.15 }); },
    d(f) { const e = (typeof promoView !== "undefined" && promoView && promoView.executive) || null;
      wtext(e ? "MD" : "OPEN", tx(f.x) + 8, tx(f.y) + 8, { size: 3.1, col: "#8a6420", align: "center", base: "middle", w: 800 }); } },
  shelf: { s(f) { const px = tx(f.x), py = tx(f.y);
      box(px + 1, py - 2, 14, 15, 1, "#f0d7a4", { blur: 1.5, stroke: "#c79a3a", lw: 0.35 });
      for (let i = 0; i < 3; i++) box(px + 2.4, py + 0.6 + i * 4, 11.2, 3.1, 0.3, i === 1 ? "#ffe08a" : "#f2c14e", { shadow: false, lw: 0.2 }); } },
  plant: { s(f) { const px = tx(f.x), py = tx(f.y); plant(px + 8, py + 8, f.big ? 2.1 : 1.6, "#3f8f4e", "#e7c56a");
      if (theme().id === "halloween") ell(px + 12, py + 12, 2.2, 1.7, 0, "#e8792b", { lw: 0.25 }); } },
  pool: { s(f) { const px = tx(f.x), py = tx(f.y), w = tx(f.w), h = tx(f.h);
      box(px, py, w, h, 2.2, "#4a2414", { blur: 2.2, oy: 1.1 });
      box(px + 2.2, py + 2.2, w - 4.4, h - 4.4, 1.2, "#6b3418", { shadow: false, lw: 0.3 });
      box(px + 4.5, py + 4.5, w - 9, h - 9, 1, "#147a45", { shadow: false, stroke: "#0c4a28", lw: 0.4 });
      const pockets = [[4.2, 4.2], [w / 2, 3.4], [w - 4.2, 4.2], [4.2, h - 4.2], [w / 2, h - 3.4], [w - 4.2, h - 4.2]];
      for (const [dx, dy] of pockets) circ(px + dx, py + dy, 2.15, "#140e0c", { shadow: false, lw: 0.25, stroke: "#e7c56a" });
      const balls = [[14, 12, "#f2c14e"], [22, 18, "#c4313a"], [30, 11, "#f6f1e4"], [38, 17, "#1a4a78"], [46, 12, "#e07a2f"], [54, 18, "#111"], [62, 13, "#7a1e32"]];
      for (const [dx, dy, col] of balls) circ(px + dx, py + dy, 1.85, col, { lw: 0.22 });
      line([px + 10, py + h - 6, px + w - 12, py + 7], "#d7b56a", 0.7);
      line([px + 12, py + h - 5, px + w - 8, py + 9], "#6b3a1e", 0.45);
      wtext("POOL", px + w / 2, py + h / 2 + 0.4, { size: 3.2, col: "rgba(255,246,220,.8)", align: "center", base: "middle", w: 800, maxW: w - 16 }); } },
};
function drawDynamic(t) {
  windowGlass(78, 8, 34, 24, t);
  windowGlass(202, 8, 34, 24, t + 1.7);
  windowGlass(304, 8, 34, 24, t + 3.1);
  artBook(120, 6, 74, 28);
  for (const lx of [4, 12, 22]) box(tx(lx) + 5, 45, 6, 3, 1, "#c79a3a", { shadow: false, lw: 0.25 });
  for (const f of FURN) { const fn = ART[f.type]; if (fn && fn.d) try { fn.d(f, t); } catch (e) { /* decor */ } }
}
const LAMPS = [[4, 5], [22, 5], [4, 10], [22, 10], [13, 12], [16, 15]];
function drawPost(t) {
  const x = X(), n = nightFactor(hourF());
  if (n > 0) { x.fillStyle = `rgba(40,28,10,${0.28 * n})`; x.fillRect(16, 48, LW - 32, LH - 64); }
  x.save(); x.globalCompositeOperation = "lighter";
  for (const [lx, ly] of LAMPS) {
    const a = tx(lx) + 8, b = tx(ly), r = 26 + n * 8, gr = x.createRadialGradient(a, b, 1, a, b, r);
    gr.addColorStop(0, `rgba(255,214,120,${0.1 + 0.16 * n})`); gr.addColorStop(1, "rgba(255,214,120,0)");
    x.fillStyle = gr; x.fillRect(a - r, b - r, r * 2, r * 2);
  }
  x.restore();
}
R_.pawnHook = function (c, k, hx, hy, r, view, dir) {
  if (c.id !== "vance" || view === "N") return;
  const x = X(), side = view !== "S", ex = side ? [hx + dir * r * 0.5] : [hx - r * 0.38, hx + r * 0.38];
  x.strokeStyle = "#e7c56a"; x.lineWidth = 0.4;
  for (const e of ex) { x.beginPath(); x.arc(e, hy + 0.35, 1, 0, 7); x.stroke(); }
  if (!side) line([ex[0] + 1, hy + 0.35, ex[1] - 1, hy + 0.35], "#e7c56a", 0.3);
};
R_.floor = {
  drawStatic, drawDynamic, drawPost,
  staticKey: () => { const th = theme(); const e = (typeof promoView !== "undefined" && promoView && promoView.executive && promoView.executive.bot) || ""; return ["exec2", th.k, th.weather, th.id, th.party || "", e].join("|"); },
};
layout();
})();
