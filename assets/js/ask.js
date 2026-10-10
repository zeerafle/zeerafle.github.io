// `$ ask` drawer: drop-down terminal over the RAG backend (POST /chat {message, history} -> {message}).
// History lives in sessionStorage (survives page navigation, cleared on reload). The LLM key lives in the backend, never here.
(function () {
  var root = document.getElementById("ask");
  if (!root) return;
  var d = root.dataset, panel = root.querySelector(".ask__panel"), log = root.querySelector(".ask__log"),
      form = root.querySelector("form"), input = form.querySelector("input"),
      KEY = "ask", KEEP = 12, msgs = [], busy = false, opener = null, hi = 0, libs;

  try {
    var nt = performance.getEntriesByType("navigation")[0];
    if (nt && nt.type === "reload") sessionStorage.removeItem(KEY);
    msgs = JSON.parse(sessionStorage.getItem(KEY)) || [];
  } catch (e) {}
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(msgs)); } catch (e) {} }

  // marked + DOMPurify load on first open only
  function load(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement("script"); s.src = d.base + src; s.onload = ok; s.onerror = no; document.head.appendChild(s);
    });
  }
  function ensureLibs() { return libs || (libs = Promise.all([load("purify.min.js"), load("marked.umd.js")]).catch(function () {})); }
  function render(el, text) {
    if (!window.marked || !window.DOMPurify) { el.textContent = text; return; }
    el.innerHTML = DOMPurify.sanitize(marked.parse(text), { FORBID_TAGS: ["img"] });
    el.querySelectorAll("a").forEach(function (a) { a.target = "_blank"; a.rel = "noopener noreferrer"; });
  }

  function line(kind, text) {
    var el = document.createElement("div");
    el.className = "ask__m ask__m--" + kind;
    if (text) el.textContent = text;
    log.appendChild(el); log.scrollTop = log.scrollHeight;
    return el;
  }
  function info(text) { return line("i", text); }
  function replay() {
    log.textContent = "";
    if (!msgs.length) info("type a question and press enter · /help for commands");
    msgs.forEach(function (m) {
      if (m.role === "user") line("u", m.content); else render(line("a"), m.content);
    });
    log.scrollTop = log.scrollHeight;
  }

  function open(on) {
    if (on === root.classList.contains("is-open")) return;
    root.classList.toggle("is-open", on);
    document.documentElement.classList.toggle("ask-open", on);
    panel.inert = !on;
    if (on) {
      opener = document.activeElement;
      if (!log.childNodes.length) replay();
      ensureLibs(); input.focus();
    } else if (opener && opener.focus) { opener.focus(); }
  }

  function fail(status, detail, err) {
    if (status === 429) return detail || "rate limited, try again in a bit.";
    if (status) return detail || "backend error " + status + ".";
    return "cannot reach the backend (" + (err && err.message || "network") + ").";
  }

  async function send(text) {
    busy = true; form.classList.add("is-busy");
    var history = msgs.slice(-KEEP);
    line("u", text);
    var el = line("a"), wait = document.createElement("span");
    wait.className = "ask__wait"; wait.textContent = "thinking…"; el.appendChild(wait);
    try {
      var res, ans;
      try {
        res = await fetch(d.url + "/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, history: history }) });
      } catch (err) { throw { err: err }; }
      if (!res.ok) {
        var j = await res.json().catch(function () { return {}; });
        throw { status: res.status, detail: typeof j.detail === "string" ? j.detail : "" };
      }
      ans = (await res.json()).message;
      if (!ans) throw { detail: "empty reply" };
      await ensureLibs();
      render(el, ans);
      msgs.push({ role: "user", content: text }, { role: "assistant", content: ans });
    } catch (e) {
      el.className = "ask__m ask__m--e"; el.textContent = "error: " + fail(e.status, e.detail, e.err);
    }
    log.scrollTop = log.scrollHeight;
    hi = msgs.length / 2; save(); busy = false; form.classList.remove("is-busy"); input.focus();
  }

  var CMD = {
    "/clear": function () { msgs = []; save(); replay(); },
    "/help": function () { info("/clear  wipe this session · ↑↓ recall earlier questions · ` or esc toggles · answers may be wrong"); }
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var t = input.value.trim();
    if (!t || busy) return;
    input.value = "";
    if (t[0] === "/") { line("u", t); (CMD[t] || function () { info("unknown command: " + t); })(); return; }
    send(t);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    var h = msgs.filter(function (m) { return m.role === "user"; }).map(function (m) { return m.content; });
    if (!h.length) return;
    e.preventDefault();
    hi = Math.max(0, Math.min(h.length, hi + (e.key === "ArrowUp" ? -1 : 1)));
    input.value = h[hi] || "";
  });

  root.addEventListener("click", function (e) { if (e.target.closest("[data-ask-close]")) open(false); });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-ask]");
    if (a) { e.preventDefault(); open(!root.classList.contains("is-open")); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") open(false);
    else if (e.key === "`" && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.isContentEditable) {
      e.preventDefault(); open(!root.classList.contains("is-open"));
    }
  });

  if (root.hasAttribute("data-open") || location.hash === "#ask") open(true);
})();
