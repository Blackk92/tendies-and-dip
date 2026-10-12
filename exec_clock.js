"use strict";
/* Shared executive schedule for the penthouse, the trading floor, and Research Inc. B1.
   Same ET date seed on every page, so a meeting you see upstairs is the same meeting they left for downstairs.
   Cosmetic only. Never writes the paper book. */
(function () {
  function fnv(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  const Q = new URLSearchParams(location.search);
  const ovDate = /^\d{4}-\d{2}-\d{2}$/.test(Q.get("date") || "") ? Q.get("date") : null;
  const ovHour = Q.has("hour") && isFinite(+Q.get("hour")) ? +Q.get("hour") : null;
  const force = new Set(String(Q.get("meet") || "").toLowerCase().split(",").filter(Boolean));
  const LOOK = {
    vance: { name: "RYAN", role: "CEO", skin: "#e0ac69", hair: "#d5d5d5", shirt: "#1c2430", pants: "#1c2430", tie: "#c79a3a", acc: "ceo" },
    mags: { name: "MAGS", role: "Board chair", skin: "#f1d0b5", hair: "#6b3048", shirt: "#1e3a5f", pants: "#1e3a5f", long: 1, acc: "pearls" },
    wade: { name: "WADE", role: "Board · finance", skin: "#c68642", hair: "#3a2a1a", shirt: "#14532d", pants: "#14261c", tie: "#e7c56a" },
    priya: { name: "PRIYA", role: "Board · risk", skin: "#8d5524", hair: "#1a1a1a", shirt: "#7f1d1d", pants: "#3b1515", long: 1 },
    otto: { name: "OTTO", role: "Board · old money", skin: "#f1c27d", hair: "#eeeeee", shirt: "#3f3f46", pants: "#27272a", acc: "glasses" },
  };
  const IDS = Object.keys(LOOK);
  function dayKey() {
    if (window.TND && window.TND.dayKey) return window.TND.dayKey();
    if (ovDate) return ovDate;
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  }
  function clock() {
    if (typeof etNow === "function") {
      const e = etNow();
      return { h: ovHour != null ? ovHour : e.h, wd: e.wd };
    }
    return { h: ovHour != null ? ovHour : 12, wd: "Mon" };
  }
  function weekday() {
    const d = dayKey(), [y, m, da] = d.split("-").map(Number);
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(Date.UTC(y, m - 1, da)).getUTCDay()];
  }
  function workday() { const w = weekday(); return w !== "Sat" && w !== "Sun"; }
  function jefeH(day) { let mt = 10 + fnv(day + ":nj") * 5.25; if (Math.abs(mt - 12.05) < 0.5) mt += 1.2; return mt; }
  function ceoH(day) {
    let t = 9.65 + fnv(day + ":ceo") * 1.15;
    if (Math.abs(t - jefeH(day)) < 0.4) t = 15.15;
    return t;
  }
  function chairH(day) {
    let t = 13.45 + fnv(day + ":chair") * 1.15;
    const mt = jefeH(day), ce = ceoH(day);
    if (Math.abs(t - mt) < 0.35 || Math.abs(t - ce) < 0.4) t = 15.55;
    return t;
  }
  const CEO_LEN = 0.32, CHAIR_LEN = 0.28, DOWN_LEN = 0.22;
  function downPlan(day) {
    if (!workday() && !force.has("down") && !force.has("all")) return null;
    if (fnv(day + ":down") > 0.42 && !force.has("down") && !force.has("all")) return null;
    const who = IDS[Math.floor(fnv(day + ":dwho") * IDS.length)];
    const floor = fnv(day + ":dfl") < 0.55 ? "main" : "b1";
    let start = 11.15 + fnv(day + ":dt") * 1.05;
    const blocked = [[ceoH(day), CEO_LEN], [chairH(day), CHAIR_LEN], [jefeH(day), 0.1], [12.0, 0.45]];
    if (blocked.some(([a, len]) => start < a + len && start + DOWN_LEN > a)) start = 16.05;
    return { who, floor, start, len: DOWN_LEN };
  }
  function inWin(start, len) {
    if (!workday() && !force.size) return false;
    const h = clock().h;
    return h >= start && h < start + len;
  }
  function hhmm(h) {
    let mins = Math.round(h * 60);
    mins = ((mins % 1440) + 1440) % 1440;
    const hh = Math.floor(mins / 60), mm = mins % 60;
    const hr = ((hh + 11) % 12) + 1, ap = hh < 12 || hh === 24 ? "AM" : "PM";
    return hr + ":" + String(mm).padStart(2, "0") + " " + ap;
  }
  const LINES = {
    vance: ["HOW'S THE WEEK.", "RISK FIRST. THEN TENDIES.", "DON'T MAKE ME COME DOWN AGAIN."],
    mags: ["NANCY. A WORD.", "EARLY, AS USUAL.", "PEARLS ON. RISK OFF."],
    wade: ["FINANCE WALK-THROUGH.", "CASH IS A POSITION.", "SHOW ME THE BOOK."],
    priya: ["WHERE IS THE STOP.", "OPEN RISK. NOW.", "I READ THE MEMO."],
    otto: ["IS THE COFFEE ON.", "I WAS IN THE NEIGHBORHOOD.", "LOVELY FLOOR. TOO LOUD."],
  };
  window.EXEC = {
    LOOK, IDS, ovHour, ovDate, CEO_LEN, CHAIR_LEN,
    dayKey, clock, weekday, workday, hhmm, fnv,
    ceoH, chairH, jefeH, downPlan,
    look: (id) => LOOK[id] || LOOK.vance,
    name: (id) => (LOOK[id] && LOOK[id].name) || String(id || "").toUpperCase(),
    ceoNow: () => force.has("ceo") || force.has("all") || inWin(ceoH(dayKey()), CEO_LEN),
    chairNow: () => force.has("chair") || force.has("all") || inWin(chairH(dayKey()), CHAIR_LEN),
    downNow: () => {
      if (force.has("down") || force.has("all")) {
        const p = downPlan(dayKey()) || { who: "vance", floor: force.has("b1") ? "b1" : "main", start: 0, len: 24 };
        return p;
      }
      const p = downPlan(dayKey());
      if (!p) return null;
      return inWin(p.start, p.len) ? p : null;
    },
    downLine: (id) => LINES[id] || LINES.vance,
    agenda: () => {
      const d = dayKey(), down = downPlan(d);
      return {
        day: d,
        ceo: hhmm(ceoH(d)),
        chair: hhmm(chairH(d)),
        jefe: hhmm(jefeH(d)),
        down: down ? hhmm(down.start) + " " + LOOK[down.who].name + " → " + (down.floor === "b1" ? "B1" : "FLOOR") : "none",
      };
    },
  };
})();
