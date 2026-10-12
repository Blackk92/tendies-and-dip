"use strict";
/* Penthouse. CEO, board chair, three directors. Same 26x18 pixel office as the floors below.
   El Jefe and Nancy arrive on the shared EXEC clock. Holidays, weather, and the odd party are date-seeded. */
const TS = 16, GW = 26, GH = 18, LW = GW * TS, LH = GH * TS;
const $ = (id) => document.getElementById(id);
const cv = $("cv");
const ctx = cv.getContext("2d");
let SC = 2, DPR = 1, LP = 2, selected = null;
const HOT = [
  { id: "floor", x: 14 * TS, y: 14 * TS, w: 4 * TS, h: 4 * TS },
  { id: "b1", x: 18 * TS, y: 14 * TS, w: 4 * TS, h: 4 * TS },
];
const bg = document.createElement("canvas"); bg.width = LW; bg.height = LH;
const gb = bg.getContext("2d"); gb.imageSmoothingEnabled = false;
const frame = document.createElement("canvas"); frame.width = LW; frame.height = LH;
const g = frame.getContext("2d"); g.imageSmoothingEnabled = false;

function etNow() {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour12: false, weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(new Date()).reduce((o, x) => (o[x.type] = x.value, o), {});
  const h = (+p.hour % 24) + (+p.minute) / 60 + (+p.second) / 3600;
  const e = { h, wd: p.weekday, hh: +p.hour % 24, mm: +p.minute };
  if (EXEC.ovHour != null) e.h = EXEC.ovHour;
  if (EXEC.ovDate) {
    const [y, m, d] = EXEC.ovDate.split("-").map(Number);
    e.wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  }
  return e;
}

const FONT = {
  A:".#.#.#####.##.#",B:"##.#.###.#.###.",C:".###..#..#...##",D:"##.#.##.##.###.",E:"####..##.#..###",F:"####..##.#..#..",
  G:".###..#.##.#.##",H:"#.##.#####.##.#",I:"###.#..#..#.###",J:"..#..#..##.#.#.",K:"#.##.###.#.##.#",L:"#..#..#..#..###",
  M:"#.#####.##.##.#",N:"##.#.##.##.##.#",O:".#.#.##.##.#.#.",P:"##.#.###.#..#..",Q:".#.#.##.###..##",R:"##.#.###.#.##.#",
  S:".###...#...###.",T:"###.#..#..#..#.",U:"#.##.##.##.####",V:"#.##.##.##.#.#.",W:"#.##.##.#####.#",X:"#.##.#.#.#.##.#",
  Y:"#.##.#.#..#..#.",Z:"###..#.#.#..###","0":"####.##.##.####","1":".#.##..#..#.###","2":"##...#.#.#..###",
  "3":"##...#.#...###.","4":"#.##.####..#..#","5":"####..##...###.","6":".###..####.####","7":"###..#.#..#..#.",
  "8":"####.#####.####","9":"####.####..###.",".":"............#..",",":".........#.#...",":":"....#.....#....",
  "-":"......###......","+":"....#.###.#....","$":".####..#..####.","%":"#....#.#.#....#","/":"..#..#.#.#..#..",
  "(":".#.#..#..#...#.",")":".#...#..#..#.#.","!":".#..#..#.....#.","?":"##...#.#.....#.","'":".#..#..........",
  "#":"#.#####.#####.#",">":"#...#...#.#.#..","<":"..#.#.#...#...#","=":"...###...###...","&":".#.#.#.#.#.#.##",
  "_":"............###","*":"...#.#.#.#.#..."," ":"..............."
};
function ptext(c, s, x, y, col, px) {
  s = String(s).toUpperCase(); c.fillStyle = col; let cx = Math.round(x); y = Math.round(y);
  for (const ch of s) { const f = FONT[ch] || FONT["?"]; for (let i = 0; i < 15; i++) if (f.charCodeAt(i) === 35) c.fillRect(cx + (i % 3) * px, y + ((i / 3) | 0) * px, px, px); cx += 4 * px; }
}
function ptextC(c, s, cx, y, col, px) { ptext(c, s, cx - (String(s).length * 4 - 1) * px / 2, y, col, px); }
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return "#" + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

const blocked = new Uint8Array(GW * GH), seat = new Uint8Array(GW * GH);
const I = (x, y) => y * GW + x;
function B(x0, y0, x1, y1, v = 1) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < GW && y < GH) blocked[I(x, y)] = v; }
B(0, 0, GW - 1, 2); B(0, GH - 1, GW - 1, GH - 1); B(0, 0, 0, GH - 1); B(GW - 1, 0, GW - 1, GH - 1);
B(15, 17, 17, 17, 0);
B(18, 3, 18, 8); B(18, 6, 18, 6, 0); B(18, 8, 24, 8);
B(7, 3, 7, 8); B(7, 6, 7, 6, 0); B(1, 8, 7, 8);

const FURN = [];
function F(type, x, y, w = 1, h = 1, o = {}) { FURN.push(Object.assign({ type, x, y, w, h }, o)); B(x, y, x + w - 1, y + h - 1); }
F("cdesk", 21, 5, 3, 1); F("plant", 24, 3, 1, 1, { big: 1 }); F("shelf", 20, 3);
F("mdesk", 3, 5, 3, 1); F("plant", 1, 3, 1, 1, { big: 1 });
F("btable", 10, 11, 4, 2); F("bar", 21, 13, 3, 1); F("trophy", 23, 10);
F("plant", 8, 14); F("plant", 1, 15, 1, 1, { big: 1 });

const SPOTS = {};
function S_(key, x, y, face = "S", pose = "stand") { SPOTS[key] = { key, x, y, face, pose }; }
S_("chair_vance", 22, 4, "S", "sit"); S_("front_vance", 22, 6, "N"); S_("pace_v", 21, 7, "E");
S_("chair_mags", 4, 4, "S", "sit"); S_("front_mags", 4, 6, "N"); S_("pace_m", 2, 7, "E");
S_("seat_wade", 9, 11, "E", "sit"); S_("seat_priya", 14, 12, "W", "sit"); S_("seat_otto", 12, 13, "N", "sit");
S_("bar_1", 21, 14, "N"); S_("bar_2", 22, 14, "N"); S_("window", 12, 3, "N"); S_("elev", 16, 16, "S");
for (const k of ["chair_vance", "chair_mags", "seat_wade", "seat_priya", "seat_otto"]) seat[I(SPOTS[k].x, SPOTS[k].y)] = 1;
const CHAIRS = { vance: [22, 4], mags: [4, 4], wade: [9, 11], priya: [14, 12], otto: [12, 13] };

const RES = ["vance", "mags", "wade", "priya", "otto"];
const HOME = { vance: "chair_vance", mags: "chair_mags", wade: "seat_wade", priya: "seat_priya", otto: "seat_otto" };
const CAST = {
  vance: EXEC.look("vance"), mags: EXEC.look("mags"), wade: EXEC.look("wade"), priya: EXEC.look("priya"), otto: EXEC.look("otto"),
  grok: { name: "EL JEFE", role: "Floor boss", skin: "#e0ac69", hair: "#3a2a1a", shirt: "#23232b", pants: "#1c1917", tie: "#f2c14e", acc: "jefe" },
  nancy: { name: "NANCY", role: "Research Inc.", skin: "#f1d0b5", hair: "#c9a27a", shirt: "#f7b8d0", pants: "#f7b8d0", long: 1, acc: "pearls" },
};
const COL = { vance: "#f2c14e", mags: "#93c5fd", wade: "#4ade80", priya: "#fca5a5", otto: "#d4d4d8", grok: "#f2c14e", nancy: "#f7a8c8" };
const ORDER = RES.concat(["grok", "nancy"]);
const chars = {};
for (const id of ORDER) chars[id] = { id, tx: 0, ty: 0, x: 0, y: 0, path: [], moving: false, face: "S", pose: "stand", hidden: true, task: null, goal: null, bubble: null, walkT: 0, speed: 3.2, next: 0 };
let T = 0, rng = 1234567;
const rnd = () => ((rng = (rng * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[(rnd() * a.length) | 0];
const occ = new Map();

function passable(x, y, gx, gy, dyn) {
  if (x < 0 || y < 0 || x >= GW || y >= GH) return false;
  const i = I(x, y); if (blocked[i]) return false;
  const goal = x === gx && y === gy;
  if (seat[i] && !goal) return false;
  if (dyn && dyn.has(i) && !goal) return false;
  return true;
}
function astar(sx, sy, gx, gy, dyn) {
  if (sx === gx && sy === gy) return [];
  if (!passable(gx, gy, gx, gy, null)) return null;
  const N = GW * GH, gs = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const open = [I(sx, sy)]; gs[open[0]] = 0;
  const h = (i) => Math.abs((i % GW) - gx) + Math.abs(((i / GW) | 0) - gy);
  while (open.length) {
    let bi = 0, bf = 1e9;
    for (let k = 0; k < open.length; k++) { const f = gs[open[k]] + h(open[k]); if (f < bf) { bf = f; bi = k; } }
    const cur = open.splice(bi, 1)[0]; if (closed[cur]) continue; closed[cur] = 1;
    const cx = cur % GW, cy = (cur / GW) | 0;
    if (cx === gx && cy === gy) { const path = []; let c = cur; while (c !== I(sx, sy)) { path.push([c % GW, (c / GW) | 0]); c = came[c]; } return path.reverse(); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy; if (!passable(nx, ny, gx, gy, dyn)) continue;
      const ni = I(nx, ny); if (closed[ni]) continue;
      const ng = gs[cur] + 1; if (ng < gs[ni]) { gs[ni] = ng; came[ni] = cur; open.push(ni); }
    }
  }
  return null;
}
function dynOf(self) {
  const s = new Set();
  for (const c of Object.values(chars)) if (c !== self && !c.hidden) { s.add(I(c.tx, c.ty)); if (c.path && c.path[0]) s.add(I(c.path[0][0], c.path[0][1])); }
  return s;
}
function place(c, x, y) {
  for (const [k, v] of occ) if (v === c.id) occ.delete(k);
  c.tx = x; c.ty = y; c.x = x * TS + 8; c.y = y * TS + 8; c.path = []; c.moving = false; occ.set(I(x, y), c.id);
}
function routeTo(c, spot) {
  const path = astar(c.tx, c.ty, spot.x, spot.y, dynOf(c));
  c.goal = spot;
  if (!path) return false;
  c.path = path; return true;
}
const atSpot = (c, s) => s && c.tx === s.x && c.ty === s.y && !c.moving && !(c.path && c.path.length);
function say(id, text, secs) { const c = chars[id]; if (!c || c.hidden) return; c.bubble = { text: String(text).toUpperCase().slice(0, 42), until: T + secs }; }
function setTask(id, steps, label) {
  const c = chars[id]; if (!c || c.hidden) return;
  c.task = { steps: steps.slice(), label, t0: T }; c.goal = null; c.path = [];
}
function runTask(c) {
  const s = c.task.steps[0];
  if (!s) { c.task = null; return; }
  if (!c.goal || c.goal.key !== s.spot.key) { if (!routeTo(c, s.spot)) { c.task.steps.shift(); return; } }
  if (atSpot(c, s.spot)) {
    if (s.started == null) {
      s.started = T; c.face = s.spot.face; c.pose = s.spot.pose || "stand";
      if (s.say) say(c.id, s.say, Math.min(4.5, s.dur || 3));
      if (s.onArrive) s.onArrive();
      if (s.leave) { for (const [k, v] of occ) if (v === c.id) occ.delete(k); c.hidden = true; c.task = null; c.goal = null; c.bubble = null; c.path = []; return; }
    }
    if (T - s.started >= (s.dur || 0)) { c.task.steps.shift(); c.goal = null; if (!c.task.steps.length) c.task = null; }
  }
  if (c.task && T - c.task.t0 > 80) { c.task = null; c.goal = null; }
}
function stepMove(c, dt) {
  if (c.hidden || !c.path || !c.path.length) return;
  const [nx, ny] = c.path[0];
  if (!c.moving) {
    if (occ.get(I(nx, ny)) && occ.get(I(nx, ny)) !== c.id) return;
    c.moving = true; c.face = nx > c.tx ? "E" : nx < c.tx ? "W" : ny > c.ty ? "S" : "N";
  }
  const tx = nx * TS + 8, ty = ny * TS + 8, sp = c.speed * TS * dt;
  const dx = tx - c.x, dy = ty - c.y, d = Math.abs(dx) + Math.abs(dy);
  c.walkT += dt;
  if (d <= sp) {
    c.x = tx; c.y = ty;
    if (occ.get(I(c.tx, c.ty)) === c.id) occ.delete(I(c.tx, c.ty));
    c.tx = nx; c.ty = ny; c.moving = false; c.path.shift(); occ.set(I(nx, ny), c.id);
  } else { c.x += Math.sign(dx) * Math.min(Math.abs(dx), sp); c.y += Math.sign(dy) * Math.min(Math.abs(dy), sp); }
}

function appearElev(c) {
  const s = SPOTS.elev; if (occ.has(I(s.x, s.y))) return false;
  c.hidden = false; place(c, s.x, s.y); c.face = "N"; c.pose = "stand"; c.task = null; c.goal = null; c.bubble = null; return true;
}
function guest(c, win, boss, line) {
  const front = SPOTS["front_" + boss];
  if (win) {
    if (c.hidden) {
      if (!appearElev(c)) return;
      setTask(c.id, [
        { spot: front, dur: 6, say: line, onArrive: () => say(boss, boss === "vance" ? "SIT. TALK SLOW." : "DARLING. YOU'RE EARLY.", 4) },
      ], "meeting");
      return;
    }
    if (c.task) { runTask(c); return; }
    if (!atSpot(c, front)) { if (!c.goal || c.goal.key !== front.key) routeTo(c, front); return; }
    c.face = front.face; c.pose = "stand";
    if (T >= (c.next || 0)) { say(c.id, line, 3.5); c.next = T + 14 + rnd() * 12; }
    return;
  }
  if (!c.hidden) {
    if (!(c.task && c.task.steps.some((s) => s.leave))) setTask(c.id, [{ spot: SPOTS.elev, dur: 0, say: "BACK DOWNSTAIRS", leave: true }], "leave");
    if (c.task) runTask(c);
  }
}
function goDown(c) {
  if (c.hidden) return;
  if (!(c.task && c.task.label === "downstairs")) {
    say(c.id, "I'M GOING DOWN.", 3);
    setTask(c.id, [{ spot: SPOTS.elev, dur: 0, leave: true }], "downstairs");
  }
  if (c.task) runTask(c);
}
function resident(c) {
  const down = EXEC.downNow();
  if (down && down.who === c.id) { goDown(c); return; }
  if (c.hidden) {
    const h = SPOTS[HOME[c.id]]; if (!h || occ.has(I(h.x, h.y))) return;
    c.hidden = false; place(c, h.x, h.y); c.pose = h.pose; c.face = h.face; c.next = T + 8 + rnd() * 20;
    return;
  }
  if (c.task) { runTask(c); return; }
  const h = SPOTS[HOME[c.id]];
  if (!atSpot(c, h)) { if (!c.goal || c.goal.key !== h.key) routeTo(c, h); return; }
  c.pose = h.pose; c.face = h.face;
  if (T < c.next) return;
  c.next = T + 25 + rnd() * 40;
  if (partyOn() && rnd() < 0.55) { say(c.id, partyLine(), 4); c.next = T + 18; return; }
  const r = rnd();
  if (r < 0.45) setTask(c.id, [{ spot: rnd() < 0.5 ? SPOTS.bar_1 : SPOTS.bar_2, dur: 8, say: pick(["THE GOOD COFFEE", "ONE CUP", "LEAVE THE DECANTER"]) }], "coffee");
  else if (r < 0.7) setTask(c.id, [{ spot: SPOTS.window, dur: 7, say: pick(["NICE VIEW", "MARKET'S DOWN THERE", "QUIET UP HERE"]) }], "window");
  else say(c.id, pick(["CARRY ON.", "NO SURPRISES.", "READ THE MEMO.", "PAPER MONEY. REAL EGOS."]), 4);
}
function director(c) {
  const preview = EXEC.ceoNow() || EXEC.chairNow() || EXEC.downNow();
  if (!EXEC.workday() && !EXEC.ovHour && !preview) {
    if (c.id === "otto" && !c.hidden && !c.task) { /* Otto lives here */ }
    else if (!RES.includes(c.id) && !c.hidden) { guest(c, false); return; }
    else if (!RES.includes(c.id)) return;
    if (c.id !== "otto" && c.id !== "vance") {
      if (!c.hidden && !(c.task && c.task.label === "leave")) setTask(c.id, [{ spot: SPOTS.elev, dur: 0, leave: true }], "leave");
      if (c.task) runTask(c);
      return;
    }
  }
  if (c.id === "grok") return guest(c, EXEC.ceoNow() && !(EXEC.downNow() && EXEC.downNow().who === "vance"), "vance", "WEEKLY RISK, SIR.");
  if (c.id === "nancy") return guest(c, EXEC.chairNow() && !(EXEC.downNow() && EXEC.downNow().who === "mags"), "mags", "JUST A HUNCH, CHAIR.");
  if (RES.includes(c.id)) return resident(c);
}

let bgKey = "";
function theme() {
  const d = EXEC.dayKey(), [y, m, da] = d.split("-").map(Number);
  const id = m === 10 ? "halloween" : m === 12 ? "holiday" : m === 11 ? "harvest" : m === 1 ? "newyear" : m === 2 ? "valentine" : m === 3 ? "stpat" : m === 7 ? "july4" : m === 4 || m === 5 ? "spring" : m === 6 || m === 8 ? "summer" : "fall";
  const r = EXEC.fnv(d + ":wx");
  const weather = (m === 12 || m === 1 || m === 2) ? (r < 0.45 ? "snow" : "clear") : r < 0.14 ? "rain" : "clear";
  const wd = new Date(Date.UTC(y, m - 1, da)).getUTCDay();
  const party = EXEC.fnv(d + ":ph:party") < (wd === 5 ? 0.55 : 0.22) ? (wd === 5 ? "pizza" : EXEC.fnv(d + ":ph:k") < 0.5 ? "toast" : "anniversary") : null;
  return { id, m, d: da, weather, party, k: d };
}
function partyOn() { const t = theme(); if (!t.party || !EXEC.workday()) return false; const h = etNow().h; return h >= 15.4 && h < 16.8; }
function partyLine() { const p = theme().party; return p === "pizza" ? "PIZZA FRIDAY. UPSTAIRS TOO." : p === "anniversary" ? "TO THE FIRM." : "A SMALL TOAST."; }

function drawBg() {
  const th = theme();
  for (let y = 3; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) {
    const px = x * TS, py = y * TS;
    R(gb, px, py, 16, 16, (x + y) % 2 ? "#6a5038" : "#7a5c40");
    R(gb, px, py + 15, 16, 1, "#4a3424");
  }
  for (let y = 3; y <= 7; y++) for (let x = 19; x <= 24; x++) R(gb, x * TS, y * TS, 16, 16, "#5b1f2a");
  for (let y = 3; y <= 7; y++) for (let x = 1; x <= 6; x++) R(gb, x * TS, y * TS, 16, 16, "#1e3a5f");
  R(gb, 9 * TS, 10 * TS, 6 * TS, 4 * TS, "#2a2118");
  R(gb, 15 * TS, 16 * TS, 3 * TS, 16, "#c79a3a");
  R(gb, 0, 0, LW, 3 * TS, "#2a2118");
  R(gb, 0, 36, LW, 12, "#4a3020"); R(gb, 0, 36, LW, 2, "#c79a3a");
  const cols = { halloween: ["#f97316", "#7c3aed"], holiday: ["#166534", "#dc2626"], harvest: ["#c2410c", "#ca8a04"], newyear: ["#facc15", "#e5e7eb"], valentine: ["#e11d48", "#f9a8d4"], stpat: ["#16a34a", "#f8fafc"], july4: ["#dc2626", "#1d4ed8"], spring: ["#f9a8d4", "#4ade80"], summer: ["#facc15", "#38bdf8"], fall: ["#ea580c", "#ca8a04"] }[th.id] || ["#c79a3a"];
  for (let x = 4, i = 0; x < LW; x += 10, i++) { const col = cols[i % cols.length]; R(gb, x, 40, 6, 2, col); R(gb, x + 2, 42, 2, 2, col); }
  R(gb, 330, 6, 70, 26, "#0c1014"); R(gb, 332, 8, 66, 22, "#101820");
  ptext(gb, "CITY", 336, 10, "#f2c14e", 1);
  ptext(gb, th.weather === "snow" ? "SNOW" : th.weather === "rain" ? "RAIN" : "CLEAR", 370, 10, "#e8e2cf", 1);
  if (th.weather !== "clear") R(gb, 332, 16, 66, 12, th.weather === "rain" ? "rgba(80,100,120,.45)" : "rgba(230,240,255,.25)");
  ptextC(gb, "VANCE", 22 * TS + 8, 3 * TS - 10, "#f2c14e", 1);
  ptextC(gb, "MAGS", 4 * TS, 3 * TS - 10, "#93c5fd", 1);
  ptext(gb, "ELEVATOR DOWN", 15 * TS, 16 * TS + 4, "#1a1205", 1);
  bgKey = th.k + th.weather;
}
function drawFurn(f, t) {
  const px = f.x * TS, py = f.y * TS;
  if (f.type === "cdesk" || f.type === "mdesk") {
    const top = f.type === "cdesk" ? "#4a3020" : "#1e3a5f";
    R(g, px, py - 4, 48, 14, top); R(g, px, py - 4, 48, 2, shade(top, 1.3)); R(g, px, py + 10, 48, 6, "#2a1c12");
    R(g, px + 30, py - 12, 14, 9, "#0c1210"); R(g, px + 31, py - 11, 12, 7, "#14532d");
    ptextC(g, f.type === "cdesk" ? "CEO" : "CHAIR", px + 16, py + 1, "#f2c14e", 1);
    R(g, px + 4, py - 2, 3, 6, "#c79a3a");
  } else if (f.type === "btable") {
    R(g, px + 4, py + 4, 56, 24, "#6b4428"); R(g, px + 4, py + 4, 56, 3, "#8a5a32");
    R(g, px + 24, py + 12, 10, 8, "#f5ecd0");
    if (partyOn() && theme().party === "pizza") { R(g, px + 22, py + 10, 16, 12, "#f5e6c8"); R(g, px + 24, py + 12, 12, 8, "#b91c1c"); }
    if (partyOn() && theme().party !== "pizza") { R(g, px + 26, py + 8, 6, 10, "#14532d"); R(g, px + 28, py + 6, 2, 2, "#fde68a"); }
  } else if (f.type === "bar") {
    R(g, px, py - 2, 48, 16, "#3b2416"); R(g, px, py - 2, 48, 3, "#c79a3a");
    R(g, px + 6, py - 10, 12, 9, "#d6d3d1"); R(g, px + 8, py - 8, 8, 4, "#1c1917");
    if (Math.floor(t * 2) % 2) R(g, px + 10, py - 14, 1, 3, "rgba(255,255,255,.7)");
    ptextC(g, "BOARD BAR", px + 24, py + 4, "#f2c14e", 1);
  } else if (f.type === "shelf") {
    R(g, px + 1, py - 16, 14, 32, "#4a3020");
    for (let i = 0; i < 4; i++) R(g, px + 3, py - 12 + i * 7, 10, 4, ["#7f1d1d", "#1e3a5f", "#14532d", "#a16207"][i]);
  } else if (f.type === "trophy") {
    R(g, px + 4, py - 10, 8, 14, "#3a2a1a"); R(g, px + 5, py - 18, 6, 8, "#f2c14e"); R(g, px + 3, py - 16, 2, 4, "#f2c14e"); R(g, px + 11, py - 16, 2, 4, "#f2c14e");
    const md = promoView && promoView.executive;
    ptextC(g, md ? "MD" : "OPEN", px + 8, py + 5, "#f2c14e", 1);
  } else if (f.type === "plant") {
    R(g, px + 4, py + 6, 8, 8, "#7c4a2d");
    for (let i = 0; i < 5; i++) R(g, px + 2 + (i % 3) * 4, py + 2 - i, 5, 6, i % 2 ? "#166534" : "#22c55e");
    if (theme().id === "halloween") { R(g, px + 4, py - 2, 8, 6, "#f97316"); R(g, px + 6, py - 4, 2, 2, "#15803d"); }
    if (theme().id === "holiday") { R(g, px + 6, py - 8, 4, 6, "#166534"); R(g, px + 7, py - 10, 2, 2, "#fde68a"); }
  }
}
function drawChar(c, t) {
  const k = CAST[c.id]; if (!k) return;
  const sitting = c.pose === "sit" && !c.moving && !(c.path && c.path.length);
  const fx = Math.round(c.x), fy = Math.round(c.y + (sitting ? 3 : 6)), x0 = fx - 7, top = fy - 24;
  const walk = c.moving ? Math.floor(c.walkT * 8) % 2 : 0;
  g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(fx - 6, fy - 1, 12, 3);
  if (!sitting) {
    R(g, x0 + 3, top + 19, 3, 4 - walk, k.pants); R(g, x0 + 8, top + 19, 3, 4 - (1 - walk), k.pants);
    R(g, x0 + 3, top + 22, 3, 1, "#111"); R(g, x0 + 8, top + 22, 3, 1, "#111");
  }
  R(g, x0 + 2, top + 11, 10, 8, k.shirt); R(g, x0 + 2, top + 11, 10, 1, shade(k.shirt, 1.25));
  if (k.tie && c.face === "S") R(g, x0 + 6, top + 12, 2, 5, k.tie);
  R(g, x0, top + 12, 2, 5, k.shirt); R(g, x0 + 12, top + 12, 2, 5, k.shirt);
  R(g, x0, top + 17, 2, 1, k.skin); R(g, x0 + 12, top + 17, 2, 1, k.skin);
  R(g, x0 + 1, top + 1, 12, 10, k.skin);
  if (c.face === "N") R(g, x0 + 1, top, 12, 10, k.hair);
  else {
    R(g, x0 + 1, top, 12, 3, k.hair); R(g, x0, top + 1, 2, 6, k.hair); R(g, x0 + 12, top + 1, 2, 6, k.hair);
    if (k.long) { R(g, x0, top + 1, 2, 12, k.hair); R(g, x0 + 12, top + 1, 2, 12, k.hair); }
    const ex = c.face === "E" ? [7, 10] : c.face === "W" ? [3, 6] : [4, 9];
    R(g, x0 + ex[0], top + 5, 2, 2, "#1b1b1b"); R(g, x0 + ex[1], top + 5, 2, 2, "#1b1b1b");
    if (k.acc === "glasses") { R(g, x0 + ex[0] - 1, top + 4, 4, 3, "rgba(186,230,253,.8)"); R(g, x0 + ex[1] - 1, top + 4, 4, 3, "rgba(186,230,253,.8)"); }
    if (k.acc === "ceo" || k.acc === "jefe") { R(g, x0, top - 2, 14, 3, "#3a2a1a"); R(g, x0 + 2, top - 5, 10, 4, "#3a2a1a"); }
    if (k.acc === "pearls") R(g, x0 + 4, top + 11, 6, 1, "#f8fafc");
    if (k.acc === "jefe" && c.face === "S") R(g, x0 + 5, top + 13, 4, 1, "#f2c14e");
  }
  if (theme().id === "halloween" && c.face !== "N" && c.id !== "vance") R(g, x0 + 3, top + 4, 8, 2, "#111");
  if (c.bubble && c.bubble.until > T) {
    const bw = Math.min(120, 6 + c.bubble.text.length * 4);
    R(g, fx - bw / 2, top - 16, bw, 12, "#fbf3dc"); R(g, fx - bw / 2, top - 16, bw, 1, "#1d1a12");
    ptext(g, c.bubble.text.slice(0, 22), fx - bw / 2 + 2, top - 14, "#1d1a12", 1);
  }
}
function render(t) {
  if (bgKey !== theme().k + theme().weather) drawBg();
  g.drawImage(bg, 0, 0);
  const th = theme();
  if (th.id === "halloween" || th.id === "holiday" || th.id === "july4") {
    const cols = th.id === "july4" ? ["#ef4444", "#f8fafc", "#60a5fa"] : ["#fde68a", "#f97316", "#22c55e"];
    for (let x = 8, i = 0; x < LW; x += 14, i++) if ((Math.floor(t * 2) + i) % 3) R(g, x, 44, 2, 2, cols[i % cols.length]);
  }
  if (partyOn()) ptextC(g, theme().party === "pizza" ? "PIZZA FRIDAY" : theme().party === "anniversary" ? "TO THE FIRM" : "A TOAST", LW / 2, 52, "#f2c14e", 1);
  const items = [];
  for (const f of FURN) items.push({ y: (f.y + f.h) * TS, f });
  for (const id of ORDER) { const c = chars[id]; if (!c.hidden) items.push({ y: c.y + 6, c }); }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) { if (it.f) drawFurn(it.f, t); else drawChar(it.c, t); }
  const ctx2 = cv.getContext("2d"); ctx2.imageSmoothingEnabled = false;
  ctx2.clearRect(0, 0, cv.width, cv.height);
  ctx2.drawImage(frame, 0, 0, LW, LH, 0, 0, cv.width, cv.height);
}
function renderPanel() {
  const a = EXEC.agenda(), th = theme();
  $("themePill").textContent = th.party && partyOn() ? th.party.toUpperCase() : th.id.toUpperCase();
  $("agenda").innerHTML =
    `<div>CEO ← El Jefe <b>${a.ceo}</b> ${EXEC.ceoNow() ? '<b class="up">NOW</b>' : ""}</div>` +
    `<div>Chair ← Nancy <b>${a.chair}</b> ${EXEC.chairNow() ? '<b class="up">NOW</b>' : ""}</div>` +
    `<div>Nancy also sees El Jefe downstairs <b>${a.jefe}</b></div>` +
    `<div>Downstairs visit <b>${a.down}</b> ${EXEC.downNow() ? '<b class="up">NOW</b>' : ""}</div>` +
    `<div class="mut">${th.weather}${th.party ? " · " + th.party + " late day" : ""} · ${a.day}</div>`;
  $("roster").innerHTML = ORDER.map((id) => {
    const c = chars[id];
    const plan = EXEC.downPlan(EXEC.dayKey());
    const where = c.hidden
      ? (!RES.includes(id) ? "downstairs" : (plan && plan.who === id && EXEC.downNow() ? "downstairs" : "out"))
      : (c.task && c.task.label) || "in the office";
    return `<div class="row" data-id="${id}"><span class="sw" style="background:${COL[id]}"></span><span class="nm">${CAST[id].name}</span><span class="grow">${c.hidden ? '<span class="mut">' + where + "</span>" : where}</span></div>`;
  }).join("");
  $("board").innerHTML = RES.map((id) => `<div class="row"><span class="sw" style="background:${COL[id]}"></span><span class="nm">${CAST[id].name}</span><span class="grow mut">${CAST[id].role}</span></div>`).join("") +
    `<div class="mut" style="margin-top:6px">Vance is El Jefe's boss. Mags is Nancy's. Wade, Priya, and Otto sit the board table. One of them drops downstairs on the days the agenda says so.</div>` +
    floorPromoHtml();
  const e = etNow();
  $("clock").textContent = ((e.hh % 12) || 12) + ":" + String(e.mm).padStart(2, "0") + (e.h < 12 ? " AM" : " PM") + " ET";
  $("upd").textContent = "cosmetic floor · zero tokens · " + a.day;
}

let promoView = null;
function floorPromoHtml() {
  if (!promoView || !window.PROMO) return `<div class="mut" style="margin-top:8px">Floor promotions load with the month board.</div>`;
  const m = promoView.manager, e = promoView.executive;
  const pend = (promoView.pendingLog || []).filter((x) => x.to !== "associate");
  const risk = (promoView.pendingLog || []).filter((x) => x.to === "associate");
  let h = `<div style="margin-top:8px;font-weight:800;color:var(--gold)">FROM THE FLOOR</div>`;
  h += `<div class="row"><span class="nm">MGR</span><span class="grow">${m ? escPh(m.name) + " · " + escPh(m.title) : "OPEN"}</span></div>`;
  h += `<div class="row"><span class="nm">MD</span><span class="grow">${e ? escPh(e.name) + " · Managing Director" : "OPEN"}</span></div>`;
  if (promoView.monthOpen && pend.length) h += `<div class="mut">If ${escPh(promoView.period)} closed today: ${pend.map((x) => escPh((promoView.people[x.bot] && promoView.people[x.bot].name) || x.bot) + " would make " + x.title).join("; ")}. Not final.</div>`;
  else h += `<div class="mut">Earned off the month board, not appointed. Titles wait for a final month.</div>`;
  if (risk.length) h += `<div class="mut">Chair at risk: back to Associate if the month closed today. Not a firing.</div>`;
  return h;
}
function escPh(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (m) => m === "&" ? "&" + "amp;" : m === "<" ? "&" + "lt;" : m === ">" ? "&" + "gt;" : "&" + "quot;"); }
async function pollPromo() {
  try {
    const r = await fetch("state.json?ts=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    promoView = PROMO.review(await r.json());
  } catch (e) { /* no book on this snapshot */ }
}
pollPromo();
setInterval(pollPromo, 20000);

let acc = 0, last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; acc += dt; T += dt;
  while (acc > 0.25) { acc -= 0.25; for (const id of ORDER) director(chars[id]); }
  for (const id of ORDER) stepMove(chars[id], dt);
  render(now / 1000); renderPanel();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

let ZOOM = 1;
function layout() {
  const desk = matchMedia("(min-width:760px) and (min-aspect-ratio:1/1)").matches;
  const w = $("floorWrap").clientWidth || innerWidth, h = desk ? $("floorWrap").clientHeight : w * LH / LW;
  const sc = ZOOM * Math.max(1, Math.floor(Math.min(w / LW, (desk ? h : w) / LH)));
  cv.width = LW * sc; cv.height = LH * sc; cv.style.width = (LW * sc) + "px"; cv.style.height = (LH * sc) + "px";
}
$("zoomBtn").onclick = () => { ZOOM = ZOOM > 1 ? 1 : 1.6; $("floorWrap").classList.toggle("zoomed", ZOOM > 1); layout(); };
addEventListener("resize", () => layout()); layout();
$("cardX").onclick = () => { $("card").classList.add("hidden"); selected = null; };
$("roster").addEventListener("click", (ev) => {
  const row = ev.target.closest("[data-id]"); if (!row) return;
  const id = row.dataset.id, k = CAST[id], c = chars[id];
  selected = id;
  $("cardBody").innerHTML = `<h3>${k.name}</h3><div>${k.role || ""}</div><div class="mut">${c.hidden ? "Not on this floor right now." : "On the penthouse."}</div>`;
  $("card").classList.remove("hidden");
});
function fadeTo(href, nav, html) {
  let f = document.getElementById("phFade");
  if (!f) {
    f = document.createElement("div"); f.id = "phFade";
    f.style.cssText = "position:fixed;inset:0;z-index:80;background:#100e0a;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;color:#f2c14e;font-weight:900;letter-spacing:.14em;font-size:15px;text-align:center;pointer-events:none";
    document.body.appendChild(f);
  }
  f.innerHTML = html;
  try { sessionStorage.setItem("floorNav", nav); } catch (e) { /* private */ }
  setTimeout(() => { location.href = href; }, 420);
}
function goFloor(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  fadeTo("index.html", "fromPH", "&#9660; TRADING FLOOR<small style=\"color:#e7c56a;font-size:11px;letter-spacing:.08em\">ONE FLIGHT DOWN</small>");
}
function goB1stair(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  fadeTo("b1.html", "fromPH", "&#9660; RESEARCH INC.<small style=\"color:#7fbfc8;font-size:11px;letter-spacing:.08em\">B1 · TWO FLIGHTS DOWN</small>");
}
$("downBtn").addEventListener("click", goFloor);
const b1Btn = $("b1Btn"); if (b1Btn) b1Btn.addEventListener("click", goB1stair);
cv.addEventListener("click", (ev) => {
  const r = cv.getBoundingClientRect();
  const lx = (ev.clientX - r.left) * (cv.width / r.width) / SC, ly = (ev.clientY - r.top) * (cv.height / r.height) / SC;
  let best = null;
  for (const id of ORDER) {
    const c = chars[id]; if (c.hidden) continue;
    if (lx >= c.x - 9 && lx <= c.x + 9 && ly >= c.y - 22 && ly <= c.y + 8) if (!best || c.y > best.y) best = c;
  }
  if (best) {
    selected = best.id; const k = CAST[best.id];
    $("cardBody").innerHTML = `<h3>${k.name}</h3><div>${k.role || ""}</div><div class="mut">On the penthouse.</div>`;
    $("card").classList.remove("hidden"); return;
  }
  for (const h of HOT) if (lx >= h.x && lx <= h.x + h.w && ly >= h.y && ly <= h.y + h.h) return h.id === "b1" ? goB1stair() : goFloor();
  $("card").classList.add("hidden"); selected = null;
});
