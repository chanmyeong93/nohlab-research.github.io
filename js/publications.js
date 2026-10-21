/* ==========================================================================
   js/publications.js - Publications 페이지 렌더링 (데이터: publications-data.js)
   최신 논문이 위, 번호는 가장 오래된 논문 = 1번 → 최신 = 마지막 번호
   ========================================================================== */
(function () {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const authors = (a) => esc(a).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("pub-list");
    if (!list || typeof PUBLICATIONS === "undefined") return;

    const items = PUBLICATIONS.map((p, i) => ({ ...p, n: i + 1 }));
    const byYear = new Map();
    items.forEach((p) => {
      if (!byYear.has(p.y)) byYear.set(p.y, []);
      byYear.get(p.y).push(p);
    });

    const html = [];
    [...byYear.keys()].sort((a, b) => b - a).forEach((year) => {
      const group = byYear.get(year);
      html.push(`<li class="pub-year-heading"><h2>${year}<span class="pub-year-count">${group.length}</span></h2></li>`);
      group.slice().reverse().forEach((p) => {
        const title = p.u
          ? `<a href="${esc(p.u)}" target="_blank" rel="noopener noreferrer" class="pub-title">${esc(p.t)}</a>`
          : `<span class="pub-title">${esc(p.t)}</span>`;
        html.push(`<li class="pub-item"><span class="pub-number">${p.n}</span><div class="pub-details">${title}<p class="pub-authors">${authors(p.a)}</p><p class="pub-journal">${esc(p.j)}</p></div></li>`);
      });
    });
    list.innerHTML = html.join("");

    const total = document.getElementById("pub-total-count");
    if (total) total.textContent = PUBLICATIONS.length;
  });
})();