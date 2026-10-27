// Lấy sản phẩm từ Lasso (link, tên, giá, hoa hồng, ảnh) vào MỘT file JSON + CSV, rồi đẩy lên GitHub.
// Chạy bằng lay-du-lieu.bat (bấm đúp). Chạy tay:
//   node pull.mjs --site mom [--brands "Momcozy,Frida"] [--max 20] [--all] [--no-getlink] [--no-push]
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SITES = JSON.parse(fs.readFileSync(path.join(DIR, "sites.json"), "utf8"));
const PLACEHOLDER = "01RmK+J4pJL"; // ảnh "không có ảnh" của Amazon

// ---------- tham số ----------
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf("--" + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true); };
const SITE = arg("site", null);
if (!SITES[SITE]) { console.log("Thiếu --site, chọn một trong: " + Object.keys(SITES).join(", ")); process.exit(1); }
const CFG = SITES[SITE] || { brands: [] };
const BRANDS = arg("brands") ? String(arg("brands")).split(",").map(s => s.trim()).filter(Boolean) : CFG.brands;
const MAX = Number(arg("max", 0)) || 0;          // tối đa mỗi hãng (0 = tất cả)
const GETLINK = !arg("no-getlink", false);
const PUSH = !arg("no-push", false);
const ALL = !!arg("all", false);                 // lấy cả món đã có trên trang
const HEADLESS = !!arg("headless", false);
const DATE = new Date().toISOString().slice(0, 10);
const OUT_DIR = path.join(DIR, "out");
const OUT = path.join(OUT_DIR, `${SITE}-${DATE}.json`);
const REPO_DIR = path.join(DIR, "repos", SITE);

// ảnh Amazon cỡ nhỏ -> cỡ lớn (bỏ đoạn ._AC_US40_. v.v.)
const bigImg = u => u.replace(/\._[^/]*_\.(jpg|png|webp)$/i, "._AC_SL1500_.$1");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pause = () => sleep(1500 + Math.random() * 2000);
const ask = q => new Promise(r => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, a => { rl.close(); r(a); }); });
// mọi dòng đều ghi thêm vào out/nhat-ky.txt để xem lại khi có lỗi
const LOGF = path.join(DIR, "out", "nhat-ky.txt");
fs.mkdirSync(path.dirname(LOGF), { recursive: true });
const _cl = console.log;
console.log = (...a) => { _cl(...a); try { fs.appendFileSync(LOGF, a.join(" ") + "\n"); } catch {} };
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
log("===== bắt đầu", process.argv.slice(2).join(" "));
const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();

// ---------- lưu dần (chạy lại thì làm tiếp chỗ dở) ----------
fs.mkdirSync(OUT_DIR, { recursive: true });
let rows = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
const save = () => {
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
  fs.writeFileSync(OUT.replace(/\.json$/, ".csv"), toCsv(rows), "utf8");
};
function toCsv(list) {
  const cols = ["brand", "id", "name", "price", "commissionPct", "estCommission", "lassoLink", "linkCheck", "images", "skip", "note"];
  const esc = v => { v = Array.isArray(v) ? v.length : (v ?? ""); v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return "﻿" + cols.join(",") + "\n" + list.map(r => cols.map(c => esc(r[c])).join(",")).join("\n") + "\n";
}

// ---------- repo trang (để biết món nào đã có, và để đẩy file lên) ----------
function prepareRepo() {
  if (!CFG.repo) return;
  try {
    if (!fs.existsSync(path.join(REPO_DIR, ".git"))) {
      fs.mkdirSync(path.dirname(REPO_DIR), { recursive: true });
      log("Tải repo", CFG.repo, "...");
      sh(`git clone https://github.com/${CFG.repo}.git "${REPO_DIR}"`);
    }
    sh("git fetch origin", REPO_DIR);
    sh("git checkout -B lasso-data origin/main", REPO_DIR);
    sh("git reset --hard origin/main", REPO_DIR);
  } catch (e) { log("Không chuẩn bị được repo (bỏ qua):", e.message.split("\n")[0]); }
}
function asinsOnSite() {
  const have = new Set();
  if (!fs.existsSync(REPO_DIR)) return have;
  const walk = d => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      if (f.name.startsWith(".") || f.name === "node_modules") continue;
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(html|js|json)$/.test(f.name)) for (const m of fs.readFileSync(p, "utf8").matchAll(/amazon\.com\/dp\/([A-Z0-9]{10})|"id":\s*"(B0[A-Z0-9]{8})"/g)) have.add(m[1] || m[2]);
    }
  };
  walk(REPO_DIR);
  return have;
}

// ---------- Lasso ----------
async function needLogin(page, ctx) {
  await page.goto("https://app.getlasso.co/plus", { waitUntil: "domcontentloaded" });
  await sleep(3000);
  if (/login|sign|auth/i.test(page.url())) {
    await dump(page, "dang-nhap");
    // Google chặn đăng nhập trong Chrome bị điều khiển, nên phải đăng nhập bằng Chrome thường
    console.log("\n>>> Chưa đăng nhập Lasso. Đóng cửa sổ này, bấm đúp dang-nhap-lasso.bat để đăng nhập, rồi chạy lại.");
    await ctx.close(); process.exit(1);
  }
}

async function brandProducts(page, brand) {
  const url = `https://app.getlasso.co/plus/brand/${encodeURIComponent(brand)}?sortByDefault=commissionRate&store=us`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await sleep(4000);
  // cuộn tới cuối để tải hết sản phẩm
  let last = -1;
  for (let i = 0; i < 40; i++) {
    const n = await page.locator('a[href*="/plus/product/"]').count();
    if (n === last) break;
    last = n;
    await page.mouse.wheel(0, 4000);
    await sleep(1500);
  }
  if (!last) await dump(page, "hang-" + brand);
  return page.evaluate(() => {
    // ghép chữ của từng ô nhỏ bằng " | " để giá và % không dính vào nhau
    const leafText = el => [...el.querySelectorAll("*")].filter(e => !e.children.length).map(e => e.textContent.replace(/\s+/g, " ").trim()).filter(Boolean).join(" | ");
    const out = new Map();
    for (const a of document.querySelectorAll('a[href*="/plus/product/"]')) {
      const m = a.href.match(/\/plus\/product\/([A-Z0-9]{10})/);
      if (!m || out.has(m[1])) continue;
      // leo lên tới khung thẻ sản phẩm (khung chỉ chứa đúng 1 sản phẩm)
      let card = a;
      while (card.parentElement && new Set([...card.parentElement.querySelectorAll('a[href*="/plus/product/"]')].map(x => (x.href.match(/product\/([A-Z0-9]{10})/) || [])[1])).size === 1) card = card.parentElement;
      const imgs = [...card.querySelectorAll("img")].map(i => i.currentSrc || i.src).filter(u => /media-amazon|images-amazon/.test(u));
      const name = (card.querySelector("h1,h2,h3,h4,[class*=title],[class*=name]")?.innerText || "").trim();
      out.set(m[1], { id: m[1], name, imgs, cardText: leafText(card).slice(0, 400) });
    }
    return [...out.values()];
  });
}

// lưu ảnh chụp + chữ của trang để mình xem vì sao không đọc được
async function dump(page, name) {
  const f = path.join(OUT_DIR, "loi-" + name.replace(/[^a-z0-9-]+/gi, "_"));
  try { await page.screenshot({ path: f + ".png" }); fs.writeFileSync(f + ".txt", page.url() + "\n\n" + (await page.evaluate(() => document.body.innerText)).slice(0, 5000)); log("  đã lưu", f + ".png/.txt"); } catch {}
}

function parseCard(t) {
  const money = [...t.matchAll(/\$\s?([\d,]+(?:\.\d+)?)/g)].map(m => Number(m[1].replace(/,/g, "")));
  const pct = t.match(/([\d.]+)\s?%/);
  return { price: money[0] ?? null, estCommission: money.length > 1 ? money[money.length - 1] : null, commissionPct: pct ? Number(pct[1]) : null };
}

const LASSO_RE = /https:\/\/lasso\.to\/[A-Za-z0-9/_-]+/;
async function getLink(page, asin) {
  await page.goto(`https://app.getlasso.co/plus/product/${asin}`, { waitUntil: "domcontentloaded" });
  await sleep(3500);
  const info = await page.evaluate(() => ({
    name: (document.querySelector("h1")?.innerText || "").trim(),
    imgs: [...document.querySelectorAll("img")].map(i => i.currentSrc || i.src).filter(u => /media-amazon|images-amazon/.test(u)),
  }));
  const res = await (async () => {
    const findLink = async () => {
      const t = await page.evaluate(() => document.body.innerText + " " + [...document.querySelectorAll("input,textarea")].map(i => i.value).join(" ") + " " + [...document.querySelectorAll("a")].map(a => a.href).join(" "));
      return (t.match(/https:\/\/lasso\.to\/[A-Za-z0-9/_-]+/) || [])[0] || null;
    };
    let link = await findLink();
    if (link) return { link };
    if (!GETLINK) return { note: "chưa có link (đã tắt Get Link)" };
    // CHỈ bấm "Get link" đúng 1 lần. Không bao giờ bấm "Save for later".
    const btn = page.getByRole("button", { name: /^\s*get\s*link\s*$/i }).first();
    if (!(await btn.count())) { await dump(page, "getlink-" + asin); return { note: "không thấy nút Get link" }; }
    await btn.click();
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      link = await findLink();
      if (link) return { link };
      const body = await page.evaluate(() => document.body.innerText);
      if (/temporarily unavailable|unavailable/i.test(body)) return { note: "Lasso báo temporarily unavailable" };
    }
    try { const clip = await page.evaluate(() => navigator.clipboard.readText()); if (LASSO_RE.test(clip)) return { link: clip.match(LASSO_RE)[0] }; } catch {}
    return { note: "bấm Get link nhưng không thấy link" };
  })();
  return { ...res, ...info };
}

async function checkLink(ctx, link, asin) {
  try {
    let url = link;
    for (let i = 0; i < 5; i++) {
      // chỉ đọc chuyển hướng của lasso.to, không mở trang amazon.com
      if (/amazon\./.test(new URL(url).host)) return url.includes(asin) ? "OK" : "không ra đúng ASIN";
      const r = await ctx.request.get(url, { maxRedirects: 0, timeout: 15000 });
      const loc = r.headers()["location"];
      if (!loc) return url.includes(asin) ? "OK" : "không ra đúng ASIN";
      url = new URL(loc, url).href;
    }
    return url.includes(asin) ? "OK" : "không ra đúng ASIN";
  } catch (e) { return "không kiểm tra được"; }
}

// ---------- Amazon ----------
// Amazon cấm công cụ tự động đọc trang sản phẩm (trang báo "unauthorized AI agent violates Amazon's
// Conditions of Use"). Vì vậy script KHÔNG mở amazon.com. Tên, ảnh, giá lấy từ Lasso.

// ---------- đẩy lên GitHub ----------
function push() {
  if (!fs.existsSync(path.join(REPO_DIR, ".git"))) return log("Không có repo, bỏ qua bước đẩy. File nằm ở", OUT);
  const dest = path.join(REPO_DIR, "data", "lasso-auto");
  fs.mkdirSync(dest, { recursive: true });
  for (const f of [OUT, OUT.replace(/\.json$/, ".csv")]) fs.copyFileSync(f, path.join(dest, path.basename(f)));
  try {
    sh("git add data/lasso-auto", REPO_DIR);
    sh(`git commit -m "Lasso + Amazon data ${SITE} ${DATE} (${rows.length} items)"`, REPO_DIR);
    sh("git push -f -u origin lasso-data", REPO_DIR);
    log(`Đã đẩy lên GitHub: ${CFG.repo}, nhánh lasso-data, thư mục data/lasso-auto/`);
  } catch (e) { log("Đẩy lên GitHub lỗi:", (e.stderr || e.message).toString().split("\n").slice(0, 3).join(" ")); }
}

// ---------- chạy ----------
(async () => {
  prepareRepo();
  const have = ALL ? new Set() : asinsOnSite();
  if (have.size) log(`Trang ${SITE} đang có ${have.size} món, sẽ bỏ qua các món này.`);

  const profile = path.join(DIR, "chrome-profile");
  const launch = { headless: HEADLESS, viewport: null, args: ["--lang=en-US", "--disable-features=Translate"], permissions: ["clipboard-read", "clipboard-write"] };
  let ctx;
  try { ctx = await chromium.launchPersistentContext(profile, { ...launch, channel: "chrome" }); }
  catch { ctx = await chromium.launchPersistentContext(profile, launch); } // máy không có Chrome thì dùng Chromium của Playwright
  if (process.env.LASSO_MOCK) await ctx.route("https://app.getlasso.co/**", r => r.fulfill({ contentType: "text/html", body: fs.readFileSync(path.join(process.env.LASSO_MOCK, /\/brand\//.test(r.request().url()) ? "brand.html" : "product.html"), "utf8") })); // chỉ để thử
  const page = ctx.pages()[0] || await ctx.newPage();
  const done = new Set(rows.map(r => r.id));

  const todo = [];
  {
    await needLogin(page, ctx);
    for (const brand of BRANDS) {
      log("Hãng", brand, "...");
      let list = [];
      try { list = await brandProducts(page, brand); } catch (e) { log("  lỗi trang hãng:", e.message.split("\n")[0]); }
      list = list.map(p => ({ ...p, brand, ...parseCard(p.cardText) }));
      list.sort((a, b) => (b.estCommission ?? 0) - (a.estCommission ?? 0));
      const fresh = list.filter(p => !have.has(p.id));
      const pick = MAX ? fresh.slice(0, MAX) : fresh;
      log(`  ${list.length} sản phẩm trên Lasso, ${list.length - fresh.length} đã có trên trang, lấy ${pick.length}.`);
      todo.push(...pick);
    }
  }

  let n = 0;
  for (const p of todo) {
    n++;
    if (done.has(p.id)) continue;
    log(`[${n}/${todo.length}] ${p.brand} ${p.id}`);
    const r = { id: p.id, brand: p.brand, name: "", type: "", category: "", price: p.price ?? null, commissionPct: p.commissionPct ?? null, estCommission: p.estCommission ?? null,
      lassoLink: "", linkCheck: "", amazonLink: `https://www.amazon.com/dp/${p.id}`, lassoPage: `https://app.getlasso.co/plus/product/${p.id}`,
      images: [], about: [], imgText: [], aplus: "", rating: null, ratingCount: null, reviews: [], lassoCard: p.cardText || "", skip: "", note: "" };
    try {
      const g = await getLink(page, p.id);
      r.lassoLink = g.link || ""; r.note = g.note || "";
      r.name = g.name || p.name || "";
      r.images = [...new Set([...(g.imgs || []), ...(p.imgs || [])].map(bigImg))].filter(u => !u.includes(PLACEHOLDER));
    } catch (e) { r.note = "lỗi Lasso: " + e.message.split("\n")[0]; }
    if (r.lassoLink) r.linkCheck = await checkLink(ctx, r.lassoLink, p.id);
    // tự bỏ món không dùng được (không cần hỏi lại)
    if (!r.lassoLink) r.skip = "không có link Lasso";
    else if (!r.images.length) r.skip = "không có ảnh";
    rows.push(r); done.add(r.id); save();
    log(`   ${r.skip ? "BỎ (" + r.skip + ")" : "OK"}  ${r.name.slice(0, 60)}  ảnh:${r.images.length}`);
    await pause();
  }
  save();
  await ctx.close();
  const ok = rows.filter(r => !r.skip).length;
  log(`XONG: ${rows.length} món, dùng được ${ok}, bỏ ${rows.length - ok}. File: ${OUT}`);
  if (PUSH && rows.length) push();
})().catch(e => { log("LỖI:", e && e.stack || e); process.exit(1); });
