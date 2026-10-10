// ASCII renderer (libcaca-style): glyph ramp by luminance, dithering, 16-colour warm palette.
(function () {
  var RAMP = " .:-=+*#%@", N = RAMP.length;
  var PAL = [[0,0,0],[170,60,50],[90,150,80],[200,161,90],[60,100,170],[150,80,140],[60,150,150],[190,180,160],
    [70,66,60],[235,110,90],[140,210,110],[250,210,120],[110,160,240],[210,130,200],[110,220,220],[250,245,225]];
  var BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  var MONO = '"Monaspace Argon", ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  function nearest(r, g, b) {
    var best = 0, bd = 1e9;
    for (var i = 0; i < 16; i++) {
      var p = PAL[i], d = (p[0]-r)*(p[0]-r) + (p[1]-g)*(p[1]-g) + (p[2]-b)*(p[2]-b);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  var CSS = PAL.map(function (p) { return "rgb(" + p + ")"; });
  var INK = PAL.map(function (p) { return "rgb(" + p.map(function (v) { return Math.round(v * 0.55); }) + ")"; });
  var mqL = matchMedia("(prefers-color-scheme: light)"), redraws = [];
  function light() { var t = document.documentElement.getAttribute("data-theme"); return t ? t === "light" : mqL.matches; }
  function redrawAll() { redraws.forEach(function (f) { f(); }); }
  window.addEventListener("themechange", redrawAll);
  (mqL.addEventListener ? mqL.addEventListener.bind(mqL, "change") : mqL.addListener.bind(mqL))(redrawAll);

  // Paint source (canvas/img) into cvs as a glyph grid.
  // o: fs = Floyd-Steinberg (else ordered), inv = invert luminance in light theme (ink on paper), cell = target cell width px,
  // maxCols/maxRows = caps, cover = cover-crop to w:h, stretch = auto-levels, gamma < 1 lifts shadows.
  function paint(cvs, src, w, h, o) {
    var lt = light(), dpr = window.devicePixelRatio || 1;
    var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    var cols = Math.min(o.maxCols, Math.max(8, Math.floor(w / o.cell))), cw = w / cols, ch = cw * 2;
    var rows = Math.min(o.maxRows, Math.max(2, Math.floor(h / ch)));
    ch = h / rows;
    if (cvs.width !== Math.round(w * dpr) || cvs.height !== Math.round(h * dpr)) {
      cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr);
      if (!o.cover) { cvs.style.width = w + "px"; cvs.style.height = h + "px"; } // hero canvas is sized by CSS (100% of frame), never by a stale px value
    }
    var cx = 0, cy = 0, cwid = sw, chei = sh;
    if (o.cover) {
      if (sw / sh > w / h) { cwid = sh * w / h; cx = (sw - cwid) / 2; } else { chei = sw * h / w; cy = (sh - chei) / 2; }
    }
    var s = paint.s || (paint.s = document.createElement("canvas"));
    s.width = cols; s.height = rows;
    var sx = s.getContext("2d", { willReadFrequently: true });
    sx.imageSmoothingQuality = "high";
    sx.drawImage(src, cx, cy, cwid, chei, 0, 0, cols, rows);
    var px = sx.getImageData(0, 0, cols, rows).data, n = cols * rows, raw = new Float32Array(n), lum = new Float32Array(n);
    for (var i = 0; i < n; i++) raw[i] = (0.2126*px[i*4] + 0.7152*px[i*4+1] + 0.0722*px[i*4+2]) / 255;
    var lo = 0, hi = 1;
    if (o.stretch) {
      var sorted = Float32Array.from(raw).sort();
      lo = sorted[Math.floor(n * 0.02)]; hi = sorted[Math.floor(n * 0.98)];
      if (hi - lo < 0.05) { lo = 0; hi = 1; }
    }
    for (i = 0; i < n; i++) {
      var v0 = Math.pow(Math.min(1, Math.max(0, (raw[i] - lo) / (hi - lo))), o.gamma || 1);
      lum[i] = lt && o.inv ? 1 - v0 : v0; // light theme: ink on paper, dark = dense
      raw[i] = v0 / Math.max(raw[i], 0.02); // brightness gain, reused to keep hue in shadows
    }
    var x = cvs.getContext("2d");
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, w, h);
    x.font = Math.round(ch * 0.9) + "px " + MONO;
    x.textBaseline = "middle"; x.textAlign = "center";
    for (var y = 0; y < rows; y++) for (var c = 0; c < cols; c++) {
      var k = y * cols + c, v = Math.min(1, Math.max(0, lum[k])) * (N - 1), idx;
      if (o.fs) {
        idx = Math.max(0, Math.min(N - 1, Math.round(v)));
        var e = (v - idx) / (N - 1);
        if (c + 1 < cols) lum[k+1] += e * 7/16;
        if (y + 1 < rows) {
          if (c > 0) lum[k+cols-1] += e * 3/16;
          lum[k+cols] += e * 5/16;
          if (c + 1 < cols) lum[k+cols+1] += e * 1/16;
        }
      } else {
        idx = Math.max(0, Math.min(N - 1, Math.floor(v + BAYER[(y & 3) * 4 + (c & 3)] / 16)));
      }
      var g = o.stretch ? Math.min(3, raw[k]) : 1, r = px[k*4] * g, gg = px[k*4+1] * g, b = px[k*4+2] * g;
      if (!idx) continue;
      x.fillStyle = (lt ? INK : CSS)[nearest(Math.min(255, r), Math.min(255, gg), Math.min(255, b))];
      x.fillText(RAMP[idx], (c + 0.5) * cw, (y + 0.5) * ch);
    }
  }

  var COVER = { fs: true, inv: true, cell: 8, maxCols: 120, maxRows: 50 };
  // Hero photo: finer cells, auto-levels + gamma to lift the dark left, static (no animation loop).
  var HERO = { fs: true, inv: true, cell: 6, maxCols: 200, maxRows: 100, cover: true, stretch: true, gamma: 0.85 };

  function ready() { document.documentElement.classList.add("ascii"); }

  function image(img) {
    var cvs = document.createElement("canvas");
    cvs.className = "ascii-cvs"; cvs.setAttribute("role", "img");
    cvs.setAttribute("aria-label", img.alt || "");
    var box = img.closest(".hero__art") || img.parentNode, hero = box.classList.contains("hero__art");
    function draw() {
      if (hero) { if (box.clientWidth > 0 && box.clientHeight > 0) paint(cvs, img, box.clientWidth, box.clientHeight, box.clientWidth < 640 ? Object.assign({}, HERO, { cell: 2.5, fs: false, gamma: .6 }) : HERO); return; }
      var w = Math.min(box.clientWidth || img.naturalWidth, 960);
      paint(cvs, img, w, w * img.naturalHeight / img.naturalWidth, COVER);
    }
    var started = false;
    function go() {
      if (!img.naturalWidth) return;
      if (started) { draw(); return; } // <picture> source swap fires load again: repaint from the new currentSrc
      started = true;
      (img.parentNode.tagName === "PICTURE" ? img.parentNode : img).after(cvs); draw(); ready();
      img.classList.add("is-ascii"); img.setAttribute("aria-hidden", "true");
      redraws.push(draw); new ResizeObserver(draw).observe(box);
    }
    img.addEventListener("load", go);
    if (img.complete) go();
  }

  function init() {
    if (window.ResizeObserver) document.querySelectorAll("img[data-ascii]").forEach(image);
  }
  init();
  // canvas ignores webfonts until loaded; repaint once Argon is ready
  if (document.fonts && document.fonts.load) document.fonts.load('12px "Monaspace Argon"').then(redrawAll);
})();
