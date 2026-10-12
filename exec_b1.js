"use strict";
/* Research Inc. add-on: a board member sometimes comes down the stairs.
   Nancy's trip up to the Chair is scheduled in b1_nancy.js via EXEC.chairNow. */
(function () {
  if (!window.EXEC || typeof window.__b1 !== "object" || typeof director !== "function") return;
  const LOOK = {
    vance: { name: "VANCE", skin: "#e0ac69", hair: "#d5d5d5", shirt: "#1c2430", pants: "#1c2430", tie: "#c79a3a", long: 0 },
    mags: { name: "MAGS", skin: "#f1d0b5", hair: "#6b3048", shirt: "#1e3a5f", pants: "#1e3a5f", long: 1 },
    wade: { name: "WADE", skin: "#c68642", hair: "#3a2a1a", shirt: "#14532d", pants: "#14261c" },
    priya: { name: "PRIYA", skin: "#8d5524", hair: "#1a1a1a", shirt: "#7f1d1d", pants: "#3b1515", long: 1 },
    otto: { name: "OTTO", skin: "#f1c27d", hair: "#eeeeee", shirt: "#3f3f46", pants: "#27272a" },
  };
  CAST.exec = Object.assign({ visitor: 1, desk: "Executive" }, LOOK.vance);
  COL.exec = "#f2c14e";
  chars.exec = { id: "exec", tx: 0, ty: 0, x: 0, y: 0, path: [], moving: false, from: null, goal: null, task: null, face: "N", pose: "stand",
    hidden: true, wait: 0, walkT: 0, bubble: null, emote: null, emoteUntil: 0, jumpUntil: 0, nextErrand: 0, homeKey: null, speed: 3.2, trip: null, carry: false, workUntil: 0 };
  ORDER.push("exec");
  if (!trips.exec) trips.exec = [];
  S_("chair_exec", 12, 16, "S", "stand");

  function stair() { return SPOTS[freeSpot(STAIRS, "exec") || "up_1"]; }
  const _status = status;
  status = function (id) {
    if (id !== "exec") return _status(id);
    const c = chars.exec;
    if (c.hidden) return ["UPSTAIRS", "on executive"];
    if (c.task && c.task.label === "leave") return ["HEADING UP", "back to executive"];
    return ["VISITING", (LOOK[c.who] ? LOOK[c.who].name : "BOARD") + " from executive"];
  };
  const _dir = director;
  director = function (c) {
    if (c.id !== "exec") return _dir(c);
    const win = EXEC.downNow();
    const here = win && win.floor === "b1";
    if (!here) {
      if (!c.hidden) {
        if (!(c.task && c.task.label === "leave")) setTask("exec", [{ spot: stair(), dur: 0, say: "BACK UPSTAIRS", leave: true }], "leave");
        if (c.task) runTask(c);
      }
      return;
    }
    if (c.task && c.task.label !== "visits B1" && c.task.label !== "leave") { c.task = null; c.goal = null; c.path = []; }
    if (c.who !== win.who) { c.who = win.who; Object.assign(CAST.exec, LOOK[win.who] || LOOK.vance, { visitor: 1, desk: "Executive" }); }
    if (c.hidden) {
      const s = stair(); if (!s || occ.has(I(s.x, s.y))) return;
      c.hidden = false; place(c, s.x, s.y); c.face = "N"; c.pose = "stand"; c.task = null;
      const dest = chars.nancy && !chars.nancy.hidden ? (SPOTS.front_nancy || SPOTS.visit_nancy) : SPOTS.coffee_1;
      say("exec", pick(EXEC.downLine(win.who)), 4);
      setTask("exec", [
        dest ? { spot: dest, dur: 14, onArrive: () => { if (chars.nancy && !chars.nancy.hidden) say("nancy", "Executive's here. Kettle's on.", 4); } } : null,
        { spot: s, dur: 0, leave: true },
      ].filter(Boolean), "visits B1");
      return;
    }
    if (c.task) runTask(c);
  };

  const ph = document.getElementById("phBtn");
  if (ph) ph.addEventListener("click", (ev) => {
    ev.preventDefault();
    const f = document.getElementById("fade");
    if (f) { f.classList.remove("off"); f.innerHTML = "<span>&#9650; EXECUTIVE</span><small>PAST THE TRADING FLOOR</small>"; }
    setTimeout(() => { location.href = "top.html?v=exec3"; }, 420);
  });
})();
