/* CEO floor: weekly reviews (weekly_reviews.json), W47 and later, refreshed by the publisher. Display only. */
(function () {
  var el = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function one(w, open) {
    var title = esc(w.title || w.week || w.id || "Weekly review");
    var body = esc(w.text || "");
    return "<details" + (open ? " open" : "") + "><summary>" + title + "</summary><div class=\"txt\">" + body + "</div></details>";
  }
  function render(d) {
    var weeks = d.weeks || [];
    el("wkTitle").textContent = weeks[0] ? "WEEKLY REVIEW \u00B7 " + (weeks[0].week || weeks[0].id || "") : "WEEKLY REVIEW";
    el("wkUpd").textContent = d.generated_at_et ? "updated " + d.generated_at_et : "";
    if (!weeks.length) {
      el("wkBody").innerHTML = '<span class="mut">No weekly review published yet.</span>';
      return;
    }
    var h = weeks.map(function (w, i) { return one(w, i === 0); }).join("");
    h += '<div class="ft">Simulated money only. A new review posts each Friday after the close.</div>';
    el("wkBody").innerHTML = h;
  }
  function load() {
    fetch("weekly_reviews.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (x) { if (!x.ok) throw new Error(x.status); return x.json(); })
      .then(render)
      .catch(function () { if (!el("wkBody").dataset.ok) el("wkBody").innerHTML = '<span class="mut">Weekly review not available yet.</span>'; });
  }
  var _r = render; render = function (d) { _r(d); el("wkBody").dataset.ok = "1"; };
  if (el("wkBody")) { load(); setInterval(load, 10 * 60 * 1000); }
})();
