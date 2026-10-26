/* CEO floor: latest weekday Daily Report (daily_report.json, refreshed by the publisher after each close). Display only. */
(function () {
  var el = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var dateET = function (iso) {
    var p = String(iso || "").split("-"); if (p.length !== 3) return "";
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };
  function render(r) {
    el("rptTitle").textContent = "\uD83D\uDCCA DAILY REPORT \u00B7 " + (dateET(r.date) || r.date || "");
    el("rptUpd").textContent = r.generated_at_et ? "updated " + r.generated_at_et : "";
    var h = "";
    if (r.text) h += '<div class="txt">' + esc(r.text) + "</div>";
    (r.sections || []).forEach(function (s) {
      h += "<h4>" + esc(s.h) + "</h4><ul>" + (s.lines || []).map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>";
    });
    if (r.salmon) h += '<div class="sal">' + esc(r.salmon) + "</div>";
    h += '<div class="ft">Simulated money only. New report every weekday after the close.</div>';
    el("rptBody").innerHTML = h;
  }
  function load() {
    fetch("daily_report.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (x) { if (!x.ok) throw new Error(x.status); return x.json(); })
      .then(render)
      .catch(function () { if (!el("rptBody").dataset.ok) el("rptBody").innerHTML = '<span class="mut">Daily report not available yet. It posts each weekday after the close.</span>'; });
  }
  var _r = render; render = function (r) { _r(r); el("rptBody").dataset.ok = "1"; };
  load(); setInterval(load, 10 * 60 * 1000);
})();
