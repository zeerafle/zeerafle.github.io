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
