"use strict";
/* Trading floor add-on: the penthouse stairs, right beside the Research Inc. stairs.
   El Jefe takes them up for his daily meeting with Vance. A board member sometimes comes down the same flight.
   Loaded last. Does not touch the paper book. */
(function () {
  if (typeof director !== "function" || !window.EXEC || typeof F !== "function") return;
  const PH_KEYS = ["ph_stairs", "ph_stairs_2", "ph_stairs_3"];
  function phSpot(id) {
    const k = (typeof freeSpot === "function" && freeSpot(PH_KEYS, id)) || "ph_stairs";
    return SPOTS[k] || SPOTS.ph_stairs;
  }

  const LOOK = {
    vance: { name: "VANCE", skin: "#e0ac69", hair: "#d5d5d5", shirt: "#1c2430", pants: "#1c2430", tie: "#c79a3a", acc: "jefe" },
    mags: { name: "MAGS", skin: "#f1d0b5", hair: "#6b3048", shirt: "#1e3a5f", pants: "#1e3a5f", long: 1 },
    wade: { name: "WADE", skin: "#c68642", hair: "#3a2a1a", shirt: "#14532d", pants: "#14261c", tie: "#e7c56a" },
    priya: { name: "PRIYA", skin: "#8d5524", hair: "#1a1a1a", shirt: "#7f1d1d", pants: "#3b1515", long: 1 },
    otto: { name: "OTTO", skin: "#f1c27d", hair: "#eeeeee", shirt: "#3f3f46", pants: "#27272a", acc: "glasses" },
  };
  CAST.exec = Object.assign({ visitor: 1 }, LOOK.vance);
  COL.exec = "#f2c14e";
  if (typeof ROLE_SHORT === "object") ROLE_SHORT.exec = "Penthouse · comes downstairs sometimes";
  chars.exec = { id: "exec", tx: 0, ty: 0, x: 0, y: 0, path: [], moving: false, from: null, goal: null, task: null, face: "W", pose: "stand",
    hidden: true, wait: 0, walkT: 0, bubble: null, emote: null, emoteUntil: 0, jumpUntil: 0, nextErrand: 0, homeKey: null, idleSince: 0, speed: 3.2, placed: false, arrivedAt: 0, who: null };
  ORDER.push("exec");
  if (window.__social && window.__social.addOutfitHook) window.__social.addOutfitHook((id, o) => {
    if (id !== "exec") return;
    const keep = LOOK[chars.exec.who] || LOOK.vance;
    for (const k of ["dress", "dots", "pattern", "top", "costume", "hat2", "inner", "jk", "tc", "ring"]) delete o[k];
    Object.assign(o, keep);
  });

  function applyWho(who) {
    if (chars.exec.who === who) return;
    chars.exec.who = who;
    Object.assign(CAST.exec, LOOK[who] || LOOK.vance);
  }

  const _present = present;
  present = function (id) {
    if (id === "exec") return false;
    if (id === "grok" && chars.grok.upstairs) return false;
    // Stale weekend snapshots still let him walk to the stairs for the real CEO meeting.
    if (id === "grok" && EXEC.ceoNow() && !(EXEC.downNow() && EXEC.downNow().who === "vance")) return true;
    return _present(id);
  };
  const _amb = amb;
  amb = function (id, msg) {
    if (id === "grok" && chars.grok.upstairs && msg === "heads home") msg = "takes the stairs up to the CEO";
    if (id === "exec" && msg === "heads home") msg = "heads back up the penthouse stairs";
    _amb(id, msg);
  };
  const _where = whereIs;
  whereIs = function (id) {
    if (id === "grok" && chars.grok.upstairs) return "upstairs with Vance, the CEO";
    if (id === "exec") return chars.exec.hidden ? "up on the penthouse" : "visiting from the penthouse";
    return _where(id);
  };
  const _badge = statusBadge;
  statusBadge = function (id) {
    if (id === "grok" && chars.grok.upstairs) return `<span class="badge b-sit">UPSTAIRS</span>`;
    if (id === "exec") return chars.exec.hidden ? `<span class="badge b-home">PENTHOUSE</span>` : `<span class="badge b-act">VISITING</span>`;
    return _badge(id);
  };

  function sendUp(c) {
    if (c.hidden) return;
    if (c.task && (c.task.label === "up to the CEO" || c.task.label === "leave")) return;
    const sp = phSpot("grok"); if (!sp) return;
    setTask("grok", [{ spot: sp, dur: 0, say: "STAIRS. CEO'S CALLING.", onArrive: () => { c.upstairs = true; }, leave: true }], "up to the CEO");
  }
  function comeDown(c) {
    c.upstairs = false;
    const sp = phSpot("grok");
    if (c.hidden && sp && !occ.has(I(sp.x, sp.y))) {
      c.hidden = false; place(c, sp.x, sp.y); c.pose = "stand"; c.face = "N"; c.task = null; c.goal = null;
      say("grok", "BACK. RISK STILL FIRST.", 4);
      amb("grok", "comes down the penthouse stairs");
    }
  }
  function execVisit(c) {
    const win = EXEC.downNow();
    const here = win && win.floor === "main";
    if (!here) {
      if (!c.hidden) {
        if (!(c.task && c.task.steps.some((s) => s.leave))) setTask("exec", [{ spot: phSpot("exec"), dur: 0, say: "BACK UP THE STAIRS", leave: true }], "back to the penthouse");
        if (c.task) runTask(c);
      }
      return;
    }
    applyWho(win.who);
    if (c.hidden) {
      const sp = phSpot("exec");
      if (!sp || occ.has(I(sp.x, sp.y))) return;
      c.hidden = false; place(c, sp.x, sp.y); c.face = "N"; c.pose = "stand"; c.task = null;
      const dest = chars.grok && !chars.grok.hidden && !chars.grok.upstairs ? SPOTS.front_grok : SPOTS.center;
      amb("exec", EXEC.name(win.who) + " comes down the penthouse stairs");
      setTask("exec", [
        { spot: dest, dur: 16, say: pick(EXEC.downLine(win.who)), onArrive: () => {
          if (chars.grok && !chars.grok.hidden) say("grok", "COME IN.", 3);
          else if (chars.goldie && !chars.goldie.hidden) say("goldie", "PENTHOUSE ON THE FLOOR!", 4);
        } },
        { spot: sp, dur: 0, leave: true },
      ], "visits from the penthouse");
      return;
    }
    if (c.task) runTask(c);
  }

  const _dir = director;
  director = function (c) {
    if (STRESS) return _dir(c);
    if (c.id === "exec") return execVisit(c);
    if (c.id === "grok") {
      const win = EXEC.ceoNow() && !(EXEC.downNow() && EXEC.downNow().who === "vance");
      if (c.upstairs && win) return;
      if (c.upstairs && !win) { comeDown(c); return; }
      if (win && !c.hidden) { sendUp(c); if (c.task) runTask(c); return; }
    }
    _dir(c);
  };

  function goPH(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    let f = document.getElementById("phFade");
    if (!f) {
      f = document.createElement("div"); f.id = "phFade";
      f.style.cssText = "position:fixed;inset:0;z-index:80;background:#100e0a;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#f2c14e;font-weight:900;letter-spacing:.14em;font-size:15px;text-align:center";
      document.body.appendChild(f);
    }
    f.innerHTML = "&#9650; PENTHOUSE<small style=\"color:#e7c56a;font-size:11px;letter-spacing:.1em\">CEO AND THE BOARD</small>";
    try { sessionStorage.setItem("floorNav", "toPH"); } catch (e) { /* private */ }
    setTimeout(() => { location.href = "penthouse.html?v=top2"; }, 420);
  }
  window.goPH = goPH;
  const b = document.getElementById("phBtn"); if (b) b.addEventListener("click", goPH);
  const l = document.getElementById("phLink"); if (l) l.addEventListener("click", goPH);
  let from = null; try { from = sessionStorage.getItem("floorNav"); } catch (e) { /* private */ }
  if (from === "fromPH") {
    try { sessionStorage.removeItem("floorNav"); } catch (e) { /* private */ }
    const f = document.createElement("div");
    f.style.cssText = "position:fixed;inset:0;z-index:80;background:#100e0a;display:flex;align-items:center;justify-content:center;color:#f2c14e;font-weight:900;letter-spacing:.14em;opacity:1;transition:opacity .4s";
    f.textContent = "TRADING FLOOR"; document.body.appendChild(f);
    setTimeout(() => { f.style.opacity = "0"; setTimeout(() => f.remove(), 400); }, 240);
  }
})();
