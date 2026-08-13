const { chromium, firefox, webkit } = require(process.env.GLOAM_PLAYWRIGHT_MODULE || "playwright");

const url = process.argv[2] || "http://127.0.0.1:5178/";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const rulebookPassphrase = process.env.GLOAM_RULEBOOK_PASSPHRASE;

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

async function audit(name, browserType, launchOptions = {}) {
  const browser = await browserType.launch({ headless: true, ...launchOptions });
  const results = [];
  for (const viewport of [
    { label: "ultrawide-3440", width: 3440, height: 1440 },
    { label: "desktop", width: 1440, height: 900 },
    { label: "mobile-360", width: 360, height: 800 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce", locale: "ko-KR" });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    const started = performance.now();
    const response = await page.goto(url, { waitUntil: "networkidle" });
    const loadMs = performance.now() - started;
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 10000 });
    const title = await page.locator("h1").first().textContent();
    const status = await page.getByRole("status").first().textContent();
    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.getBoundingClientRect().width,
    }));

    await page.keyboard.press("Tab");
    const keyboardFocus = await page.evaluate(() => ({
      tag: document.activeElement?.tagName || "",
      label: document.activeElement?.getAttribute("aria-label") || document.activeElement?.labels?.[0]?.textContent?.trim() || document.activeElement?.getAttribute("placeholder") || document.activeElement?.textContent?.trim() || "",
      outline: getComputedStyle(document.activeElement).outlineStyle,
    }));
    const reducedMotion = await page.locator("button").first().evaluate((element) => ({
      transitionDuration: getComputedStyle(element).transitionDuration,
      animationDuration: getComputedStyle(element).animationDuration,
    }));

    const rulebookResourcesBefore = await page.evaluate(() => performance.getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((resource) => resource.includes("RulebookTransplant") || resource.includes("/rulebook/")));
    await page.getByRole("button", { name: "Rulebook", exact: true }).click();
    const rulebookDialog = page.getByRole("dialog", { name: "통합 룰북" });
    await rulebookDialog.waitFor({ state: "visible" });
    await unlockRulebook(page);
    await page.keyboard.press("Shift+Tab");
    const rulebookFocusTrapped = await page.evaluate(() => Boolean(document.querySelector(".rulebook-transplant")?.contains(document.activeElement)));
    await page.locator(".rulebook-note textarea").fill(`개인 룰북 메모 · ${name} · ${viewport.label}`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(50);
    const rulebookFocusReturned = await page.evaluate(() => document.activeElement?.textContent?.trim() === "Rulebook");
    await page.getByRole("button", { name: "Rulebook", exact: true }).click();
    await rulebookDialog.waitFor({ state: "visible" });
    await unlockRulebook(page);
    const rulebookNotePersisted = await page.locator(".rulebook-note textarea").inputValue();
    await page.getByLabel("원문 찾기").fill("Riposte");
    const riposteSearchResults = await page.locator(".rulebook-search-results button").count();
    await page.getByLabel("원문 찾기").fill("");
    await page.getByLabel("인쇄 쪽").fill("54");
    await page.getByRole("button", { name: "쪽 펼치기", exact: true }).click();
    await page.getByRole("heading", { name: "Gloam v1.02 · p.54", exact: true }).waitFor({ state: "visible" });
    const rulebookLayout = await page.evaluate(() => {
      const dialog = document.querySelector(".rulebook-transplant");
      const table = document.querySelector(".rulebook-source-text.table-layout");
      return {
        pageTitle: document.querySelector(".rulebook-source-heading h2")?.textContent || "",
        noDocumentOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        noDialogOverflow: Boolean(dialog && dialog.scrollWidth <= dialog.clientWidth),
        tableHasInternalScroll: Boolean(table && table.scrollWidth > table.clientWidth),
        tableWhiteSpace: table ? getComputedStyle(table).whiteSpace : "",
      };
    });
    await page.getByRole("button", { name: "쪽에 갈피 꽂기", exact: true }).click();
    const rulebookStorage = await page.evaluate(() => {
      const reference = JSON.parse(localStorage.getItem("gloam-rulebook-reference-v1") || "null");
      return {
        campaignKeyExists: localStorage.getItem("gloam_companion_v2") !== null,
        referenceKeyExists: reference !== null,
        bookmarks: reference?.bookmarks?.length || 0,
        notes: Object.keys(reference?.notes || {}).length,
      };
    });
    const rulebookResourcesAfter = await page.evaluate(() => performance.getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((resource) => resource.includes("RulebookTransplant") || resource.includes("/rulebook/")));
    await page.getByRole("button", { name: "통합 룰북 닫기", exact: true }).click();
    const rulebook = {
      lazyBeforeOpen: rulebookResourcesBefore.length === 0,
      resourcesAfterOpen: rulebookResourcesAfter,
      riposteSearchResults,
      notePersisted: rulebookNotePersisted.includes(`${name} · ${viewport.label}`),
      focusReturned: rulebookFocusReturned,
      focusTrapped: rulebookFocusTrapped,
      layout: rulebookLayout,
      storage: rulebookStorage,
    };

    await page.getByRole("checkbox", { name: /몸통/ }).click();
    await page.getByRole("button", { name: "Bestiary & Downtime" }).click();
    await page.getByRole("checkbox", { name: "야영지·정착지 확인" }).click();
    await page.getByRole("checkbox", { name: "식사 확인" }).click();
    const restSelectionSynchronized = await page.getByRole("button", { name: "다음 날 아침 · 부상 하나 회복" }).isEnabled();

    await page.getByRole("button", { name: "Tests & Combat" }).click();
    await page.getByRole("button", { name: "괴수 들이기" }).click();
    await page.getByRole("button", { name: "플레이어 4장까지 · 괴수마다 3장" }).click();
    await page.getByRole("heading", { name: /플레이어 손패/ }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const cards = await page.locator(".playing-card img").evaluateAll((images) => images.map((image) => ({
      src: image.getAttribute("src"),
      width: image.naturalWidth,
      height: image.naturalHeight,
      visible: !image.closest("details:not([open])") && Boolean(image.getClientRects().length),
    })));
    const unnamedButtons = await page.locator("button").evaluateAll((buttons) => buttons.filter((button) => !(button.getAttribute("aria-label") || button.textContent?.trim())).length);
    const unnamedCardFigures = await page.locator("figure.playing-card").evaluateAll((figures) => figures.filter((figure) => !figure.getAttribute("aria-label")).length);
    const navigation = await page.evaluate(() => {
      const entry = performance.getEntriesByType("navigation")[0];
      return entry ? { domContentLoaded: entry.domContentLoadedEventEnd, load: entry.loadEventEnd, transfer: entry.transferSize } : null;
    });
    await page.getByRole("button", { name: "Create Your Character" }).click();
    const printedRulebookVisual = await page.evaluate(() => {
      const panel = document.querySelector(".panel");
      const title = document.querySelector(".gloam-title");
      const shell = document.querySelector(".app-shell");
      const main = document.querySelector("main");
      const firstLabel = document.querySelector("label");
      const firstButton = document.querySelector("button");
      const attributeInput = document.querySelector('.stat-box input[type="number"]');
      const bodyStyle = getComputedStyle(document.body);
      const panelStyle = panel ? getComputedStyle(panel) : null;
      const titleStyle = title ? getComputedStyle(title) : null;
      const layeredPrintTextures = [...document.querySelectorAll("*")].filter((element) => getComputedStyle(element).backgroundImage.includes("gradient")).length;
      return {
        bodyFont: bodyStyle.fontFamily,
        rootFontSize: getComputedStyle(document.documentElement).fontSize,
        titleFont: titleStyle?.fontFamily || "",
        paperBackground: getComputedStyle(shell || document.body).backgroundColor,
        shellWidth: shell ? Number(shell.getBoundingClientRect().width.toFixed(1)) : 0,
        mainWidth: main ? Number(main.getBoundingClientRect().width.toFixed(1)) : 0,
        labelFontSize: firstLabel ? getComputedStyle(firstLabel).fontSize : "",
        buttonFontSize: firstButton ? getComputedStyle(firstButton).fontSize : "",
        attributeInput: attributeInput ? {
          appearance: getComputedStyle(attributeInput).appearance,
          textAlign: getComputedStyle(attributeInput).textAlign,
          paddingLeft: getComputedStyle(attributeInput).paddingLeft,
          paddingRight: getComputedStyle(attributeInput).paddingRight,
        } : null,
        panelRadius: panelStyle?.borderRadius || "",
        panelShadow: panelStyle?.boxShadow || "",
        layeredPrintTextures,
      };
    });
    const serviceWorker = await page.evaluate(async () => ({
      supported: "serviceWorker" in navigator,
      controlled: Boolean(navigator.serviceWorker?.controller),
      registrations: "serviceWorker" in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
    }));
    const onlineConsoleErrors = [...consoleErrors];
    let offlineReload = false;
    let offlineError = "";
    let offlineApp = null;
    await page.waitForTimeout(450);
    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "domcontentloaded", timeout: 5000 });
      offlineReload = true;
      await page.getByRole("status").waitFor({ state: "visible", timeout: 5000 });
      await page.getByRole("button", { name: "Tests & Combat" }).click();
      await page.getByRole("heading", { name: /플레이어 손패/ }).scrollIntoViewIfNeeded();
      await page.getByRole("button", { name: "Rulebook", exact: true }).click();
      await page.getByRole("dialog", { name: "통합 룰북" }).waitFor({ state: "visible", timeout: 5000 });
      await unlockRulebook(page);
      await page.getByLabel("인쇄 쪽").fill("31");
      await page.getByRole("button", { name: "쪽 펼치기", exact: true }).click();
      await page.getByRole("heading", { name: "Gloam v1.02 · p.31", exact: true }).waitFor({ state: "visible", timeout: 5000 });
      const offlineRulebook = await page.evaluate(() => ({
        title: document.querySelector(".rulebook-source-heading h2")?.textContent || "",
        sourceLoaded: (document.querySelector(".rulebook-source-text")?.textContent?.length || 0) > 100,
      }));
      await page.getByRole("button", { name: "통합 룰북 닫기", exact: true }).click();
      await page.waitForTimeout(250);
      offlineApp = await page.evaluate((rulebook) => ({
        title: document.querySelector("h1")?.textContent || "",
        status: document.querySelector('[role="status"]')?.textContent || "",
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        visibleCards: [...document.querySelectorAll(".playing-card img")]
          .filter((image) => !image.closest("details:not([open])") && image.getClientRects().length)
          .map((image) => ({ src: image.getAttribute("src"), ok: image.naturalWidth > 0 })),
        rulebook,
      }), offlineRulebook);
    } catch (error) {
      offlineError = String(error?.message || error).split("\n")[0];
    }
    await context.setOffline(false);
    if (offlineReload) await page.reload({ waitUntil: "networkidle", timeout: 10000 });

    results.push({
      viewport: viewport.label,
      http: response?.status() || 0,
      loadMs: Number(loadMs.toFixed(1)),
      title,
      status,
      noHorizontalOverflow: layout.scrollWidth <= layout.clientWidth,
      layout,
      cards: {
        count: cards.length,
        visible: cards.filter((card) => card.visible).length,
        brokenVisible: cards.filter((card) => card.visible && (card.width === 0 || card.height === 0)).length,
        deferredHidden: cards.filter((card) => !card.visible && (card.width === 0 || card.height === 0)).length,
        first: cards[0],
      },
      accessibility: { keyboardFocus, unnamedButtons, unnamedCardFigures, reducedMotion },
      restSelectionSynchronized,
      navigation,
      printedRulebookVisual,
      rulebook,
      offline: { serviceWorker, reload: offlineReload, app: offlineApp, error: offlineError, consoleErrors: consoleErrors.slice(onlineConsoleErrors.length) },
      consoleErrors: onlineConsoleErrors,
    });
    await context.close();
  }
  await browser.close();
  return { name, results };
}

(async () => {
  const reports = [];
  reports.push(await audit("Google Chrome", chromium, { executablePath: chromePath }));
  reports.push(await audit("Firefox engine", firefox));
  reports.push(await audit("WebKit engine", webkit));
  process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`);
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
