const { chromium, firefox, webkit } = require(process.env.GLOAM_PLAYWRIGHT_MODULE || "playwright");

const url = process.argv[2] || "http://127.0.0.1:5178/";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function audit(name, browserType, launchOptions = {}) {
  const browser = await browserType.launch({ headless: true, ...launchOptions });
  const results = [];
  for (const viewport of [{ label: "desktop", width: 1440, height: 900 }, { label: "mobile-360", width: 360, height: 800 }]) {
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

    await page.getByRole("checkbox", { name: /몸통/ }).click();
    await page.getByRole("button", { name: "괴수 도감과 막간" }).click();
    await page.getByRole("checkbox", { name: "야영지·정착지 확인" }).click();
    await page.getByRole("checkbox", { name: "식사 확인" }).click();
    const restSelectionSynchronized = await page.getByRole("button", { name: "다음 날 아침 · 부상 하나 회복" }).isEnabled();

    await page.getByRole("button", { name: "판정과 전투" }).click();
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
    const printedRulebookVisual = await page.evaluate(() => {
      const panel = document.querySelector(".panel");
      const title = document.querySelector(".gloam-title");
      const bodyStyle = getComputedStyle(document.body);
      const panelStyle = panel ? getComputedStyle(panel) : null;
      const titleStyle = title ? getComputedStyle(title) : null;
      const prohibitedGradients = [...document.querySelectorAll("*")].filter((element) => getComputedStyle(element).backgroundImage.includes("gradient")).length;
      return {
        bodyFont: bodyStyle.fontFamily,
        titleFont: titleStyle?.fontFamily || "",
        paperBackground: getComputedStyle(document.querySelector(".app-shell") || document.body).backgroundColor,
        panelRadius: panelStyle?.borderRadius || "",
        panelShadow: panelStyle?.boxShadow || "",
        prohibitedGradients,
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
      await page.getByRole("button", { name: "판정과 전투" }).click();
      await page.getByRole("heading", { name: /플레이어 손패/ }).scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      offlineApp = await page.evaluate(() => ({
        title: document.querySelector("h1")?.textContent || "",
        status: document.querySelector('[role="status"]')?.textContent || "",
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        visibleCards: [...document.querySelectorAll(".playing-card img")]
          .filter((image) => !image.closest("details:not([open])") && image.getClientRects().length)
          .map((image) => ({ src: image.getAttribute("src"), ok: image.naturalWidth > 0 })),
      }));
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
