const { spawn } = require("node:child_process");
const path = require("node:path");
const { webkit } = require(process.env.GLOAM_PLAYWRIGHT_MODULE || "playwright");

const root = process.cwd();
const port = 4184;
const url = `http://127.0.0.1:${port}/`;
const vite = path.join(root, "node_modules", ".bin", "vite");
const rulebookPassphrase = process.env.GLOAM_RULEBOOK_PASSPHRASE;
let server;
let browser;

if (!rulebookPassphrase) throw new Error("GLOAM_RULEBOOK_PASSPHRASE is required for rulebook certification");

async function unlockRulebook(page) {
  const input = page.getByLabel("개인 룰북 암호");
  await page.waitForFunction(() => Boolean(document.querySelector(".rulebook-source-text") || document.querySelector(".rulebook-unlock input[type='password']")), null, { timeout: 10000 });
  if (await input.isVisible()) {
    await input.fill(rulebookPassphrase);
    await page.getByRole("button", { name: "원문 잠금 풀기", exact: true }).click();
  }
  await page.locator(".rulebook-source-text").first().waitFor({ state: "visible", timeout: 10000 });
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function startServer() {
  const child = spawn(vite, ["preview", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    stdio: "ignore",
  });
  child.on("error", (error) => {
    process.stderr.write(`${error.stack || error}\n`);
  });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Preview server exited with ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return child;
    } catch {}
    await delay(50);
  }
  child.kill("SIGTERM");
  throw new Error("Preview server did not become ready");
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  await Promise.race([exited, delay(3000)]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function cacheObservedResources(page) {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const worker = navigator.serviceWorker.controller || registration.active;
    if (!worker) throw new Error("No active Service Worker");
    const urls = performance.getEntriesByType("resource").map((entry) => entry.name);
    await new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => reject(new Error("Cache message timed out")), 5000);
      channel.port1.onmessage = () => {
        clearTimeout(timer);
        resolve();
      };
      worker.postMessage({ type: "CACHE_USED_RESOURCES", urls }, [channel.port2]);
    });
  });
}

async function readState(page) {
  const status = await page.getByRole("status").first().textContent();
  await page.getByRole("button", { name: "Create Your Character" }).click();
  const name = await page.getByLabel("이름", { exact: true }).first().inputValue();
  await page.getByRole("button", { name: "Tests & Combat" }).click();
  await page.waitForFunction(() => {
    const visible = [...document.querySelectorAll(".playing-card img")]
      .filter((image) => !image.closest("details:not([open])") && image.getClientRects().length);
    return visible.length > 0 && visible.every((image) => image.complete && image.naturalWidth > 0);
  }, null, { timeout: 5000 });
  const cards = await page.locator(".playing-card img").evaluateAll((images) => images
    .filter((image) => !image.closest("details:not([open])") && image.getClientRects().length)
    .map((image) => ({ src: image.getAttribute("src"), ok: image.naturalWidth > 0 })));
  await page.getByRole("button", { name: "Rulebook", exact: true }).click();
  await page.getByRole("dialog", { name: "통합 룰북" }).waitFor({ state: "visible", timeout: 5000 });
  await unlockRulebook(page);
  await page.getByLabel("인쇄 쪽").fill("31");
  await page.getByRole("button", { name: "쪽 펼치기", exact: true }).click();
  const rulebook = await page.locator(".rulebook-source-text").evaluate((element) => (element.textContent?.length || 0) > 100);
  await page.getByRole("button", { name: "통합 룰북 닫기", exact: true }).click();
  return { status, name, cards, rulebook };
}

(async () => {
  server = await startServer();
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ locale: "ko-KR", viewport: { width: 360, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 10000 });
  await page.getByLabel("이름", { exact: true }).first().fill("WebKit 원본 중단 관문");
  await page.getByRole("button", { name: "Tests & Combat" }).click();
  await page.getByRole("button", { name: "괴수 들이기" }).click();
  await page.getByRole("button", { name: "플레이어 4장까지 · 괴수마다 3장" }).click();
  await page.waitForTimeout(650);
  await cacheObservedResources(page);
  await page.waitForTimeout(450);

  const online = await readState(page);
  await stopServer(server);
  server = null;

  await page.reload({ waitUntil: "domcontentloaded", timeout: 10000 });
  await page.getByRole("status").waitFor({ state: "visible", timeout: 5000 });
  const originUnavailable = await readState(page);

  server = await startServer();
  await page.reload({ waitUntil: "networkidle", timeout: 10000 });
  const returnedOnline = await readState(page);

  const result = {
    engine: "WebKit",
    viewport: "mobile-360",
    serviceWorkerControlled: await page.evaluate(() => Boolean(navigator.serviceWorker?.controller)),
    online,
    originUnavailable,
    returnedOnline,
    originRecovery: originUnavailable.name === "WebKit 원본 중단 관문"
      && originUnavailable.status.includes("Player 57") && originUnavailable.status.includes("Referee 21")
      && originUnavailable.cards.length > 0
      && originUnavailable.cards.every((card) => card.ok)
      && originUnavailable.rulebook,
    returnOnline: returnedOnline.name === originUnavailable.name
      && returnedOnline.status.includes("Player 57") && returnedOnline.status.includes("Referee 21")
      && returnedOnline.cards.length === originUnavailable.cards.length
      && returnedOnline.cards.every((card) => card.ok)
      && returnedOnline.rulebook,
    errors,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  await context.close();
  await browser.close();
  browser = null;
  await stopServer(server);
  server = null;

  if (!result.serviceWorkerControlled || !result.originRecovery || !result.returnOnline || result.errors.length) {
    process.exitCode = 1;
  }
})().catch(async (error) => {
  process.stderr.write(`${error.stack || error}\n`);
  await browser?.close();
  await stopServer(server);
  process.exitCode = 1;
});
