/* MamiPicks product advice panel.
   PC: slides in from the right, the list stays visible. Phone: slides up from the bottom.
   MamiPanel.open(p, ctx)  p = {key,name,img,price,link,store,brand,kind,text,points}
   ctx = {reasons:[...], age:{label, fits}}  (both optional)
   Advice text comes from window.MAMI_ADVICE[key] (assets/js/advice.js). */
(function () {
  var css = ''
    + '.mp-back{position:fixed;inset:0;z-index:60;background:rgba(60,30,25,.28);opacity:0;pointer-events:none;transition:opacity .3s}'
    + '.mp-back.on{opacity:1;pointer-events:auto}'
    + '.mp{position:fixed;z-index:61;top:0;right:0;bottom:0;width:min(460px,100%);background:var(--bg,#fbf1e4);box-shadow:-18px 0 40px -20px rgba(90,40,30,.45);'
    + 'transform:translateX(105%);transition:transform .38s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;font-family:Nunito,sans-serif;color:var(--ink,#4a2b26)}'
    + '.mp.on{transform:none}'
    + '.mp-top{display:flex;justify-content:space-between;align-items:center;padding:12px 14px 4px}'
    + '.mp-grab{display:none}'
    + '.mp-x{font:inherit;font-size:22px;line-height:1;width:40px;height:40px;border-radius:50%;border:0;background:var(--card,#fffdf8);box-shadow:0 3px 10px rgba(120,60,50,.18);cursor:pointer;color:inherit}'
    + '.mp-in{overflow-y:auto;padding:0 22px 26px;-webkit-overflow-scrolling:touch}'
    + '.mp-pic{background:#fff;border-radius:20px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;margin:4px 0 14px;box-shadow:0 6px 18px -10px rgba(120,60,50,.4)}'
    + '.mp-pic img{max-width:88%;max-height:88%;object-fit:contain}'
    + '.mp-kind{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--rose,#cf6f80)}'
    + '.mp h3{font-family:Fraunces,Georgia,serif;font-size:24px;line-height:1.15;margin:4px 0 6px}'
    + '.mp-pr{font-size:20px;font-weight:800;margin-bottom:10px}'
    + '.mp-for{background:var(--rose-l,#fbe1e5);border-radius:16px;padding:12px 14px;margin:8px 0 12px}'
    + '.mp-for b{display:block;font-size:13px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}'
    + '.mp-for span{display:inline-block;background:#fff;border-radius:999px;padding:4px 10px;margin:0 6px 6px 0;font-size:13px;font-weight:700}'
    + '.mp-age{border-radius:14px;padding:10px 14px;font-weight:800;margin:6px 0 12px}'
    + '.mp-age.ok{background:#e4f3e6;color:#2d6a3a}.mp-age.no{background:#fdeedd;color:#8a4b1c}'
    + '.mp p{margin:0 0 10px;color:var(--mut,#7b5d55);font-size:15px;line-height:1.5}'
    + '.mp h4{font-size:15px;margin:14px 0 6px}'
    + '.mp-two{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}'
    + '.mp-two div{background:var(--card,#fffdf8);border-radius:14px;padding:10px 12px;box-shadow:0 3px 10px -6px rgba(120,60,50,.35)}'
    + '.mp-two b{font-size:13px}.mp-two ul{margin:6px 0 0;padding-left:16px;font-size:14px;color:var(--mut,#7b5d55)}'
    + '.mp-two .pro b{color:#2d6a3a}.mp-two .con b{color:#a0482c}'
    + '.mp-rate{font-weight:800;font-size:14px;margin:-4px 0 10px}.mp-rate span{color:#e2a238;letter-spacing:1px}.mp-rate small{color:var(--mut,#7b5d55);font-weight:600}'
    + '.mp-rev{background:var(--card,#fffdf8);border-radius:14px;padding:10px 12px;margin-bottom:8px;box-shadow:0 3px 10px -6px rgba(120,60,50,.35)}'
    + '.mp-rev b{display:block;font-size:14px}.mp-rev .s{color:#e2a238;font-size:13px}.mp-rev p{font-size:14px;margin:4px 0}.mp-rev small{color:var(--mut,#7b5d55);font-size:12px}'
    + '.mp details{margin-top:12px;background:var(--card,#fffdf8);border-radius:14px;padding:10px 12px}.mp summary{font-weight:800;cursor:pointer;font-size:14px}'
    + '.mp details ul{padding-left:18px;font-size:13.5px;color:var(--mut,#7b5d55);display:flex;flex-direction:column;gap:5px;margin:8px 0}.mp details h5{font-size:13px;margin:10px 0 0}'
    + '.mp-fine{font-size:12px!important;margin-top:12px!important}'
    + '.mp-buy{display:flex;padding:12px 22px calc(14px + env(safe-area-inset-bottom));border-top:1.5px dashed var(--line,#ecd9c6);background:var(--bg,#fbf1e4)}'
    + '.mp-buy .btn{flex:1}'
    + '@media(max-width:760px){.mp{top:auto;left:0;width:100%;height:88svh;border-radius:24px 24px 0 0;transform:translateY(105%);box-shadow:0 -18px 40px -20px rgba(90,40,30,.45)}'
    + '.mp.on{transform:none}.mp-top{justify-content:center;position:relative;padding-top:10px}'
    + '.mp-grab{display:block;width:44px;height:5px;border-radius:3px;background:rgba(120,80,60,.3)}.mp-x{position:absolute;right:12px;top:8px;width:36px;height:36px;font-size:20px}'
    + '.mp-two{grid-template-columns:1fr}}';
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var back = document.createElement("div"); back.className = "mp-back";
  var box = document.createElement("aside"); box.className = "mp"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Product advice");
  document.body.appendChild(back); document.body.appendChild(box);

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function money(n) { if (n == null || n === "") return ""; if (typeof n === "string") return n; return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(+n) ? 0 : 2, maximumFractionDigits: 2 }); }
  function stars(r) { var n = Math.round(r); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
  function list(a) { return '<ul>' + a.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("") + '</ul>'; }
  var lastFocus = null;

  // Amazon details (assets/js/details.js, ~240 KB) load after the page, not before it
  var SRC = (document.currentScript && document.currentScript.src || '').replace(/panel\.js[^/]*$/, 'details.js'), waiting = null, tried = false;
  function details(cb) {
    if (window.MAMI_DETAILS || tried) return cb();
    if (!waiting) {
      waiting = [];
      var s = document.createElement('script'); s.src = SRC;
      s.onload = s.onerror = function () { tried = true; var w = waiting; waiting = null; w.forEach(function (f) { f(); }); document.dispatchEvent(new Event('mami:details')); };
      document.head.appendChild(s);
    }
    waiting.push(cb);
  }
  addEventListener('load', function () { (window.requestIdleCallback || setTimeout)(function () { details(function () {}); }, { timeout: 2000 }); });

  function open(p, ctx) {
    ctx = ctx || {};
    if (!window.MAMI_DETAILS && !tried) return details(function () { open(p, ctx); });
    var A = (window.MAMI_ADVICE || {})[p.key] || {};
    var pros = A.pros && A.pros.length ? A.pros : (p.points || []);
    var cons = A.cons || [];
    var h = '<div class="mp-top"><span class="mp-grab"></span><button type="button" class="mp-x" aria-label="Close">×</button></div><div class="mp-in">';
    if (p.img) h += '<div class="mp-pic"><img alt="' + esc(p.name) + '" src="' + esc(amzImg(p.img, 800)) + '"></div>';
    h += '<span class="mp-kind">' + esc([p.brand, p.kind].filter(Boolean).join(" · ")) + '</span><h3>' + esc(p.name) + '</h3>';
    if (p.price) h += '<div class="mp-pr">' + esc(money(p.price)) + '</div>';
    var D = (window.MAMI_DETAILS || {})[p.key] || {};
    if (D.r) h += '<div class="mp-rate"><span>' + stars(D.r) + '</span> ' + D.r + ' <small>· ' + Number(D.n || 0).toLocaleString("en-US") + ' ratings on Amazon</small></div>';
    if (ctx.reasons && ctx.reasons.length) h += '<div class="mp-for"><b>Why we picked it for you</b>' + ctx.reasons.map(function (r) { return '<span>' + esc(r) + '</span>'; }).join("") + '</div>';
    if (ctx.age) h += '<div class="mp-age ' + (ctx.age.fits ? 'ok">✓ A good fit for ' : 'no">Made for a different age than ') + esc(ctx.age.label) + (p.ageText ? ' · ages ' + esc(p.ageText) : '') + '</div>';
    if (A.about || p.text) h += '<p>' + esc(A.about || p.text) + '</p>';
    if (A.good) h += '<h4>Good for you if…</h4><p>' + esc(A.good) + '</p>';
    if (A.skip) h += '<h4>Maybe skip it if…</h4><p>' + esc(A.skip) + '</p>';
    if (pros.length || cons.length) h += '<div class="mp-two">' + (pros.length ? '<div class="pro"><b>What we like</b>' + list(pros) + '</div>' : '') + (cons.length ? '<div class="con"><b>Keep in mind</b>' + list(cons) + '</div>' : '') + '</div>';
    if (D.rev && D.rev.length) h += '<h4>What buyers say on Amazon</h4>' + D.rev.map(function (r) {
      return '<div class="mp-rev"><span class="s">' + stars(r.s || 5) + '</span><b>' + esc(r.t) + '</b><p>' + esc(r.x) + '</p><small>' + esc(r.by) + (r.d ? ' · ' + esc(r.d) : '') + '</small></div>'; }).join("");
    if ((D.about && D.about.length) || (D.box && D.box.length)) h += '<details><summary>From the Amazon listing</summary>' +
      (D.about && D.about.length ? list(D.about) : '') + (D.box && D.box.length ? '<h5>On the product photos</h5>' + list(D.box) : '') + '</details>';
    h += '<p class="mp-fine">MamiPicks\' own view, based on the shop\'s listing. Not medical advice: ask your doctor or midwife about supplements and health products.</p></div>';
    h += '<div class="mp-buy"><a class="btn" target="_blank" rel="sponsored noopener" href="' + esc(p.link) + '">View on ' + esc(p.store || "the shop") + '</a></div>';
    box.innerHTML = h;
    box.querySelector(".mp-x").onclick = close;
    lastFocus = document.activeElement;
    back.classList.add("on"); box.classList.add("on"); box.scrollTop = 0;
    document.documentElement.style.overflow = "hidden";
    setTimeout(function () { var x = box.querySelector(".mp-x"); if (x) x.focus(); }, 50);
  }
  function close() {
    back.classList.remove("on"); box.classList.remove("on"); box.style.transform = "";
    document.documentElement.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  back.onclick = close;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("on")) close(); });
  // phone: drag the sheet down to close
  var y0 = null;
  box.addEventListener("touchstart", function (e) { if (e.target.closest(".mp-top")) y0 = e.touches[0].clientY; }, { passive: true });
  box.addEventListener("touchmove", function (e) { if (y0 == null) return; var d = Math.max(0, e.touches[0].clientY - y0); box.style.transition = "none"; box.style.transform = "translateY(" + d + "px)"; }, { passive: true });
  box.addEventListener("touchend", function (e) { if (y0 == null) return; var d = e.changedTouches[0].clientY - y0; y0 = null; box.style.transition = ""; if (d > 90) close(); else box.style.transform = ""; });

  window.MamiPanel = { open: open, close: close, details: details };
  // Amazon photo at a smaller size: the lists only need ~500 px, the panel ~800 px
  function amzImg(u, px) { return /m\.media-amazon\.com\/images\/I\//.test(u || '') ? u.replace(/(\/I\/[^./]+)(\.[^/]*)?\.(jpg|jpeg|png|webp)$/i, '$1._AC_SL' + px + '_.$3') : u; }
  window.amzImg = amzImg;
})();
