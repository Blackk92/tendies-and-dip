"use strict";
/* Top-floor drawing layer. Same vector painter as the floors below, but this room is the
   executive suite: black marble, a city window, a board table, and two real stairwells.
   Simulation stays in penthouse.js. */
(function () {
if (!window.RIM || !window.RIM.on) return;
const R_ = window.RIM, P = R_.P;
const { box, circ, ell, line, poly, hex, rug, wallSeg, glassSeg, plant, chair, screen, INK, RIC } = P;
const { wtext, marquee, frame, bunting, mug } = R_.D;
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
function skyline(a, b, w, h, t) {
  const x = X(), hr = hourF(), [top, bot] = skyCols(hr), n = nightFactor(hr), th = theme();
  x.save(); x.beginPath(); x.rect(a, b, w, h); x.clip();
  const gr = x.createLinearGradient(0, b, 0, b + h);
  gr.addColorStop(0, th.weather === "rain" && n < 0.5 ? "#7d8c9a" : top);
  gr.addColorStop(1, th.weather === "rain" && n < 0.5 ? "#c5ced6" : bot);
  x.fillStyle = gr; x.fillRect(a, b, w, h);
  if (hr >= 7 && hr < 18 && th.weather === "clear") circ(a + w * 0.82, b + h * 0.22, 3.2, "#fff6d0", { shadow: false, stroke: false });
  else if (n > 0.55) circ(a + w * 0.16, b + h * 0.2, 2.2, "#f4f1d0", { shadow: false, stroke: false });
  const towers = 18;
  for (let i = 0; i < towers; i++) {
    const bw = w / towers, bh = h * (0.28 + ((i * 13) % 9) / 16), xx = a + i * bw;
    x.fillStyle = n > 0.45 ? "#12182a" : "#5d7386";
    x.fillRect(xx, b + h - bh, bw - 0.8, bh);
    if (i % 5 === 2) { x.fillStyle = n > 0.45 ? "#1c2744" : "#7f93a4"; x.fillRect(xx + bw * 0.28, b + h - bh - h * 0.12, bw * 0.28, h * 0.12); }
    if (n > 0.2) for (let k = 0; k < 4; k++) {
      x.fillStyle = `rgba(255,214,140,${0.35 + 0.4 * n})`;
      x.fillRect(xx + 1.4 + (k % 2) * (bw * 0.38), b + h - bh + 2 + k * 2.4, 0.9, 1.1);
    }
  }
  if (th.weather === "rain") { x.strokeStyle = "rgba(230,240,255,.75)"; x.lineWidth = 0.4; for (let i = 0; i < 28; i++) { const rx = a + ((i * 17 + t * 40) % w), ry = b + ((i * 9 + t * 70) % h); x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - 1.4, ry + 3.2); x.stroke(); } }
  if (th.weather === "snow") for (let i = 0; i < 24; i++) circ(a + ((i * 19 + Math.sin(t + i) * 4) % w), b + ((i * 7 + t * 8) % h), 0.6, "#fff", { shadow: false, stroke: false, shade: false });
  x.restore();
}
function marble() {
  const x = X();
  x.fillStyle = "#16141c"; x.fillRect(16, 50, LW - 32, LH - 66);
  x.strokeStyle = "rgba(231,197,106,.16)"; x.lineWidth = 0.45;
  for (let a = 16; a <= LW - 16; a += 32) { x.beginPath(); x.moveTo(a, 50); x.lineTo(a, LH - 16); x.stroke(); }
  for (let b = 50; b <= LH - 16; b += 32) { x.beginPath(); x.moveTo(16, b); x.lineTo(LW - 16, b); x.stroke(); }
  x.strokeStyle = "rgba(255,255,255,.06)"; x.lineWidth = 0.7;
  x.beginPath(); x.moveTo(30, 90); x.bezierCurveTo(90, 160, 180, 70, 390, 180); x.stroke();
  x.beginPath(); x.moveTo(60, 240); x.bezierCurveTo(160, 200, 250, 250, 400, 210); x.stroke();
}
function grandStair(x, y, w, h, label, gold, t) {
  const rows = 6, head = 18, th = (h - head - 2) / rows;
  const hov = R_.hoverIn(x - 2, y - 2, w + 4, h + 4);
  const edge = gold ? "#e7c56a" : RIC;
  box(x, y, w, head, 1.6, gold ? (hov ? "#8a6420" : "#4a3410") : (hov ? "#1d6270" : "#12383f"), { lw: hov ? 0.9 : 0.55, stroke: edge, blur: hov ? 2.4 : 1.2 });
  wtext(label, x + w / 2, y + head / 2 + 0.4, { size: 7.4, col: gold ? "#fff6d2" : "#e7fbff", align: "center", base: "middle", w: 800, maxW: w - 8, shrink: 5.2 });
  for (let i = 0; i < rows; i++) {
    const yy = y + head + 1 + i * th;
    box(x + 6 + i * 1.1, yy, w - 12 - i * 2.2, th - 1.1, 0.35, gold ? hex("#d4b56a", 1 - i * 0.07) : hex("#9bb0b8", 1 - i * 0.07), { shadow: false, lw: 0.28 });
  }
  line([x + 3, y + head, x + 3, y + h], edge, 1.5);
  line([x + w - 3, y + head, x + w - 3, y + h], edge, 1.5);
  const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 3));
  X().save(); X().globalAlpha = hov ? 1 : pulse;
  poly([x + w / 2, y + h - 3.2, x + w / 2 - 4, y + h - 8, x + w / 2 + 4, y + h - 8], edge, { stroke: false });
  X().restore();
}
function glassCol(x, y0, y1, doorY) {
  X().fillStyle = "rgba(200,230,240,.12)";
  X().fillRect(x - 3, y0, 7, Math.max(0, (doorY - 8) - y0));
  X().fillRect(x - 3, doorY + 8, 7, Math.max(0, y1 - (doorY + 8)));
  glassSeg(x, y0, x, doorY - 8); glassSeg(x, doorY + 8, x, y1);
  for (let yy = y0; yy <= y1; yy += 16) if (Math.abs(yy - doorY) > 10) circ(x, yy, 0.9, "#e7c56a", { shadow: false, lw: 0.2 });
}

function drawStatic() {
  const x = X(), th = theme();
  marble();
  rug(tx(19) + 6, tx(3) + 8, tx(5) - 10, tx(4) + 4, "#5c1c28", "#e7c56a");
  rug(tx(1) + 6, tx(3) + 8, tx(5) + 2, tx(4) + 4, "#162844", "#e7c56a");
  rug(tx(9) + 4, tx(10) + 6, tx(6) - 8, tx(3) + 4, "#241c18", "#c79a3a");
  const wc = "#2c2824";
  wallSeg(0, 0, 16, LH, wc); wallSeg(LW - 16, 0, 16, LH, wc);
  wallSeg(0, LH - 16, tx(14) - 2, 16, wc);
  wallSeg(tx(22) + 2, LH - 16, LW - tx(22) - 18, 16, wc);
  frame(18, 4, LW - 36, 40, "#0e1218", "#1a140c");
  x.fillStyle = "#e7c56a"; x.fillRect(18, 42, LW - 36, 1.3);
  box(tx(8) + 4, 46, tx(10) - 8, 7, 0.4, "#0c0e12", { shadow: false, lw: 0.3, stroke: "#3a3328" });
  if (th.id) bunting(th.id === "summer" ? "summerstart" : th.id, 46.5);
  glassCol(tx(7) + 8, tx(3) + 4, tx(8) + 2, tx(6) + 8);
  glassCol(tx(18) + 8, tx(3) + 4, tx(8) + 2, tx(6) + 8);
  const FACE = { vance: 0, mags: 0, wade: Math.PI / 2, priya: -Math.PI / 2, otto: Math.PI };
  const CCOL = { vance: "#2a1c12", mags: "#1c2c44", wade: "#24382c", priya: "#4a2828", otto: "#2e2e34" };
  for (const id in CHAIRS) { const [cx, cy] = CHAIRS[id]; chair(tx(cx) + 8, tx(cy) + 8, FACE[id] || 0, CCOL[id] || "#3a342c"); }
  for (const f of FURN) { const fn = ART[f.type]; try { if (fn && fn.s) fn.s(f); } catch (e) { console.warn("rim ph", f.type, e); } }
  box(tx(11), tx(4) + 2, tx(4), 14, 1, "#10141c", { lw: 0.35, stroke: "#e7c56a" });
}
const ART = {
  cdesk: { s(f) { const px = tx(f.x), py = tx(f.y);
    box(px, py, 48, 14, 2, "#24160e", { blur: 2.2 }); box(px + 1.4, py + 1.2, 45, 8.6, 1.2, "#3a2416", { shadow: false, lw: 0.3 });
    X().fillStyle = "#e7c56a"; X().fillRect(px + 1, py + 12.2, 46, 0.8);
    screen(px + 32, py + 6.2, 16, false, "#f2c14e");
    box(px + 6, py + 2.4, 14, 7, 0.4, "#10141c", { lw: 0.25, stroke: "#e7c56a" });
    box(px + 20, py + 8.4, 12, 2.4, 0.3, "#e7c56a", { lw: 0.2 });
    wtext("CEO", px + 26, py + 9.6, { size: 2.5, col: "#3a2a10", align: "center", base: "middle", w: 800 });
    plant(px + 44, py + 3.5, 0.65, "#5f8f52", "#4a3020"); },
    d(f) { const px = tx(f.x), py = tx(f.y); if (!seated("vance")) return; screen(px + 32, py + 6.2, 16, true, "#f2c14e"); glowAt(px + 32, py + 2, 14, "rgba(242,193,78,.3)"); } },
  mdesk: { s(f) { const px = tx(f.x), py = tx(f.y);
    box(px, py, 48, 14, 2, "#1a2740", { blur: 2 }); box(px + 1.4, py + 1.2, 45, 8.6, 1.2, "#243656", { shadow: false, lw: 0.3 });
    X().fillStyle = "#e7c56a"; X().fillRect(px + 1, py + 12.2, 46, 0.8);
    screen(px + 30, py + 6.2, 15, false, "#9fd0ea");
    box(px + 6, py + 2.6, 14, 6.4, 0.4, "#f4efe4", { lw: 0.22 });
    for (let i = -2; i <= 2; i++) circ(px + 13 + i * 1.15, py + 8.2, 0.38, "#fbf7ee", { shadow: false, lw: 0.1 });
    box(px + 20, py + 8.4, 14, 2.4, 0.3, "#d6e4f5", { lw: 0.2 });
    wtext("CHAIR", px + 27, py + 9.6, { size: 2.4, col: "#1a2740", align: "center", base: "middle", w: 800 });
    mug(px + 44, py + 4, "#f7f4ee"); },
    d(f) { const px = tx(f.x), py = tx(f.y); if (!seated("mags")) return; screen(px + 30, py + 6.2, 15, true, "#9fd0ea"); glowAt(px + 30, py + 2, 13, "rgba(147,197,253,.28)"); } },
  btable: { s(f) { const px = tx(f.x), py = tx(f.y);
    box(px + 2, py + 4, 60, 26, 12, "#1a120c", { blur: 2.4 });
    box(px + 6, py + 8, 52, 18, 8, "#2a1c14", { shadow: false, stroke: "#e7c56a", lw: 0.45 });
    for (let i = 0; i < 3; i++) mug(px + 18 + i * 12, py + 16, "#f4efe4");
    box(px + 26, py + 12, 12, 7, 0.4, "#10141c", { lw: 0.25, stroke: "#5a6a78" }); },
    d(f, t) { const px = tx(f.x), py = tx(f.y), th = theme();
      const pts = [2, 3, 2.4, 4.2, 3.1, 2.8, 4.6, 3.6];
      X().strokeStyle = "#5fe08a"; X().lineWidth = 0.6; X().beginPath();
      pts.forEach((v, i) => { const xx = px + 27.5 + i * 1.5, yy = py + 17.5 - v; i ? X().lineTo(xx, yy) : X().moveTo(xx, yy); }); X().stroke();
      if (!partyOn()) return;
      if (th.party === "pizza") { circ(px + 32, py + 17, 4.2, "#e8b04b", { lw: 0.25, shadow: false }); }
      else { for (let i = 0; i < 3; i++) { circ(px + 20 + i * 10, py + 16, 1.4, ["#f2c14e", "#f4efe4", "#6ea8d6"][i], { lw: 0.22 }); line([px + 20 + i * 10, py + 14.6, px + 20 + i * 10, py + 12.4], "#e7c56a", 0.35); } } } },
  bar: { s(f) { const px = tx(f.x), py = tx(f.y);
    box(px, py - 1, 48, 15, 1.2, "#24160e", { blur: 1.6 }); X().fillStyle = "#e7c56a"; X().fillRect(px, py + 11, 48, 0.7);
    box(px + 3, py - 5, 14, 11, 1.2, "#cfd6dc", { lw: 0.3 }); box(px + 5, py - 3, 10, 3.4, 0.5, "#8b939a", { shadow: false, lw: 0.2 });
    for (let i = 0; i < 3; i++) mug(px + 26 + i * 5.5, py + 3, ["#f4efe4", "#6b2430", "#e7c56a"][i]);
    wtext("LOUNGE", px + 24, py + 9, { size: 2.6, col: "#e7c56a", align: "center", w: 800 }); },
    d(f, t) { const px = tx(f.x), py = tx(f.y), x = X(); x.save(); x.globalAlpha = 0.28 + 0.14 * Math.sin(t * 2); ell(px + 9, py - 8 - ((t * 4) % 5), 1.2, 1.6, 0, "#fff", { stroke: false }); x.restore(); } },
  trophy: { s(f) { const px = tx(f.x), py = tx(f.y);
    box(px, py - 16, 16, 28, 1, "#3a2e22", { blur: 1.6 });
    box(px + 1.4, py - 14.4, 13.2, 22, 0.5, "rgba(210,225,235,.28)", { shadow: false, stroke: "#e7c56a", lw: 0.4 });
    const x = X(); x.beginPath(); x.moveTo(px + 5, py - 8); x.lineTo(px + 11, py - 8); x.quadraticCurveTo(px + 10.4, py - 2.5, px + 8, py - 2.5); x.quadraticCurveTo(px + 5.6, py - 2.5, px + 5, py - 8); x.fillStyle = "#f2c14e"; x.fill(); x.lineWidth = 0.3; x.strokeStyle = INK; x.stroke();
    box(px + 6.4, py - 2.6, 3.2, 3.2, 0.2, "#a87b00", { shadow: false, lw: 0.15 }); },
    d(f) { const px = tx(f.x) + 8, py = tx(f.y) + 6, e = (typeof promoView !== "undefined" && promoView && promoView.executive) || null;
      wtext(e ? "MD" : "OPEN", px, py, { size: 3.3, col: "#5a3a12", align: "center", base: "middle", w: 800 }); } },
  shelf: { s(f) { const px = tx(f.x), py = tx(f.y), cols = ["#7f1d1d", "#1e3a5f", "#e7c56a", "#14532d", "#6a4c93"];
    box(px + 1, py - 12, 14, 26, 1, "#2a2118", { blur: 1.4, stroke: "#e7c56a", lw: 0.35 });
    for (let s = 0; s < 3; s++) { box(px + 2, py - 10 + s * 7.2, 12, 6.2, 0.3, "#1a140e", { shadow: false, stroke: false }); for (let i = 0; i < 4; i++) box(px + 2.4 + i * 2.8, py - 9.4 + s * 7.2, 2.3, 5.2, 0.2, cols[(s + i) % 5], { shadow: false, lw: 0.15 }); } } },
  plant: { s(f) { const px = tx(f.x), py = tx(f.y); plant(px + 8, py + 6, f.big ? 2.05 : 1.5, theme().id === "holiday" ? "#2f6b3a" : "#4f7a48", "#3a2418");
    if (theme().id === "halloween") { ell(px + 12, py + 12, 2.2, 1.7, 0, "#e8792b", { lw: 0.25 }); }
    if (theme().id === "holiday") circ(px + 8, py - 2, 1.3, "#f2c14e", { shadow: false, lw: 0.2 }); } },
};
function drawDynamic(t) {
  skyline(20, 6, LW - 40, 34, t);
  const tape = "TOP FLOOR   ·   TENDIES AND DIP   ·   PAPER BOOK   ·   CEO  VANCE   ·   CHAIR  MAGS   ·   BOARD   ·   ";
  marquee(tape, tx(8) + 6, 48.2, tx(10) - 14, { size: 4.2, col: "#f2c14e", w: 800, mono: true }, t, 18);
  const px = tx(11), py = tx(4) + 2;
  X().fillStyle = "#0c1016"; X().fillRect(px + 1, py + 1, tx(4) - 2, 12);
  wtext("BOOK", px + 6, py + 7, { size: 3.6, col: "#f2c14e", base: "middle", w: 800 });
  const wave = [3, 5, 4, 7, 6, 8, 5, 9, 7];
  X().strokeStyle = "#5fe08a"; X().lineWidth = 0.7; X().beginPath();
  wave.forEach((v, i) => { const xx = px + 22 + i * 4.2, yy = py + 10 - v * 0.7; i ? X().lineTo(xx, yy) : X().moveTo(xx, yy); }); X().stroke();
  grandStair(tx(14) + 2, tx(14) + 2, tx(4) - 6, tx(4) - 8, "FLOOR  ▼", true, t);
  grandStair(tx(18) + 2, tx(14) + 2, tx(4) - 6, tx(4) - 8, "B1  ▼", false, t);
  if (partyOn()) {
    const label = theme().party === "pizza" ? "PIZZA FRIDAY" : theme().party === "anniversary" ? "TO THE FIRM" : "A SMALL TOAST";
    box(tx(9), tx(9) + 2, tx(8), 11, 1, "#fbf3dc", { lw: 0.35, blur: 1 });
    wtext(label, tx(13), tx(9) + 7.5, { size: 5, col: "#8a3030", align: "center", base: "middle", w: 800, maxW: tx(8) - 8, shrink: 3.4 });
  }
  for (const f of FURN) { const fn = ART[f.type]; if (fn && fn.d) try { fn.d(f, t); } catch (e) { /* decor */ } }
}
const LAMPS = [[4, 5], [22, 5], [12, 12], [22, 14], [5, 14]];
function drawPost(t) {
  const x = X(), n = nightFactor(hourF());
  if (n > 0) { x.fillStyle = `rgba(8,8,16,${0.34 * n})`; x.fillRect(16, 50, LW - 32, LH - 66); }
  x.save(); x.globalCompositeOperation = "lighter";
  for (const [lx, ly] of LAMPS) {
    const a = tx(lx) + 8, b = tx(ly), r = 34 + n * 14, gr = x.createRadialGradient(a, b, 2, a, b, r);
    gr.addColorStop(0, `rgba(255,206,140,${0.06 + 0.14 * n})`); gr.addColorStop(1, "rgba(255,206,140,0)");
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
  staticKey: () => { const th = theme(); const e = (typeof promoView !== "undefined" && promoView && promoView.executive && promoView.executive.bot) || ""; return ["top2", th.k, th.weather, th.id, th.party || "", e].join("|"); },
};
layout();
})();
