/* Tab pages motion (GSAP): the hero lands in one short sequence, sections below the
   first screen fade up as they scroll in. Nothing is hidden when GSAP or motion is off. */
(function () {
  if (!window.gsap || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.timeline({ defaults: { ease: "power3.out", duration: 0.6 } })
    .fromTo("[data-hero]", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08 })
    .fromTo("[data-land]", { y: 30, autoAlpha: 0, rotation: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.7, clearProps: "rotation" }, "-=0.45");
  var below = [].slice.call(document.querySelectorAll("[data-reveal-group]"))
    .filter(function (g) { return g.getBoundingClientRect().top > window.innerHeight; });
  below.forEach(function (g) { gsap.set(g.querySelectorAll("[data-reveal]"), { autoAlpha: 0 }); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      gsap.fromTo(e.target.querySelectorAll("[data-reveal]"), { y: 22, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.55, ease: "power2.out", stagger: 0.08 });
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  below.forEach(function (g) { io.observe(g); });
  // product cards pop in when they enter the screen
  var cio = new IntersectionObserver(function (es) {
    var batch = es.filter(function (e) { return e.isIntersecting; }).map(function (e) { cio.unobserve(e.target); return e.target; });
    if (batch.length) gsap.fromTo(batch, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: "power2.out", stagger: 0.05, clearProps: "transform" });
  }, { rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("#xGrid .xcard").forEach(function (c) {
    if (c.getBoundingClientRect().top > window.innerHeight) { gsap.set(c, { autoAlpha: 0 }); cio.observe(c); }
  });
})();
