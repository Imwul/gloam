/*
 * Run against a Vite development server in an isolated browser context:
 * GLOAM_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/play-experience-certification.cjs http://127.0.0.1:5173
 * Optional: GLOAM_BROWSER_EXECUTABLE, GLOAM_CERT_OUTPUT.
 * This uses deterministic rulebook scenarios and never changes a user's browser storage.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.GLOAM_PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:5173';
const output = process.env.GLOAM_CERT_OUTPUT || path.join(os.tmpdir(), 'gloam-play-experience');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.GLOAM_BROWSER_EXECUTABLE || (fs.existsSync(chrome) ? chrome : undefined);
const report = { url, completed: [], measurements: [], screenshots: [], pageErrors: [] };
fs.mkdirSync(output, { recursive: true });
const check = (name, actual, expected) => { assert.deepEqual(actual, expected, name); report.completed.push(name); };

async function main() {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.pageErrors.push(error.message));
  const screenshot = async name => {
    const filename = path.join(output, `${name}.png`);
    await page.screenshot({ path: filename });
    report.screenshots.push(filename);
  };
  const stored = async () => {
    await page.waitForTimeout(230); // Production persistence is deliberately debounced by 180ms.
    return page.evaluate(() => JSON.parse(localStorage.getItem('gloam_companion_v2')).state);
  };
  const economy = () => page.evaluate(async () => {
    const { cardEconomyValid } = await import('/src/App.tsx');
    return cardEconomyValid(JSON.parse(localStorage.getItem('gloam_companion_v2')).state);
  });
  const destinationVisible = async target => {
    const geometry = await target.evaluate(item => ({ top: item.getBoundingClientRect().top, navBottom: document.querySelector('.tabs').getBoundingClientRect().bottom, viewport: innerHeight }));
    return geometry.top >= geometry.navBottom - 1 && geometry.top < geometry.viewport - 100;
  };
  const tab = async name => {
    await page.locator(`button[data-tab="${name}"]`).click();
    check(`${name}: navigation returns to page top`, await page.evaluate(() => scrollY), 0);
  };
  const panel = title => page.locator('.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  const seed = async mode => {
    await page.evaluate(async mode => {
      const { freshState } = await import('/src/App.tsx');
      const state = freshState();
      Object.assign(state.character, {
        name: '리즈', age: 25, vocation: 'Cutpurse', stats: { cups: 2, wands: 1, swords: 3, coins: 4 },
        resolve: 3, xp: 0, talents: ['Nimble'],
        goals: [
          { id: 'g1', text: '옛 다리를 지켜 마을 사람들을 피신시킨다.', status: 'active', note: '' },
          { id: 'g2', text: '거인의 무기를 빼앗는다.', status: 'active', note: '' },
          { id: 'g3', text: '남쪽 성문을 다시 연다.', status: 'active', note: '' },
        ],
        instincts: ['위험이 보이면 검을 뽑는다.', '', ''],
        friends: [{ id: 'friend1', name: '마라', location: '남쪽 마을', connection: '여행 동료', history: [] }],
      });
      const take = (suit, rank) => {
        const index = state.playerDeck.findIndex(card => card.suit === suit && card.rank === rank);
        const card = state.playerDeck.splice(index, 1)[0];
        return { ...card, reversed: false };
      };
      if (mode.startsWith('combat')) {
        state.combat = {
          ...state.combat, active: true, objective: '마을 사람들이 피신할 때까지 거인을 지연한다.',
          playerHand: [take('wands', '7'), take('coins', '2'), take('swords', 'Queen'), take('wands', '3')],
          monsters: [{
            id: 'giant1', monsterId: 8, name: 'Giant', woundsTaken: 0, woundNotes: [],
            wounds: { head: false, torso: false, leftArm: false, rightArm: false, leftLeg: false, rightLeg: false },
            dead: false, armorNotches: {}, hand: [take('cups', '7'), take('swords', '4'), take('wands', '4')],
            initiative: null, initiativeRevealed: false, notes: '',
          }],
        };
        if (mode === 'combat-magic' || mode === 'combat-bound') {
          state.character.talents = mode === 'combat-magic' ? ['Magick', 'Undo Magick'] : [];
          state.character.spells = [{ id: 'spell1', name: 'Fire Wall', effectNote: '거인의 진로를 막는다.' }];
          state.character.boundMagic = [{ id: 'bound1', object: '은반지', spell: 'Fire Wall', charges: 2 }];
        }
      } else {
        state.playerDeck = [take('cups', '2'), take('wands', '3'), ...state.playerDeck];
        if (mode === 'rest') state.character.wounds.leftLeg = true;
        if (mode === 'presence') state.character.talents = ['Disarming Presence'];
      }
      localStorage.setItem('gloam_companion_v2', JSON.stringify({ version: 2, state, undo: [] }));
    }, mode);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.play-test').waitFor();
  };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('.topbar').waitFor();
    await seed('play');
    for (const width of [1440, 768, 390, 340]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : width === 768 ? 1024 : 844 });
      for (const name of ['play', 'tests', 'character', 'map', 'magic', 'downtime']) {
        await tab(name);
        check(`${width}px ${name}: no document horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await screenshot(`${width}-${name}`);
      }
      await tab('play');
      report.measurements.push({
        width,
        panels: await page.locator('.panel').evaluateAll(items => items.map(item => ({
          title: item.querySelector('h2')?.textContent,
          top: Math.round(item.getBoundingClientRect().top),
          height: Math.round(item.getBoundingClientRect().height),
        }))),
        drawButtonTop: await page.locator('.play-draw-line button').evaluate(item => Math.round(item.getBoundingClientRect().top)),
      });
    }
    await page.getByRole('button', { name: '판정 규칙', exact: true }).click();
    check('phone rule drawer focuses search', await page.getByLabel('규칙 검색').evaluate(item => item === document.activeElement), true);
    check('phone rule drawer locks background scroll', await page.evaluate(() => document.body.style.overflow), 'hidden');
    await page.getByLabel('규칙 검색').fill('회피');
    check('rule search finds combat response procedure', await page.locator('.quick-layout nav button').count(), 1);
    await page.locator('.quick-layout nav button').click();
    check('combat summary is readable immediately', await page.locator('.quick-reading h3').innerText(), '전투 순서와 행동');
    await screenshot('phone-quick-combat');
    const last = page.locator('.quick-dialog button').last();
    await last.focus();
    await page.keyboard.press('Tab');
    check('rule drawer traps forward keyboard focus', await page.getByRole('button', { name: '규칙 빠른 참조 닫기' }).evaluate(item => item === document.activeElement), true);
    await page.keyboard.press('Escape');
    check('Escape closes rule drawer', await page.locator('.quick-dialog').count(), 0);
    check('rule drawer restores trigger focus', await page.getByRole('button', { name: '판정 규칙', exact: true }).evaluate(item => item === document.activeElement), true);
    check('rule drawer restores page scroll', await page.evaluate(() => document.body.style.overflow), '');
    await page.locator('.save-menu summary').click();
    await page.getByRole('button', { name: '모험 기록', exact: true }).click();
    check('archive menu selection closes flyout', await page.locator('.save-menu').getAttribute('open'), null);

    await page.setViewportSize({ width: 1440, height: 900 });
    await seed('play');
    await page.locator('.play-draw-line button').click();
    let state = await stored();
    check('ordinary Test uses card+Stat against14', [state.test.result.total, state.test.result.target, state.test.result.status], [4, 14, 'failure']);
    await page.getByRole('button', { name: '밀어붙이기 · 한 장 더', exact: true }).click();
    state = await stored();
    check('failed Push grants player and referee Resolve', [state.test.result.total, state.test.result.status, state.character.resolve, state.refereeResolve], [7, 'great-failure', 4, 1]);
    await page.getByRole('button', { name: '결의 1점 · 합계 +1', exact: true }).click();
    state = await stored();
    check('Resolve improves result without feeding referee', [state.test.result.total, state.character.resolve, state.refereeResolve], [8, 3, 1]);
    await page.locator('.play-goal-list > li').first().getByRole('button').first().click();
    state = await stored();
    check('Goal completion grants both Resolve and updates Goal', [state.character.goals[0].status, state.character.resolve, state.refereeResolve], ['completed', 4, 2]);
    await page.getByRole('button', { name: /본능으로 문제 또는 이야기 변화:/ }).click();
    state = await stored();
    check('meaningful Instinct grants both Resolve', [state.character.resolve, state.refereeResolve], [5, 3]);
    await page.locator('.play-relationships summary').click();
    await page.getByRole('button', { name: '도움 청하기 · 결의 1', exact: true }).click();
    state = await stored();
    check('Friend aid consumes only player Resolve', [state.character.resolve, state.refereeResolve], [4, 3]);
    await page.getByRole('button', { name: '사건 카드 뽑기', exact: true }).click();
    state = await stored();
    check('Event draw is available directly from Play', state.events.length, 1);
    await page.getByRole('button', { name: '행동 + 주제', exact: true }).click();
    state = await stored();
    check('Action/Subject oracle draws both correct decks', state.oracles[0].cards.map(card => card.type), ['minor', 'major']);
    check('ordinary play preserves both unique card economies', await economy(), { player: true, referee: true });

    await seed('presence');
    await page.getByRole('button', { name: '반응 판정 준비', exact: true }).click();
    await page.getByRole('button', { name: '반응 +3 · 결의 1', exact: true }).click();
    state = await stored();
    check('Disarming Presence prepares reaction+3 and spends only player Resolve', [state.test.modifier, state.test.disarmingPresenceUsed, state.character.resolve, state.refereeResolve], [3, true, 2, 0]);
    await page.locator('.play-draw-line button').click();
    state = await stored();
    check('Disarming Presence actually changes reaction result2+2+3=7', state.test.result.total, 7);
    check('Disarming Presence cannot charge repeatedly for one reaction', await page.getByRole('button', { name: '반응 +3 적용됨', exact: true }).isDisabled(), true);

    await seed('combat');
    await tab('tests');
    const hand = page.locator('.initiative-grid .card-row > div');
    await hand.nth(1).getByRole('button', { name: '선제권', exact: true }).click();
    await page.locator('.monster-card summary').filter({ hasText: '심판 손패' }).click();
    await page.locator('.monster-card .card-row > div').first().getByRole('button', { name: '선제권', exact: true }).click();
    await page.locator('.initiative-grid').getByRole('button', { name: '공개하기', exact: true }).click();
    await page.locator('.monster-card').getByRole('button', { name: '공개하기', exact: true }).click();
    const action = panel('플레이어 행동과 대응');
    await page.setViewportSize({ width: 390, height: 844 });
    await hand.first().getByRole('button', { name: '행동 선택', exact: true }).click();
    check('phone hand action opens destination below sticky navigation', await destinationVisible(action), true);
    check('phone hand action moves keyboard focus into action panel', await action.evaluate(item => item.contains(document.activeElement)), true);
    await action.locator('select').nth(1).selectOption('giant1');
    await action.locator('select').nth(2).selectOption('minor:wands:7');
    await action.getByRole('checkbox', { name: /조준 공격/ }).check();
    await action.getByLabel('무기 부상').fill('2');
    await action.getByRole('button', { name: '행동 카드 사용', exact: true }).click();
    state = await stored();
    check('official Giant called-shot computes7+3−4=6', [state.combat.lastResult.total, state.combat.lastResult.target, state.combat.lastResult.status, state.combat.lastResult.rawWounds], [6, 7, 'failure', 0]);
    await action.getByRole('button', { name: '플레이어 결의 1점 · 판정 +1', exact: true }).click();
    state = await stored();
    check('official late Resolve makes attack hit', [state.combat.lastResult.total, state.combat.lastResult.status, state.combat.lastResult.rawWounds, state.character.resolve, state.refereeResolve], [7, 'success', 2, 2, 0]);
    await action.getByRole('button', { name: '이 결과로 피해 준비 →', exact: true }).click();
    const damage = panel('부상과 갑옷 적용');
    check('phone result handoff reveals damage below sticky navigation', await destinationVisible(damage), true);
    check('phone result handoff moves keyboard focus into damage panel', await damage.evaluate(item => item.contains(document.activeElement)), true);
    check('damage handoff preserves target and weapon result', [await damage.locator('select').first().inputValue(), await damage.getByLabel('들어온 부상').inputValue()], ['giant1', '2']);
    await damage.getByRole('button', { name: '피해 적용', exact: true }).click();
    state = await stored();
    check('unarmored torso damage records location and2 Wounds', [state.combat.monsters[0].wounds.torso, state.combat.monsters[0].woundsTaken], [true, 2]);
    await damage.locator('select').nth(1).selectOption('leftLeg');
    await damage.getByLabel('들어온 부상').fill('3');
    await damage.getByRole('checkbox', { name: '괴수 갑옷 적용 · AP 2', exact: true }).check();
    await damage.getByLabel('괴수 갑옷 이름').fill('leftGreave');
    await damage.getByRole('button', { name: '피해 적용', exact: true }).click();
    state = await stored();
    check('heavy hit applies AP2, one notch and lasting leg wound', [state.combat.monsters[0].woundsTaken, state.combat.monsters[0].armorNotches['leftLeg:leftGreave'], state.combat.monsters[0].wounds.leftLeg], [3, 1, true]);
    check('Giant leg wound visibly reduces speed4→2', /이동력 2/.test(await page.locator('.monster-card').innerText()), true);
    await damage.locator('select').nth(1).selectOption('rightLeg');
    await damage.getByLabel('들어온 부상').fill('2');
    await damage.getByRole('button', { name: '피해 적용', exact: true }).click();
    state = await stored();
    check('armor damage stays local to the struck body part', [state.combat.monsters[0].woundsTaken, state.combat.monsters[0].wounds.rightLeg, state.combat.monsters[0].armorNotches['rightLeg:leftGreave'] || 0], [3, false, 0]);
    await hand.first().getByRole('button', { name: 'Nimble · 교체', exact: true }).click();
    state = await stored();
    check('Nimble swaps Initiative with hand without feeding referee', [state.combat.playerInitiative.rank, state.combat.playerHand[0].rank, state.character.resolve, state.refereeResolve], ['Queen', '2', 1, 0]);
    check('combat actions, wounds and Nimble preserve unique cards', await economy(), { player: true, referee: true });
    const exportedCombat = state.combat;
    await page.locator('.save-menu summary').click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '저장 내려받기', exact: true }).click()]);
    const payload = fs.readFileSync(await download.path());
    check('export contains complete version2 campaign state', JSON.parse(payload).version, 2);
    await seed('play');
    await page.locator('input[type="file"][accept="application/json"]').setInputFiles({ name: 'certification-save.json', mimeType: 'application/json', buffer: payload });
    state = await stored();
    check('import restores complete active combat state', state.combat, exportedCombat);
    check('imported save preserves both unique card economies', await economy(), { player: true, referee: true });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.play-test').waitFor();
    state = await stored();
    check('reload restores armor notch, leg Wound and swapped Initiative', [state.combat.monsters[0].armorNotches['leftLeg:leftGreave'], state.combat.monsters[0].wounds.leftLeg, state.combat.playerInitiative.rank], [1, true, 'Queen']);
    check('reload preserves both unique card economies', await economy(), { player: true, referee: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await tab('tests');
    await screenshot('desktop-combat-results');
    await page.setViewportSize({ width: 390, height: 844 });
    await tab('tests');
    await screenshot('phone-active-combat');
    check('active mobile combat has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    await page.setViewportSize({ width: 1440, height: 900 });
    await seed('combat-magic');
    await tab('tests');
    await page.locator('.initiative-grid .card-row > div').nth(1).getByRole('button', { name: '선제권', exact: true }).click();
    await page.locator('.monster-card summary').filter({ hasText: '심판 손패' }).click();
    await page.locator('.monster-card .card-row > div').first().getByRole('button', { name: '선제권', exact: true }).click();
    for (const [kind, identity, resolve, charges, wounds] of [
      ['spell', 'minor:wands:7', 2, 2, 1],
      ['undo', 'minor:wands:3', 1, 2, 0],
      ['bound', 'minor:swords:Queen', 0, 1, 1],
    ]) {
      await tab('magic');
      const before = await stored();
      if (kind === 'spell') await page.locator('.record-list').getByRole('button', { name: '전투 손패로 시전 →', exact: true }).click();
      else if (kind === 'undo') await page.getByRole('button', { name: '비술 해제 · 결의 1점과 완드 판정', exact: true }).click();
      else await page.locator('.bound-list').getByRole('button', { name: '전투 손패로 시전 →', exact: true }).click();
      check(`${kind}: combat magic route opens combat`, await page.locator('button[data-tab="tests"]').getAttribute('aria-current'), 'page');
      state = await stored();
      check(`${kind}: preparing cast consumes no Resolve, charge or hand`, [state.character.resolve, state.character.boundMagic[0].charges, state.combat.playerHand.length], [before.character.resolve, before.character.boundMagic[0].charges, before.combat.playerHand.length]);
      const magicAction = panel('플레이어 행동과 대응');
      check(`${kind}: route prepares Cast a Spell`, await magicAction.locator('select').first().inputValue(), 'Cast a Spell');
      await magicAction.locator('select').nth(2).selectOption(identity);
      await magicAction.getByRole('button', { name: '행동 카드 사용', exact: true }).click();
      state = await stored();
      check(`${kind}: cast spends one hand card and the correct resources`, [state.character.resolve, state.refereeResolve, state.character.boundMagic[0].charges, state.combat.playerHand.length, state.combat.lastResult.baseWounds], [resolve, 0, charges, before.combat.playerHand.length - 1, wounds]);
      check(`${kind}: cast preserves both unique card economies`, await economy(), { player: true, referee: true });
    }
    await seed('combat-bound');
    await tab('tests');
    await page.locator('.initiative-grid .card-row > div').nth(1).getByRole('button', { name: '선제권', exact: true }).click();
    await page.locator('.monster-card summary').filter({ hasText: '심판 손패' }).click();
    await page.locator('.monster-card .card-row > div').first().getByRole('button', { name: '선제권', exact: true }).click();
    await tab('magic');
    await page.locator('.bound-list').getByRole('button', { name: '전투 손패로 시전 →', exact: true }).click();
    const boundAction = panel('플레이어 행동과 대응');
    await boundAction.locator('select').nth(2).selectOption('minor:wands:7');
    check('anyone may cast a bound object without the Magick Talent', await boundAction.getByRole('button', { name: '행동 카드 사용', exact: true }).isEnabled(), true);
    await boundAction.getByRole('button', { name: '행동 카드 사용', exact: true }).click();
    state = await stored();
    check('bound object without Talent still spends hand, charge and Resolve', [state.combat.playerHand.length, state.character.boundMagic[0].charges, state.character.resolve, state.refereeResolve], [2, 1, 2, 0]);

    await seed('rest');
    await tab('downtime');
    const rest = panel('휴식과 회복');
    check('healing requires sleep location and meal', await rest.getByRole('button', { name: /다음 날 아침/ }).isDisabled(), true);
    await rest.getByRole('checkbox', { name: '야영지·정착지 확인', exact: true }).check();
    await rest.getByRole('checkbox', { name: '식사 확인', exact: true }).check();
    await rest.getByRole('button', { name: /다음 날 아침/ }).click();
    state = await stored();
    check('one full night heals chosen Wound and advances day', [state.character.wounds.leftLeg, state.day], [false, 2]);
    const session = panel('시간과 회차');
    await session.getByRole('button', { name: '세션 시작 · 결의 +1', exact: true }).click();
    state = await stored();
    check('session start grants both Resolve exactly once', [state.sessionNumber, state.character.resolve, state.refereeResolve, await session.getByRole('button', { name: '세션 시작 · 결의 +1', exact: true }).isDisabled()], [1, 4, 1, true]);
    await session.getByRole('checkbox', { name: /목표/ }).check();
    await session.getByRole('checkbox', { name: /생명/ }).check();
    await session.getByRole('button', { name: '세션 정산 · XP 3', exact: true }).click();
    state = await stored();
    check('session settlement awards at most3XP and cannot repeat', [state.character.xp, state.sessionStarted, state.settledSession, await session.getByRole('button', { name: '세션 정산 · XP 3', exact: true }).isDisabled()], [3, false, 1, true]);
    await tab('play');
    await page.locator('.play-goal-list > li').first().getByRole('button').first().click();
    state = await stored();
    check('downtime Goal completion defers Resolve to next session', [state.character.goals[0].status, state.character.resolve, state.refereeResolve, state.pendingDowntimeGoalResolve], ['completed', 4, 1, 1]);
    await tab('downtime');
    await session.getByRole('button', { name: '세션 시작 · 결의 +1', exact: true }).click();
    state = await stored();
    check('next session awards start and pending Goal Resolve once', [state.sessionNumber, state.character.resolve, state.refereeResolve, state.pendingDowntimeGoalResolve, await session.getByRole('button', { name: '세션 시작 · 결의 +1', exact: true }).isDisabled()], [2, 6, 3, 0, true]);
    check('all user scenarios complete without browser exceptions', report.pageErrors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`PASS: ${report.completed.length} checks. Evidence: ${output}`);
  } finally {
    await browser.close();
  }
}
main().catch(error => {
  fs.writeFileSync(path.join(output, 'report-incomplete.json'), JSON.stringify({ ...report, error: error.stack }, null, 2));
  console.error(error);
  process.exitCode = 1;
});
