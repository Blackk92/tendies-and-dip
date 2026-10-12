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
  c.strokeStyle = edge; c.lineWidth = 1.15; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
  c.strokeStyle = "rgba(255,255,255,.32)"; c.lineWidth = 0.4; c.strokeRect(x + 4, y + 4, w - 8, h - 8);
  for (let yy = y + 9; yy < y + h - 5; yy += 11) for (let xx = x + 9; xx < x + w - 5; xx += 11) circ(xx, yy, 0.55, dot, { shadow: false, stroke: false, shade: false });
}

function drawStatic() {
  const x = X(), rnd = R_.rng(9091), th = theme();
  planks(16, 48, LW - 32, LH - 64, "#e4c07a", "rgba(80,48,10,.34)", rnd);
  carpet(tx(1) + 3, tx(3) + 2, tx(6) - 8, tx(5) - 8, "#146b45", "#e7c56a", "#d9ffe6");
  carpet(tx(19) + 3, tx(3) + 2, tx(6) - 8, tx(5) - 8, "#7a1e32", "#e7c56a", "#f2c14e");
  carpet(tx(8) + 4, tx(4) + 2, tx(9) - 6, tx(4) + 8, "#1a4a78", "#e7c56a", "#d5e6f8");
  carpet(tx(9), tx(10) + 2, tx(7), tx(4) - 2, "#0c6a62", "#e7c56a", "#d8fff6");
  rug(tx(1) + 4, tx(9) + 2, tx(4) - 4, tx(2) + 2, "#243056", "#e7c56a");
  rug(tx(20) + 4, tx(9) + 2, tx(4), tx(2) + 2, "#c45c28", "#f6e2a8");
  x.fillStyle = "#f8efd4"; x.fillRect(0, 0, LW, 48);
  x.fillStyle = "rgba(255,255,255,.22)"; for (let a = 0; a < LW; a += 12) x.fillRect(a, 3, 0.5, 33);
  x.fillStyle = "#e7b23a"; x.fillRect(0, 36, LW, 12); x.fillStyle = "#fff1c2"; x.fillRect(0, 36, LW, 1.6); x.fillStyle = "rgba(90,60,10,.2)"; x.fillRect(0, 46.6, LW, 1.4);
  const wc = "#e6c98a";
  wallSeg(0, 0, LW, 3.2, "#c79a3a"); wallSeg(0, 0, 16, LH, wc); wallSeg(LW - 16, 0, 16, LH, wc);
  wallSeg(0, LH - 16, tx(15) - 1, 16, wc); wallSeg(tx(18) + 1, LH - 16, LW - tx(18) - 17, 16, wc);
  frame(132, 6, 40, 28, "#9fc6d8", "#c79a3a");
  frame(180, 6, 40, 28, "#9fc6d8", "#c79a3a");
  frame(228, 6, 40, 28, "#9fc6d8", "#c79a3a");
  if (th.id) bunting(th.id, 39.2);
  officeGlass(7); officeGlass(18);
  wallSeg(tx(1), tx(8) - 2, tx(6), 11, "#e6c98a");
  wallSeg(tx(19), tx(8) - 2, tx(6), 11, "#e6c98a");
  box(tx(2) + 6, tx(8) - 8, 36, 7, 1, "#e7c56a", { lw: 0.35 });
  wtext("CHAIR", tx(2) + 24, tx(8) - 4.6, { size: R_.small() ? 4.6 : 3.4, col: "#3a2a10", align: "center", base: "middle", w: 800, maxW: 34 });
  box(tx(20) + 4, tx(8) - 8, 32, 7, 1, "#e7c56a", { lw: 0.35 });
  wtext("CEO", tx(20) + 20, tx(8) - 4.6, { size: R_.small() ? 4.8 : 3.5, col: "#3a2a10", align: "center", base: "middle", w: 800 });
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
      box(px, py - 2, w, 15, 1, "#f6e7c4", { blur: 1.8 }); X().fillStyle = "#e7c56a"; X().fillRect(px, py + 10.5, w, 1.2);
      box(px + 3, py - 4, 14, 11, 1.4, "#f4f7f8", { lw: 0.3 }); box(px + 5, py - 2.4, 10, 3.4, 0.5, "#d5dde3", { shadow: false, lw: 0.2 });
      box(px + 20, py + 2, 8, 5, 0.5, "#3f8f4e", { lw: 0.25 }); box(px + 21.2, py + 3.1, 8, 5, 0.5, "#4fa65d", { lw: 0.25 });
      for (let i = 0; i < 3; i++) mug(px + 34 + i * 4.2, py + 4, ["#fff", "#7a1f2b", "#e7c56a"][i]);
      wtext("LOUNGE", px + w / 2, py + 8.6, { size: 3.1, col: "#8a6420", align: "center", w: 800, maxW: w - 8 }); },
    d(f, t) { const px = tx(f.x), py = tx(f.y), x = X(); x.save(); x.globalAlpha = 0.4 + 0.2 * Math.sin(t * 2); ell(px + 10, py - 8 - ((t * 4) % 5), 1.1, 1.6, 0, "#fff", { stroke: false }); x.restore(); } },
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
};
function drawDynamic(t) {
  windowGlass(132, 6, 40, 28, t);
  windowGlass(180, 6, 40, 28, t + 1.7);
  windowGlass(228, 6, 40, 28, t + 3.1);
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
  staticKey: () => { const th = theme(); const e = (typeof promoView !== "undefined" && promoView && promoView.executive && promoView.executive.bot) || ""; return ["stair2", th.k, th.weather, th.id, th.party || "", e].join("|"); },
};
layout();
})();
