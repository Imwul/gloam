const { chromium } = require(process.env.GLOAM_PLAYWRIGHT_MODULE || "playwright");

const url = process.argv[2] || "http://127.0.0.1:4182/";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const waitForAutosave = (page) => page.waitForTimeout(450);
let activeBrowser;

const cacheObservedResources = (page) => page.evaluate(async () => {
  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller || registration.active;
  if (!worker) throw new Error("No active Service Worker");
  const urls = performance.getEntriesByType("resource").map((entry) => entry.name);
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => reject(new Error("Cache message timed out")), 5000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(event.data);
    };
    worker.postMessage({ type: "CACHE_USED_RESOURCES", urls }, [channel.port2]);
  });
});

const readVisibleState = async (page) => {
  const name = await page.getByLabel("이름", { exact: true }).first().inputValue();
  await page.getByRole("button", { name: "연대기와 보존" }).click();
  const campaign = await page.getByLabel("캠페인 이름", { exact: true }).inputValue();
  const status = await page.getByRole("status").first().textContent();
  const logText = (await page.locator(".log-list article p").allTextContents()).join("\n");
  await page.getByRole("button", { name: "인물 기록" }).click();
  const inventory = await page.locator('input[aria-label="물품 이름"]').evaluateAll((inputs) => inputs.map((input) => input.value));
  const notes = await page.locator("main textarea").first().inputValue();
  return { name, campaign, status, logText, inventory, notes };
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  activeBrowser = browser;

  const coldContext = await browser.newContext({ serviceWorkers: "allow" });
  await coldContext.setOffline(true);
  const coldPage = await coldContext.newPage();
  let coldFirstVisitLoaded = false;
  try {
    await coldPage.goto(url, { waitUntil: "domcontentloaded", timeout: 5000 });
    coldFirstVisitLoaded = Boolean(await coldPage.locator("h1").count());
  } catch {}
  await coldContext.close();

  const seedContext = await browser.newContext({ serviceWorkers: "block", locale: "ko-KR" });
  const seedPage = await seedContext.newPage();
  await seedPage.goto(url, { waitUntil: "networkidle" });
  await seedPage.getByLabel("이름", { exact: true }).first().fill("오프라인 관문 아스터");
  await seedPage.locator("main textarea").first().fill("Service Worker 설치 전 기존 캠페인");
  await seedPage.getByPlaceholder("물품 이름").fill("기존 여행 장비");
  await seedPage.getByRole("button", { name: "물품 기록" }).click();
  await seedPage.getByRole("button", { name: "연대기와 보존" }).click();
  await seedPage.getByLabel("캠페인 이름", { exact: true }).fill("Gloam Offline Gate Closure");
  await seedPage.getByLabel("연대기에 적을 기록").fill("Service Worker 설치 전 기록");
  await seedPage.getByRole("button", { name: "기록 더하기" }).click();
  await waitForAutosave(seedPage);
  const opaqueCampaignStorage = await seedContext.storageState();
  await seedContext.close();

  const context = await browser.newContext({
    storageState: opaqueCampaignStorage,
    serviceWorkers: "allow",
    locale: "ko-KR",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const onlineErrors = [];
  const offlineErrors = [];
  const onlineFailedRequests = [];
  const offlineFailedRequests = [];
  let offlinePhase = false;
  page.on("console", (message) => {
    if (message.type() === "error") (offlinePhase ? offlineErrors : onlineErrors).push(message.text());
  });
  page.on("pageerror", (error) => (offlinePhase ? offlineErrors : onlineErrors).push(error.message));
  page.on("requestfailed", (request) => (offlinePhase ? offlineFailedRequests : onlineFailedRequests).push({
    url: request.url(),
    error: request.failure()?.errorText || "unknown",
  }));

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 10000 });
  const serviceWorker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      registered: Boolean(registration),
      controlled: Boolean(navigator.serviceWorker.controller),
      state: registration?.active?.state || null,
      script: registration?.active?.scriptURL || null,
    };
  });

  const beforeInstallState = await readVisibleState(page);
  if (beforeInstallState.name !== "오프라인 관문 아스터" || beforeInstallState.campaign !== "Gloam Offline Gate Closure") {
    throw new Error("Existing campaign did not survive Service Worker installation");
  }

  await page.getByRole("button", { name: "판정과 전투" }).click();
  await page.getByRole("button", { name: "괴수 들이기" }).click();
  await page.getByRole("button", { name: "플레이어 4장까지 · 괴수마다 3장" }).click();
  await page.getByRole("heading", { name: /플레이어 손패/ }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  const visibleOnlineCards = await page.locator(".playing-card img").evaluateAll((images) => images
    .filter((image) => !image.closest("details:not([open])") && image.getClientRects().length)
    .map((image) => ({ src: image.src, ok: image.naturalWidth > 0 })));
  if (!visibleOnlineCards.length || visibleOnlineCards.some((card) => !card.ok)) {
    throw new Error(`Online card rendering failed: ${JSON.stringify(visibleOnlineCards)}`);
  }
  await cacheObservedResources(page);

  const cacheBeforeOffline = await page.evaluate(async () => {
    const names = await caches.keys();
    const shellName = names.find((name) => name.endsWith("-shell"));
    const runtimeName = names.find((name) => name.endsWith("-runtime"));
    const shellRequests = shellName ? await (await caches.open(shellName)).keys() : [];
    const runtimeRequests = runtimeName ? await (await caches.open(runtimeName)).keys() : [];
    return {
      names,
      shellTarot: shellRequests.filter((request) => new URL(request.url).pathname.includes("/tarot/")).length,
      runtimeTarot: runtimeRequests.filter((request) => new URL(request.url).pathname.includes("/tarot/")).map((request) => request.url),
      shellUrls: shellRequests.map((request) => request.url),
      shellEntries: shellRequests.length,
      runtimeEntries: runtimeRequests.length,
    };
  });
  if (cacheBeforeOffline.shellTarot !== 0 || cacheBeforeOffline.runtimeTarot.length >= 78) {
    throw new Error("Tarot cards were incorrectly precached as a complete deck");
  }
  if (!cacheBeforeOffline.runtimeTarot.includes(visibleOnlineCards[0].src)) {
    throw new Error("Displayed card was not added to runtime cache");
  }
  await waitForAutosave(page);
  offlinePhase = true;
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 10000 });
  try {
    await page.getByRole("status").waitFor({ state: "visible", timeout: 5000 });
  } catch {
    const offlineDebug = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      body: document.body.innerText.slice(0, 500),
      scripts: [...document.scripts].map((script) => script.src),
      styles: [...document.styleSheets].map((sheet) => sheet.href),
    }));
    throw new Error(`Warm offline shell did not render: ${JSON.stringify({ offlineDebug, offlineErrors })}`);
  }
  const warmOfflineState = await readVisibleState(page);

  await page.locator("main textarea").first().fill("오프라인에서 이어 쓴 인물 기록");
  await page.getByPlaceholder("물품 이름").fill("오프라인 횃불");
  await page.getByRole("button", { name: "물품 기록" }).click();

  await page.getByRole("button", { name: "판정과 전투" }).click();
  const endRound = page.getByRole("button", { name: "라운드 끝내기" });
  if (await endRound.isEnabled()) await endRound.click();
  const offlineCachedCards = await page.locator(".playing-card img").evaluateAll((images) => images
    .filter((image) => !image.closest("details:not([open])") && image.getClientRects().length)
    .map((image) => ({ src: image.src, ok: image.naturalWidth > 0 })));

  await page.getByRole("button", { name: "비술과 징조" }).click();
  await page.getByRole("button", { name: "첫 준비 · 소 아르카나 단어 뽑기" }).click();
  await page.getByRole("button", { name: "양", exact: true }).click();

  await page.getByRole("button", { name: "연대기와 보존" }).click();
  await page.getByLabel("연대기에 적을 기록").fill("offline-undo-probe");
  await page.getByRole("button", { name: "기록 더하기" }).click();
  await page.getByRole("button", { name: /되돌리기/ }).click();
  const undoRemovedProbe = (await page.locator(".log-list").innerText()).includes("offline-undo-probe") === false;
  await page.getByLabel("연대기에 적을 기록").fill("오프라인 플레이 최종 기록");
  await page.getByRole("button", { name: "기록 더하기" }).click();
  await waitForAutosave(page);

  await page.reload({ waitUntil: "domcontentloaded", timeout: 10000 });
  await page.getByRole("status").waitFor({ state: "visible" });
  const offlineReloadedState = await readVisibleState(page);

  offlinePhase = false;
  await context.setOffline(false);
  await page.reload({ waitUntil: "networkidle", timeout: 10000 });
  const returnedOnlineState = await readVisibleState(page);

  const result = {
    coldFirstVisitLoaded,
    serviceWorker,
    cacheBeforeOffline,
    existingCampaignAfterInstall: beforeInstallState.name === "오프라인 관문 아스터"
      && beforeInstallState.campaign === "Gloam Offline Gate Closure"
      && beforeInstallState.inventory.includes("기존 여행 장비"),
    warmOfflineReload: warmOfflineState.name === "오프라인 관문 아스터"
      && warmOfflineState.campaign === "Gloam Offline Gate Closure"
      && warmOfflineState.status.includes("57/21"),
    displayedCardOffline: offlineCachedCards.some((card) => card.src === visibleOnlineCards[0].src && card.ok),
    offlineGameplay: offlineReloadedState.notes === "오프라인에서 이어 쓴 인물 기록"
      && offlineReloadedState.inventory.includes("오프라인 횃불")
      && offlineReloadedState.logText.includes("오프라인 플레이 최종 기록")
      && undoRemovedProbe
      && offlineReloadedState.status.includes("57/21"),
    returnOnline: returnedOnlineState.notes === offlineReloadedState.notes
      && returnedOnlineState.inventory.includes("오프라인 횃불")
      && returnedOnlineState.logText.includes("오프라인 플레이 최종 기록")
      && returnedOnlineState.status.includes("57/21"),
    evidence: {
      warmOfflineState,
      offlineReloadedState,
      returnedOnlineState,
      undoRemovedProbe,
      visibleOnlineCards,
      offlineCachedCards,
    },
    onlineErrors,
    offlineErrors,
    onlineFailedRequests,
    offlineFailedRequests,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  await context.close();
  await browser.close();

  if (!result.serviceWorker.registered
    || !result.serviceWorker.controlled
    || !result.existingCampaignAfterInstall
    || !result.warmOfflineReload
    || !result.displayedCardOffline
    || !result.offlineGameplay
    || !result.returnOnline
    || result.onlineErrors.length > 0) process.exitCode = 1;
})().catch(async (error) => {
  process.stderr.write(`${error.stack || error}\n`);
  await activeBrowser?.close();
  process.exitCode = 1;
});
