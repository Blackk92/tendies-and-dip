"use strict";
/* Promotion review for Tendies and Dip.
   Read-only. Uses the Employee of the Month board already in state.json.
   Does not hire, fire, trade, or write the paper book.
   Titles change only when a month is final. The open month is the race. */
(function (root) {
  const LAID = new Set(["dash", "vee", "snap"]);
  const DEAD = new Set(["benched", "no edge", "unqualified", "desk closed"]);
  const TRACK = {
    trek: "trading", dip: "trading", rota: "trading", zip: "trading", drift: "trading",
    owl: "trading", snapback: "trading", payday: "trading", dash: "trading", vee: "trading", snap: "trading",
    knobs: "platform", pixel: "platform",
  };
  function laidOff() {
    if (typeof LAID_OFF !== "undefined" && LAID_OFF && typeof LAID_OFF.has === "function") return LAID_OFF;
    return LAID;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (m) => m === "&" ? "&" + "amp;" : m === "<" ? "&" + "lt;" : m === ">" ? "&" + "gt;" : "&" + "quot;");
  }
  function num(v) { const n = +v; return isFinite(n) ? n : 0; }
  function forceClose() {
    try {
      if (typeof location === "undefined") return false;
      return /(?:^|[?&])promo=close(?:&|$)/.test(location.search || "");
    } catch (e) { return false; }
  }
  function personName(S, id) {
    const hit = (S && S.roster || []).find((r) => r && r.bot === id);
    if (hit && hit.name) return hit.name;
    if (typeof CAST !== "undefined" && CAST[id] && CAST[id].name) return CAST[id].name;
    return String(id || "").replace(/^./, (c) => c.toUpperCase());
  }
  function statusOf(S, id) {
    const b = S && S.bots && S.bots[id];
    return b && b.status ? String(b.status) : "";
  }
  function blockedReason(S, id) {
    if (!TRACK[id]) {
      if (id === "goldie") return "judges the review";
      if (id === "grok") return "already the boss";
      if (id === "indy") return "the benchmark, not staff";
      return "not on a promotion track";
    }
    if (laidOff().has(id)) return "laid off";
    const st = statusOf(S, id);
    if (st === "desk closed") return "desk closed";
    if (st === "benched") return "benched. Not hired onto a chair";
    if (st === "no edge") return "no edge. Not eligible";
    if (st === "unqualified") return "unqualified";
    if (DEAD.has(st)) return st;
    return "";
  }
  function rowsOf(block) {
    if (!block) return [];
    if (Array.isArray(block.leaderboard) && block.leaderboard.length) {
      return block.leaderboard.map((r) => ({ bot: r.bot, score: num(r.score), losing: num(r.losing), detail: r.detail || "" }));
    }
    if (block.winner) return [{ bot: block.winner, score: num(block.score), losing: num(block.losing_trades != null ? block.losing_trades : block.losing), detail: "" }];
    return [];
  }
  function collectClosed(aw) {
    const out = [];
    const seen = new Set();
    const push = (period, block) => {
      const p = String(period || "");
      if (!p || seen.has(p)) return;
      const rows = rowsOf(block);
      if (!rows.length) return;
      seen.add(p);
      out.push({ period: p, leaderboard: rows });
    };
    for (const h of (aw && aw.hall) || []) push(h && (h.period || h.name), h);
    if (aw && aw.last_month && aw.last_month.winner) push(aw.last_month.period, aw.last_month);
    if (aw && aw.month && aw.month.final) push(aw.month.period, aw.month);
    return out;
  }
  function eligibleRows(rows, S, level) {
    return rows
      .filter((r) => r && r.bot && !blockedReason(S, r.bot) && (level[r.bot] || 0) < 2 && !(num(r.losing) > 0))
      .slice()
      .sort((a, b) => (b.score - a.score) || String(a.bot).localeCompare(String(b.bot)));
  }
  function managerTitle(id) {
    if (id === "knobs") return "R&D Manager";
    if (id === "pixel") return "Data Manager";
    return "Swing Desk Manager";
  }
  function titleFor(id, level) {
    if (level >= 2) return "Managing Director";
    if (level === 1) return managerTitle(id);
    return "Associate";
  }
  function replay(months, S) {
    const level = {};
    let manager = null;
    let executive = null;
    let miss = 0;
    const log = [];
    for (const m of months) {
      const ranked = eligibleRows(m.leaderboard, S, level);
      const top = ranked[0];
      const clears = !!(top && top.score > 0 && !(top.losing > 0));
      if (manager && (level[manager] || 0) === 1) {
        const won = clears && top.bot === manager;
        if (won && !executive) {
          level[manager] = 2;
          log.push({ period: m.period, bot: manager, from: "manager", to: "executive", title: "Managing Director" });
          executive = manager;
          manager = null;
          miss = 0;
          continue;
        }
        miss = won ? 0 : miss + 1;
        if (miss >= 2) {
          log.push({ period: m.period, bot: manager, from: "manager", to: "associate", title: "Associate", why: "lost the chair" });
          level[manager] = 0;
          manager = null;
          miss = 0;
        }
      }
      const again = eligibleRows(m.leaderboard, S, level);
      const next = again.find((r) => r.score > 0 && (level[r.bot] || 0) === 0);
      if (!manager && next) {
        level[next.bot] = 1;
        manager = next.bot;
        miss = 0;
        log.push({ period: m.period, bot: next.bot, from: "associate", to: "manager", title: managerTitle(next.bot) });
      }
    }
    return { level, manager, executive, miss, log };
  }
  let cache = null, cacheKey = "";
  function review(S) {
    const aw = (S && S.awards) || {};
    const live = aw.month || null;
    const key = [
      S && S.updated,
      live && live.period,
      live && live.final,
      live && live.leaderboard && live.leaderboard.map((r) => r.bot + ":" + r.score).join(","),
      aw.last_month && aw.last_month.period,
      (aw.hall || []).length,
      forceClose() ? "close" : "",
    ].join("|");
    if (cache && cacheKey === key) return cache;
    const closed = collectClosed(aw);
    const held = replay(closed, S);
    const monthOpen = !!(live && live.leaderboard && live.leaderboard.length && !live.final && !forceClose());
    const pretend = (monthOpen || forceClose()) && live && !live.final
      ? replay(closed.concat([{ period: (live && live.period) || "month", leaderboard: rowsOf(live) }]), S)
      : held;
    const use = monthOpen ? held : pretend;
    const names = {};
    const seat = (id, lvl) => id ? { id, name: personName(S, id), title: titleFor(id, lvl), level: lvl === 2 ? "executive" : "manager" } : null;
    const people = {};
    const note = (id) => {
      if (people[id]) return;
      const lvl = use.level[id] || 0;
      const plvl = pretend.level[id] || 0;
      people[id] = {
        id, name: personName(S, id),
        level: lvl >= 2 ? "executive" : lvl === 1 ? "manager" : "associate",
        title: titleFor(id, lvl),
        track: TRACK[id] || "",
        blocked: blockedReason(S, id),
      };
      if (monthOpen && plvl !== lvl) {
        people[id].pending = plvl > lvl ? titleFor(id, plvl) : "Associate";
        people[id].pendingDir = plvl > lvl ? "up" : "down";
      }
    };
    for (const id of Object.keys(TRACK)) note(id);
    for (const id of Object.keys(use.level)) note(id);
    for (const id of Object.keys(pretend.level)) note(id);
    const liveRows = rowsOf(live);
    for (const r of liveRows) note(r.bot);
    const rankedNow = eligibleRows(liveRows, S, monthOpen ? held.level : use.level);
    const top = rankedNow.find((r) => r.score > 0 && !(r.losing > 0)) || null;
    cacheKey = key;
    cache = {
      monthOpen, forced: forceClose() && !(live && live.final),
      period: (live && live.period) || (aw.last_month && aw.last_month.period) || "",
      held, pretend, people, top,
      manager: seat(use.manager, 1),
      executive: seat(use.executive, 2),
      pendingManager: monthOpen ? seat(pretend.manager, 1) : null,
      pendingExecutive: monthOpen ? seat(pretend.executive, 2) : null,
      log: use.log,
      pendingLog: monthOpen ? pretend.log.slice(held.log.length) : [],
      liveRows, names,
    };
    return cache;
  }
  function of(id) {
    try {
      if (typeof S === "undefined" || !S) return null;
      const p = review(S).people[id];
      return p || null;
    } catch (e) { return null; }
  }
  function blurb(S, id) {
    const r = review(S);
    const p = r.people[id];
    if (!p) return "";
    if (p.blocked) return `<div class="mut">Promotion: out. ${esc(p.blocked)}.</div>`;
    let h = `<div>Title: <b>${esc(p.title)}</b></div>`;
    if (p.level === "associate") h += `<div class="mut">Competing for the manager chair. One rung at a time. Executive is the rung after manager.</div>`;
    if (p.level === "manager") h += `<div class="mut">Holds the only manager chair. Wins the next closed month outright and becomes Managing Director. Misses #1 for two closed months and goes back to Associate. Not fired.</div>`;
    if (p.level === "executive") h += `<div class="mut">Managing Director. Earned from the floor. Out of the promotion pool, so the next name can take the open manager chair.</div>`;
    if (p.pending && p.pendingDir === "up") h += `<div>If this month closed today: <b>would make ${esc(p.pending)}</b>. Not final yet.</div>`;
    if (p.pending && p.pendingDir === "down") h += `<div>If this month closed today: <b>would lose the chair</b> and go back to Associate.</div>`;
    const row = r.liveRows.find((x) => x.bot === id);
    if (row && row.score < 0 && !p.blocked) h += `<div>On the block. Negative month. Same review that promotes the top name. Walking someone out is still the boss's call.</div>`;
    return h;
  }
  function html(S) {
    const r = review(S);
    const seatLine = (label, heldSeat, pend) => {
      const now = heldSeat ? esc(heldSeat.name) + " · " + esc(heldSeat.title) : "OPEN";
      const extra = r.monthOpen && pend && (!heldSeat || pend.id !== heldSeat.id) ? ` <span class="mut">→ if closed today, ${esc(pend.name)}</span>` : "";
      const stays = r.monthOpen && heldSeat && (!pend || pend.id === heldSeat.id) ? "" : "";
      return `<div class="row"><span class="nm">${label}</span><span class="grow">${now}${extra}${stays}</span></div>`;
    };
    let h = `<div style="margin-top:10px;font-weight:800;color:var(--gold);letter-spacing:.08em">PROMOTIONS</div>`;
    h += `<div class="gate">Same meeting as Employee of the Month. Two chairs, and the floor competes for them the way a desk competes to stay open. A title changes only when the month is final.</div>`;
    h += seatLine("MANAGER", r.manager, r.pendingManager);
    h += seatLine("EXECUTIVE", r.executive, r.pendingExecutive);
    if (r.monthOpen) {
      const ups = r.pendingLog.filter((x) => x.to !== "associate");
      const downs = r.pendingLog.filter((x) => x.to === "associate");
      if (ups.length) h += `<div class="gate">If ${esc(r.period)} closed today: ` + ups.map((x) => `<b>${esc(personName(S, x.bot))}</b> → ${esc(x.title)}`).join("; ") + `. Not final. First gold is the Oct 30 close.</div>`;
      else if (!downs.length) h += `<div class="gate">${esc(r.period)} is still open. Nobody clears the bar yet, so both chairs would stay put.</div>`;
      if (downs.length) h += `<div class="gate">Chair at risk if the month closed today: ` + downs.map((x) => `<b>${esc(personName(S, x.bot))}</b> back to Associate`).join("; ") + `.</div>`;
    } else if (!r.manager && !r.executive) {
      h += `<div class="gate">No closed month yet, so nobody has a title. The chairs are open.</div>`;
    }
    if (r.forced) h += `<div class="gate">Preview only. The month is not really closed.</div>`;
    const shown = new Set();
    const verdict = (id, score, losing) => {
      const p = r.people[id] || {};
      if (p.blocked) return ["OUT", p.blocked];
      if (losing > 0) return ["BLOCK", "losing flag. On the block"];
      if (p.pending && p.pendingDir === "up") return ["UP", "would make " + p.pending];
      if (p.pending && p.pendingDir === "down") return ["DOWN", "would lose the chair"];
      if (p.level === "executive") return ["MD", "Managing Director"];
      if (p.level === "manager") return ["MGR", "holds the chair"];
      if (score > 0) return ["IN", "in the packet. Not the top name"];
      if (score < 0) return ["BLOCK", "on the block"];
      return ["FLAT", "zero month. Bar is a positive score"];
    };
    h += `<div style="margin-top:6px;font-weight:800">THIS MONTH</div>`;
    const list = r.liveRows.length ? r.liveRows.slice().sort((a, b) => b.score - a.score) : [];
    if (!list.length) h += `<div class="mut">No month board yet.</div>`;
    list.forEach((row, i) => {
      shown.add(row.bot);
      const [tag, why] = verdict(row.bot, row.score, row.losing);
      const col = tag === "UP" ? "var(--gold)" : tag === "BLOCK" || tag === "DOWN" ? "var(--dn)" : tag === "OUT" ? "var(--dim)" : "inherit";
      h += `<div class="row" title="${esc(why)}"><span class="rank">${i + 1}</span><span class="nm" style="color:${col}">${esc(personName(S, row.bot))}</span><span class="grow mut">${esc(tag)} · ${esc(why)}</span><span class="r ${row.score > 0 ? "up" : row.score < 0 ? "dn" : ""}">${row.score >= 0 ? "+" : ""}${row.score.toFixed(2)}</span></div>`;
    });
    const sidelined = [];
    const pushSide = (id, why) => { if (shown.has(id)) return; shown.add(id); sidelined.push(personName(S, id) + " (" + why + ")"); };
    for (const id of ["dash", "vee", "snap"]) pushSide(id, "laid off");
    for (const id of ["owl", "snapback", "payday"]) if (DEAD.has(statusOf(S, id)) || statusOf(S, id) === "benched") pushSide(id, "not hired");
    if (statusOf(S, "drift")) pushSide("drift", blockedReason(S, "drift") || statusOf(S, "drift"));
    if (sidelined.length) h += `<div class="gate">Not in the race: ${esc(sidelined.join(", "))}.</div>`;
    if (r.log.length) {
      h += `<div style="margin-top:6px;font-weight:800">REVIEW LOG</div>`;
      h += r.log.map((x) => `<div class="sq"><span class="t">${esc(x.period)}</span><span class="w">${esc(personName(S, x.bot))}</span><span class="m">${esc(x.to === "associate" ? "lost the chair" : x.title)}</span></div>`).join("");
    }
    h += `<div class="gate" style="margin-top:6px"><b>Criteria.</b> Employed. Not laid off, not benched, not no-edge. Goldie, El Jefe, and Indy are out. Score has to be positive, with no losing flag. Top eligible name takes the open manager chair. A sitting manager who wins another closed month becomes Managing Director, and that opens the manager chair next review. Two closed months off #1 and the manager is back to Associate. They are not fired. One rung a month. No skips. Silver is a pat on the back, not a promotion. This board does not change who trades.</div>`;
    return h;
  }
  root.PROMO = { review, of, blurb, html, titleFor, blockedReason, TRACK };
})(typeof window !== "undefined" ? window : globalThis);
