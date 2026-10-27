/* MamiPicks prerender: copies what the page scripts draw into the HTML files,
   so search engines and AI crawlers (many do not run JavaScript) see every
   product, brand, age note and FAQ. Also writes JSON-LD schema, share cards
   and the canonical link.

   Run after editing a SETTINGS block or products.js:   node tools/prerender.cjs
   (needs Playwright + Chromium). The page scripts still run in the browser and
   redraw the same blocks, so nothing changes for visitors. */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://mom.goldenpasss.com/";
const TAB_IDS = ["xPills", "xTypes", "xGrid"];

const PAGES = [
  { file: "index.html", url: "", name: "MamiPicks",
    ids: ["agesRow", "babyGrid", "typeGridBaby", "ageNotes", "revGrid", "typeGrid", "momWell", "momHome", "momBundles", "brandGrid"] },
  { file: "strollers/index.html", url: "strollers/", name: "Strollers", ids: TAB_IDS },
  { file: "baby-care/index.html", url: "baby-care/", name: "Baby care", ids: TAB_IDS },
  { file: "fertility/index.html", url: "fertility/", name: "Fertility and pregnancy tests", ids: TAB_IDS },
  { file: "vitamins/index.html", url: "vitamins/", name: "Vitamins and wellness", ids: TAB_IDS },
  { file: "nursing-wear/index.html", url: "nursing-wear/", name: "Maternity and nursing wear", ids: TAB_IDS },
  { file: "postpartum/index.html", url: "postpartum/", name: "Postpartum care", ids: TAB_IDS },
  { file: "about/index.html", url: "about/", name: "About", ids: [] },
];

const advText = (a) => [a.about, a.good && "Good for: " + a.good, a.skip && "Skip if: " + a.skip].filter(Boolean).join(" ");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function setInner(html, id, inner) {
  const re = new RegExp('(id="' + id + '"[^>]*>)(?:<!--pre-->[\\s\\S]*?<!--/pre-->)?(?=</)');
  if (!re.test(html)) throw new Error("container #" + id + " not found or not empty");
  return html.replace(re, (_, open) => open + "<!--pre-->" + inner + "<!--/pre-->");
}

function setHead(html, id, tag) {
  const re = tag.startsWith("<script")
    ? new RegExp('\\n?<script[^>]+id="' + id + '"[^>]*>[\\s\\S]*?</script>')
    : new RegExp('\\n?<[^>]+id="' + id + '"[^>]*>');
  html = html.replace(re, "");
  return html.replace("</head>", () => tag + "\n</head>");
}

/* llms.txt: a plain-text map of the site for AI assistants, rebuilt from the same page data */
function writeLlms(list) {
  const head = fs.readFileSync(path.join(__dirname, "llms-head.md"), "utf8").trim();
  const out = [head, "", "## Pages", ""];
  list.forEach(({ pg, got }) => out.push("- [" + pg.name + "](" + SITE + pg.url + "): " + got.desc));
  list.filter(({ got }) => got.items && got.items.length).forEach(({ pg, got }) => {
    out.push("", "## " + pg.name + " (" + got.items.length + " products, " + SITE + pg.url + ")", "");
    got.items.forEach((p) => out.push("- " + p.name.replace(/\s+/g, " ") + " (" + (got.brandNames[p.brand] || p.brand) + ", " + p.kind +
      (p.price ? ", $" + p.price : "") + ")" + (p.adv ? ": " + advText(p.adv) : "")));
  });
  fs.writeFileSync(path.join(ROOT, "llms.txt"), out.join("\n") + "\n");
  console.log("ok llms.txt |", out.length, "lines");
}

(async () => {
  const llms = [];
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const pg of PAGES) {
    const file = path.join(ROOT, pg.file);
    const page = await browser.newPage();
    // offline and deterministic: page data and renderers run; animation, remote files and the big details file do not
    await page.route("**/*", (r) => {
      const u = r.request().url();
      if (!u.startsWith("file:") || /\/assets\/js\/(gsap\.min|mami-hero|tabs-motion|details)\.js$/.test(u)) return r.abort();
      return r.continue();
    });
    await page.goto("file://" + file, { waitUntil: "load" });
    await page.waitForTimeout(800);

    const got = await page.evaluate((ids) => {
      const out = { blocks: {} };
      ids.forEach((id) => { const el = document.getElementById(id); out.blocks[id] = el ? el.innerHTML : null; });
      out.faq = [...document.querySelectorAll(".faq details")].map((d) => ({
        q: d.querySelector("summary").textContent.trim(), a: d.querySelector("p").textContent.trim() }));
      out.title = document.title;
      out.desc = (document.querySelector('meta[name="description"]') || {}).content || "";
      const t = document.querySelector("time[datetime]"); out.updated = t ? t.getAttribute("datetime") : "";
      const img = document.querySelector("main img[src^='http']"); out.img = img ? img.src : "";
      try { out.items = ITEMS.filter((p) => p.link).map((p) => ({ name: p.name, img: p.img, price: p.price, link: p.link, brand: p.brand, kind: p.kind,
        adv: (window.MAMI_ADVICE || {})[p.id] || null }));
        out.brandNames = Object.fromEntries(BRANDS.map((b) => [b.id, b.name])); } catch (e) {}
      try { out.tabs = TABS.map((t) => ({ page: t.page, name: t.label || t.name || t.title || t.page })); } catch (e) {}
      return out;
    }, pg.ids);
    await page.close();

    let html = fs.readFileSync(file, "utf8");
    for (const id of pg.ids) {
      if (got.blocks[id] == null) throw new Error(pg.file + ": #" + id + " missing");
      html = setInner(html, id, got.blocks[id]);
    }
    const year = new Date().getFullYear();
    html = html.replace(/<span id="y">[^<]*<\/span>/, '<span id="y">' + year + "</span>");

    /* ---------- JSON-LD ---------- */
    const url = SITE + pg.url;
    const graph = [];
    graph.push({ "@type": pg.url === "about/" ? "AboutPage" : (pg.url ? "CollectionPage" : "WebPage"), "@id": url + "#page", url,
      name: got.title, description: got.desc, inLanguage: "en",
      ...(got.updated ? { dateModified: got.updated } : {}), isPartOf: { "@id": SITE + "#site" }, publisher: { "@id": SITE + "#org" } });
    if (!pg.url) {
      graph.push({ "@type": "Organization", "@id": SITE + "#org", name: "MamiPicks", url: SITE, email: "golden25@goldenpasss.com",
        description: "Independent comparison site for parents: baby products by age from newborn to five, strollers, baby care, fertility tests, prenatal vitamins, nursing wear and postpartum care." });
      graph.push({ "@type": "WebSite", "@id": SITE + "#site", name: "MamiPicks", url: SITE, inLanguage: "en", publisher: { "@id": SITE + "#org" } });
      graph.push({ "@type": "ItemList", name: "MamiPicks product categories",
        itemListElement: PAGES.filter((p) => p.url && p.url !== "about/").map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: SITE + p.url })) });
    } else {
      graph.push({ "@type": "BreadcrumbList", itemListElement: [{ name: "MamiPicks", item: SITE }, { name: pg.name, item: url }]
        .map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })) });
    }
    if (got.faq.length) {
      graph.push({ "@type": "FAQPage", "@id": url + "#faq", mainEntity: got.faq.map((f) => ({
        "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
    }
    if (got.items && got.items.length) {
      const items = got.items.slice(0, 50).map((p) => ({ "@type": "Product", name: p.name, category: p.kind,
        ...(p.adv ? { description: advText(p.adv) } : {}),
        brand: { "@type": "Brand", name: got.brandNames[p.brand] || p.brand }, ...(p.img ? { image: p.img } : {}),
        ...(p.price ? { offers: { "@type": "Offer", price: String(p.price), priceCurrency: "USD", url: p.link } } : {}) }));
      graph.push({ "@type": "ItemList", name: pg.name + " compared on MamiPicks", numberOfItems: got.items.length,
        itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, item: it })) });
    }
    const ld = '<script type="application/ld+json" id="ld-main">\n' +
      JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 1).replace(/</g, "\\u003c") + "\n</script>";
    html = setHead(html, "ld-main", ld);
    /* ---------- share cards (Facebook, Zalo, X...) ---------- */
    [["og-type", "property", "og:type", "website"], ["og-site", "property", "og:site_name", "MamiPicks"],
     ["og-title", "property", "og:title", got.title], ["og-desc", "property", "og:description", got.desc],
     ["og-url", "property", "og:url", url], ...(got.img ? [["og-img", "property", "og:image", got.img]] : []),
     ["tw-card", "name", "twitter:card", got.img ? "summary_large_image" : "summary"]].forEach(([id, attr, key, val]) => {
      html = setHead(html, id, '<meta id="' + id + '" ' + attr + '="' + key + '" content="' + esc(val) + '">');
    });
    html = html.replace(/\n?<link rel="canonical"[^>]*>/, "");
    html = setHead(html, "canonical", '<link rel="canonical" id="canonical" href="' + url + '">');

    fs.writeFileSync(file, html);
    llms.push({ pg, got });
    console.log("ok", pg.file, "| blocks:", pg.ids.length, "| faq:", got.faq.length, "| products:", (got.items || []).length, "| schema nodes:", graph.length);
  }
  await browser.close();
  writeLlms(llms);
})().catch((e) => { console.error(e); process.exit(1); });
