// Optional: marks the page as loaded so CSS can settle transitions. Site works without it.
document.documentElement.classList.add("ready");

// Theme toggle: no stored choice = follow system; click sets explicit light/dark and persists.
(function () {
  var d = document.documentElement, b = document.querySelector("[data-theme-toggle]");
  if (!b) return;
  var mq = matchMedia("(prefers-color-scheme: light)");
  function cur() { return d.getAttribute("data-theme") || (mq.matches ? "light" : "dark"); }
  function sync() {
    var c = cur();
    b.textContent = "[" + c + "]";
    b.setAttribute("aria-label", "Theme: " + c + ". Switch to " + (c === "light" ? "dark" : "light"));
  }
  b.addEventListener("click", function () {
    var n = cur() === "light" ? "dark" : "light";
    d.setAttribute("data-theme", n);
    try { localStorage.setItem("theme", n); } catch (e) {}
    sync(); window.dispatchEvent(new Event("themechange"));
  });
  (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(sync);
  sync();
})();

// Mobile nav: [ls] button toggles the link panel. Without JS the links simply wrap in a row.
(function () {
  var nav = document.querySelector(".nav"), b = document.querySelector("[data-nav-menu]");
  if (!nav || !b) return;
  var lab = b.firstElementChild, wide = matchMedia("(min-width: 40rem)");
  function set(open, focus) {
    nav.classList.toggle("is-open", open);
    b.setAttribute("aria-expanded", open ? "true" : "false");
    lab.textContent = open ? "[x]" : "[ls]";
    if (!open && focus) b.focus();
  }
  b.addEventListener("click", function () { set(!nav.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest(".nav__links a")) set(false); });
  document.addEventListener("click", function (e) { if (!nav.contains(e.target)) set(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) set(false, true);
  });
  (wide.addEventListener ? wide.addEventListener.bind(wide, "change") : wide.addListener.bind(wide))(function () { if (wide.matches) set(false); });
})();
