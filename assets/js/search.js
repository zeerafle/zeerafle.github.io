// `$ grep` overlay: Typesense search over the pages indexed by index_typesense.py. The key in data-key is search-only.
(function () {
  var root = document.getElementById("grep");
  if (!root) return;
  var d = root.dataset, form = root.querySelector("form"), input = form.querySelector("input"),
      out = root.querySelector(".grep__out"), stat = root.querySelector(".grep__stat"), panel = root.querySelector(".grep__panel"),
      opener = null, timer = 0, ctl = null, act = -1, seq = 0;
  // Typesense wraps matches in these tags; control characters can't appear in page text, so no HTML ever reaches innerHTML.
  var A = "\u0001", B = "\u0002";

  function marked(el, text) {
    el.textContent = "";
    String(text).split(A).forEach(function (part, i) {
      var p = part.split(B);
      if (i && p.length > 1) { var m = document.createElement("mark"); m.textContent = p[0]; el.appendChild(m); el.appendChild(document.createTextNode(p.slice(1).join(B))); }
      else el.appendChild(document.createTextNode(part.replace(B, "")));
    });
  }
  function hl(hit, field) {
    var h = hit.highlight && hit.highlight[field];
    return h && h.snippet ? h.snippet : null;
  }

  function select(i, scroll) {
    var rows = out.children;
    if (!rows.length) { act = -1; input.removeAttribute("aria-activedescendant"); return; }
    act = (i + rows.length) % rows.length;
    for (var k = 0; k < rows.length; k++) {
      var on = k === act;
      rows[k].setAttribute("aria-selected", on);
      if (on) { input.setAttribute("aria-activedescendant", rows[k].id); if (scroll) rows[k].scrollIntoView({ block: "nearest" }); }
    }
  }

  function show(res) {
    out.textContent = "";
    var hits = res.hits || [];
    hits.forEach(function (h, i) {
      var doc = h.document, li = document.createElement("li"), a = document.createElement("a"),
          k = document.createElement("span"), t = document.createElement("span"), s = document.createElement("span");
      li.id = "grep-r" + i; li.setAttribute("role", "option");
      a.href = doc.url;
      k.className = "grep__k"; k.textContent = doc.kind;
      t.className = "grep__t"; marked(t, hl(h, "title") || doc.title);
      s.className = "grep__s"; marked(s, hl(h, "content") || "");
      a.appendChild(k); a.appendChild(t); a.appendChild(s); li.appendChild(a);
      li.addEventListener("mousemove", function () { if (act !== i) select(i); });
      out.appendChild(li);
    });
    input.setAttribute("aria-expanded", hits.length > 0);
    select(0);
    stat.textContent = hits.length ? res.found + (res.found === 1 ? " result" : " results") + " · " + res.search_time_ms + "ms" : "no matches";
  }

  function run(q) {
    if (ctl) ctl.abort();
    var my = ++seq;
    if (!q.trim()) { out.textContent = ""; input.setAttribute("aria-expanded", "false"); select(-1); stat.textContent = "type to search"; return; }
    ctl = new AbortController();
    var u = d.host + "/collections/" + d.collection + "/documents/search?" + new URLSearchParams({
      q: q, query_by: "title,content", query_by_weights: "4,1", per_page: "8", num_typos: "1",
      highlight_start_tag: A, highlight_end_tag: B, highlight_affix_num_tokens: "6", snippet_threshold: "30"
    });
    fetch(u, { headers: { "X-TYPESENSE-API-KEY": d.key }, signal: ctl.signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (res) { if (my === seq) show(res); })
      .catch(function (e) {
        if (e.name === "AbortError") return;
        out.textContent = ""; input.setAttribute("aria-expanded", "false");
        stat.textContent = "search unavailable, try again later";
      });
  }

  function open(on) {
    if (on === root.classList.contains("is-open")) return;
    root.classList.toggle("is-open", on);
    document.documentElement.classList.toggle("grep-open", on);
    panel.inert = !on;
    if (on) { opener = document.activeElement; input.focus(); input.select(); }
    else { if (ctl) ctl.abort(); input.blur(); if (opener && opener.focus) opener.focus(); }
  }

  input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { run(input.value); }, 120); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var a = out.children[act] && out.children[act].querySelector("a");
    if (a) location.href = a.href;
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); select(act + (e.key === "ArrowDown" ? 1 : -1), true); }
  });
  root.addEventListener("click", function (e) { if (e.target.closest("[data-grep-close]")) open(false); });
  out.addEventListener("click", function () { open(false); }); // same-page links (hash) would otherwise leave the overlay up

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-grep]");
    if (a) { e.preventDefault(); open(!root.classList.contains("is-open")); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") open(false);
    else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.isContentEditable) {
      e.preventDefault(); open(true);
    }
  });
  // trap Tab inside the overlay
  panel.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = [input, panel.querySelector("button")];
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[1].focus(); }
    else if (!e.shiftKey && i === 1) { e.preventDefault(); f[0].focus(); }
  });

  if (location.hash === "#grep") open(true);
})();
