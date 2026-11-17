/* CEO floor: Board log (board_log.json, rebuilt by the publisher from the private Claude bridge log; sanitized summaries only).
   Display only. Sits under the Daily Report so the report stays first. */
(function () {
  var el = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var BADGE = { "adopted": "#3ddc84", "adopted as a checklist": "#93c5fd", "partly adopted": "#f2c14e", "not adopted": "#ff5c5c", "deferred": "#d4d4d8", "pending": "#8f9a8f", "noted": "#d4d4d8" };
  function item(i) {
    var col = BADGE[i.decision] || "#d4d4d8";
    return '<div class="bl-it"><div class="bl-q">' + esc(i.question) + "</div>" +
      (i.advice ? '<div><span class="mut">Claude:</span> ' + esc(i.advice) + "</div>" : "") +
      '<div><span class="bl-b" style="border-color:' + col + ";color:" + col + '">' + esc(String(i.decision || "").toUpperCase()) + "</span> " + esc(i.why || "") + "</div>" +
      (i.performance ? '<div><span class="mut">How it\u2019s doing:</span> ' + esc(i.performance) + "</div>" : "") + "</div>";
  }
  function render(d) {
    var bs = d.batches || [];
    var h = '<div class="mut" style="margin-bottom:4px">' + esc(d.note || "") + (d.budget && d.budget.weekly_limit ? " Batches this week: " + esc(d.budget.runs_last_7_days) + " of " + esc(d.budget.weekly_limit) + "." : "") + "</div>";
    bs.forEach(function (b, n) {
      h += '<details class="bl-batch"' + (n === 0 ? " open" : "") + "><summary>" + esc(b.date) + (b.title ? " \u00B7 " + esc(b.title) : "") +
        ' <span class="mut">(' + (b.items || []).length + ")</span></summary>" + (b.items || []).map(item).join("") + "</details>";
    });
    if (!bs.length) h += '<span class="mut">No Claude batches yet.</span>';
    if (d.updated_et) h += '<div class="mut" style="margin-top:4px;font-size:10px">Log updated ' + esc(d.updated_et) + ". Summaries only; raw answers stay private.</div>";
    el("boardLogBody").innerHTML = h;
    el("boardLogBody").dataset.ok = "1";
  }
  function load() {
    fetch("board_log.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (x) { if (!x.ok) throw new Error(x.status); return x.json(); })
      .then(render)
      .catch(function () { if (!el("boardLogBody").dataset.ok) el("boardLogBody").innerHTML = '<span class="mut">Board log not published yet.</span>'; });
  }
  load(); setInterval(load, 10 * 60 * 1000);
})();
