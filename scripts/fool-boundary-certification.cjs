/*
 * Focused rulebook boundary checks in an isolated browser context.
 * GLOAM_PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/fool-boundary-certification.cjs http://127.0.0.1:5173
 * Optional: GLOAM_BROWSER_EXECUTABLE, GLOAM_FOOL_REPORT.
 * Requires the Vite development server's source-module endpoints.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.GLOAM_PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:5173';
const reportPath = process.env.GLOAM_FOOL_REPORT || path.join(process.cwd(), '_bmad-output/validation/fool-boundary-report.json');
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.GLOAM_BROWSER_EXECUTABLE || (fs.existsSync(macChrome) ? macChrome : undefined);
const report = { url, completed: [], pageErrors: [] };
const check = (name, actual, expected) => {
  assert.deepEqual(actual, expected, name);
  report.completed.push(name);
};

async function main() {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.pageErrors.push(error.message));
  const stored = async () => {
    await page.waitForTimeout(240);
    return page.evaluate(() => JSON.parse(localStorage.getItem('gloam_companion_v2')).state);
  };
  const economy = () => page.evaluate(async () => {
    const { cardEconomyValid } = await import('/src/App.tsx');
    return cardEconomyValid(JSON.parse(localStorage.getItem('gloam_companion_v2')).state);
  });
  const seed = async mode => {
    await page.evaluate(async mode => {
      const { freshState, sanitizeV2 } = await import('/src/App.tsx');
      const state = freshState();
      Object.assign(state.character, {
        name: '경계 검증 인물', age: 25, vocation: 'Herald', stats: { cups: 4, wands: 2, swords: 3, coins: 1 },
        resolve: 3, talents: ['Disarming Presence'],
      });
      const take = (suit, rank) => {
        const index = state.playerDeck.findIndex(card => card.rank === rank && (suit ? card.suit === suit : !card.suit));
        if (index < 0) throw new Error(`Missing seeded card ${suit}:${rank}`);
        return { ...state.playerDeck.splice(index, 1)[0], reversed: false };
      };
      const oldMapCard = state.refereeDeck.shift();
      state.mapCells[0] = { ...state.mapCells[0], card: oldMapCard, liveCard: true, type: 'wilderness', label: '검증용 지난 지도' };
      state.refereeDiscard.push(state.refereeDeck.shift());
      if (mode.startsWith('oracle')) {
        state.lastOracleRank = 'number:5';
        state.playerDiscard.push(take('cups', '2'));
        state.playerDeck = [take(null, '0'), ...state.playerDeck];
        if (mode === 'oracle-active-combat') state.combat.active = true;
      } else if (mode === 'combat') {
        state.playerDeck = [take('cups', 'A'), take('coins', '2'), take('wands', '3'), take('swords', '4'), take(null, '0'), take('swords', '10'), take('cups', '9'), ...state.playerDeck];
        state.combat.active = true;
        state.combat.objective = '다리를 지켜 피난을 돕는다';
        state.combat.monsters = [{ id: 'giant-boundary', monsterId: 8, name: 'Giant', woundsTaken: 0, woundNotes: [], armorNotches: {}, hand: [], initiative: null, initiativeRevealed: false, notes: '' }];
      } else if (mode === 'reaction') {
        state.playerDeck = [take('cups', '7'), ...state.playerDeck];
        state.test = { ...state.test, purpose: '등장인물·괴수 반응 판정', suit: 'cups', stat: 4 };
      } else if (mode === 'pushed-reaction') {
        state.character.wounds.torso = true;
        state.playerDeck = [take('cups', '8'), take('coins', '4'), ...state.playerDeck];
        state.test = { ...state.test, purpose: '등장인물·괴수 반응 판정', suit: 'cups', stat: 4, modifier: -1, help: 1, opposedPenalty: 2 };
      }
      localStorage.setItem('gloam_companion_v2', JSON.stringify({ version: 2, state: sanitizeV2(state), undo: [] }));
    }, mode);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.play-test').waitFor();
  };
  const oracleNames = { 'yes-no': '예 / 아니오', amount: '양 · 규모', 'action-subject': '행동 + 주제' };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('.topbar').waitFor();
    for (const kind of Object.keys(oracleNames)) {
      await seed(`oracle-${kind}`);
      check(`${kind}: seeded unique card zones`, await economy(), { player: true, referee: true });
      await page.getByRole('button', { name: oracleNames[kind], exact: true }).click();
      let state = await stored();
      check(`${kind}: Fool breaks prior repeated-number sequence`, state.lastOracleRank, null);
      check(`${kind}: Fool recalls all cards to both decks`, [state.playerDeck.length, state.refereeDeck.length, state.playerDiscard.length, state.refereeDiscard.length], [57, 21, 0, 0]);
      check(`${kind}: Fool recalls live map card but preserves its record`, [state.mapCells[0].liveCard, state.mapCells[0].label], [false, '검증용 지난 지도']);
      check(`${kind}: records explicit undefined-table boundary instead of a fabricated answer`, [state.oracles[0].kind, state.oracles[0].cards[0].rank, state.oracles[0].triggeredEvent, /이 징조 표에는 결과가 없습니다/.test(state.oracles[0].result)], [kind, '0', false, true]);
      check(`${kind}: no Event is falsely triggered by Fool`, state.events.length, 0);
      check(`${kind}: recall preserves both unique card economies`, await economy(), { player: true, referee: true });
      await page.evaluate(() => {
        const bundle = JSON.parse(localStorage.getItem('gloam_companion_v2'));
        const index = bundle.state.playerDeck.findIndex(card => card.suit === 'cups' && card.rank === '5');
        const [card] = bundle.state.playerDeck.splice(index, 1);
        bundle.state.playerDeck.unshift(card);
        localStorage.setItem('gloam_companion_v2', JSON.stringify(bundle));
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.play-test').waitFor();
      await page.getByRole('button', { name: '양 · 규모', exact: true }).click();
      state = await stored();
      check(`${kind}: 5 after intervening Fool starts a new sequence`, [state.lastOracleRank, state.oracles[0].triggeredEvent, state.events.length], ['number:5', false, 0]);
      check(`${kind}: subsequent oracle preserves unique card economies`, await economy(), { player: true, referee: true });
    }

    await seed('combat');
    await page.locator('button[data-tab="tests"]').click();
    await page.getByRole('button', { name: '플레이어 4장까지 · 괴수마다 3장', exact: true }).click();
    let state = await stored();
    check('combat: drawn NPC Fool marks deferred recall', [state.combat.playerHand.length, state.combat.monsters[0].hand.length, state.combat.foolPending], [4, 3, true]);
    await page.locator('.monster-card').getByText('심판 손패 · 3장', { exact: true }).click();
    const npcFool = page.locator('.monster-card .card-row > div').filter({ has: page.getByRole('img', { name: /광대/ }) });
    check('combat: NPC Fool cannot be used as an ordinary Morale Test card', await npcFool.getByRole('button', { name: '사기', exact: true }).isDisabled(), true);
    check('combat: NPC Fool cannot be used as an ordinary Attack card', await npcFool.getByRole('button', { name: '공격', exact: true }).isDisabled(), true);
    check('combat: NPC Fool may be selected for Initiative', await npcFool.getByRole('button', { name: '선제권', exact: true }).isEnabled(), true);
    await npcFool.getByRole('button', { name: '선제권', exact: true }).click();
    state = await stored();
    check('combat: Fool Initiative is zero and remains hidden initially', [state.combat.monsters[0].initiative.rank, state.combat.monsters[0].initiativeRevealed, state.combat.monsters[0].hand.length], ['0', false, 2]);
    const playerHand = page.locator('.initiative-grid .card-row > div');
    await playerHand.first().getByRole('button', { name: '선제권', exact: true }).click();
    await page.locator('.monster-card .card-row > div').first().getByRole('button', { name: '공격', exact: true }).click();
    state = await stored();
    check('combat: ordinary NPC hand card still evaluates Attack normally', [state.combat.lastResult.total, state.combat.lastResult.target, state.combat.lastResult.status], [14, 1, 'great-success']);
    check('combat: Fool is not recalled until round end', [state.playerDeck.length, state.refereeDeck.length, state.combat.foolPending, state.mapCells[0].liveCard], [50, 19, true, true]);
    await page.getByRole('button', { name: '라운드 끝내기', exact: true }).click();
    state = await stored();
    check('combat: round end recalls all cards and clears both hands/Initiatives', [state.playerDeck.length, state.refereeDeck.length, state.playerDiscard.length, state.refereeDiscard.length, state.combat.playerHand.length, state.combat.playerInitiative, state.combat.monsters[0].hand.length, state.combat.monsters[0].initiative], [57, 21, 0, 0, 0, null, 0, null]);
    check('combat: recall starts the next round and advances ten seconds', [state.combat.round, state.combat.foolPending, state.rounds, state.mapCells[0].liveCard], [2, false, 1, false]);
    check('combat: round-end recall preserves both unique card economies', await economy(), { player: true, referee: true });

    await seed('combat');
    await page.locator('button[data-tab="tests"]').click();
    await page.getByRole('button', { name: '플레이어 4장까지 · 괴수마다 3장', exact: true }).click();
    await page.locator('.monster-card').getByText('심판 손패 · 3장', { exact: true }).click();
    await page.locator('.monster-card .card-row > div').last().getByRole('button', { name: '선제권', exact: true }).click();
    await page.locator('.initiative-grid .card-row > div').first().getByRole('button', { name: '선제권', exact: true }).click();
    await page.locator('.initiative-grid .card-row > div').nth(1).getByRole('button', { name: '행동 선택', exact: true }).click();
    await page.getByRole('button', { name: '행동 카드 사용', exact: true }).click();
    state = await stored();
    check('combat: PC action initially fails before receiving another actor’s Fool', [state.combat.lastResult.total, state.combat.lastResult.target, state.combat.lastResult.status], [6, 9, 'failure']);
    await page.locator('.monster-card .card-row > div').filter({ has: page.getByRole('img', { name: /광대/ }) }).getByRole('button', { name: '마지막 판정 +3', exact: true }).click();
    state = await stored();
    check('combat: NPC Fool may grant +3 to a PC action and update damage', [state.combat.lastResult.total, state.combat.lastResult.status, state.combat.lastResult.rawWounds, state.character.resolve, state.refereeResolve], [9, 'success', 1, 3, 0]);
    check('combat: Fool bonus moves the card from NPC hand to shared discard', [state.combat.monsters[0].hand.some(card => card.rank === '0'), state.playerDiscard.some(card => card.rank === '0'), state.combat.foolPending], [false, true, true]);
    check('combat: cross-actor Fool bonus preserves both unique card economies', await economy(), { player: true, referee: true });

    await seed('oracle-active-combat');
    await page.getByRole('button', { name: '양 · 규모', exact: true }).click();
    state = await stored();
    check('combat oracle: drawn Fool defers recall while breaking the oracle streak', [state.playerDeck.length, state.refereeDeck.length, state.lastOracleRank, state.combat.foolPending, state.mapCells[0].liveCard], [55, 19, null, true, true]);
    check('combat oracle: boundary text correctly announces round-end recall', [/라운드 끝/.test(state.oracles[0].result), /회수해 섞었습니다/.test(state.oracles[0].result), state.oracles[0].triggeredEvent, state.events.length], [true, false, false, 0]);
    await page.locator('button[data-tab="tests"]').click();
    await page.getByRole('button', { name: '라운드 끝내기', exact: true }).click();
    state = await stored();
    check('combat oracle: actual recall occurs at round end', [state.playerDeck.length, state.refereeDeck.length, state.combat.foolPending], [57, 21, false]);
    check('combat oracle: deferred Fool and round-end recall preserve both unique card economies', await economy(), { player: true, referee: true });

    await seed('reaction');
    await page.locator('.play-draw-line button').click();
    state = await stored();
    check('Reaction: first matching card can initially fail', [state.test.result.total, state.test.result.status], [11, 'failure']);
    await page.getByRole('button', { name: '반응 +3 · 결의 1', exact: true }).click();
    state = await stored();
    check('Reaction: post-result Disarming Presence reevaluates into Great Success', [state.test.result.total, state.test.result.status, state.test.modifier, state.character.resolve, state.refereeResolve], [14, 'great-success', 3, 2, 0]);
    check('Reaction: post-result bonus consumes no new card', [state.test.firstCard.rank, state.test.pushedCard, state.playerDiscard.length], ['7', null, 1]);
    check('Reaction: Disarming Presence cannot be spent twice on the same Test', await page.getByRole('button', { name: '반응 +3 적용됨', exact: true }).isDisabled(), true);
    check('Reaction: talent bonus preserves both unique card economies', await economy(), { player: true, referee: true });

    await seed('pushed-reaction');
    await page.locator('.play-draw-line button').click();
    await page.getByRole('button', { name: '밀어붙이기 · 한 장 더', exact: true }).click();
    state = await stored();
    check('Pushed Reaction: all penalties/helper/first and pushed cards are included', [state.test.result.total, state.test.result.status, state.character.resolve, state.refereeResolve], [11, 'great-failure', 4, 1]);
    await page.getByRole('button', { name: '반응 +3 · 결의 1', exact: true }).click();
    state = await stored();
    check('Pushed Reaction: late talent preserves Push and never fabricates Great Success', [state.test.result.total, state.test.result.status, state.test.result.pushed, state.test.modifier, state.test.help, state.test.opposedPenalty, state.character.resolve, state.refereeResolve], [14, 'success', true, 2, 1, 2, 3, 1]);
    check('Pushed Reaction: late talent preserves both cards and card economies', [state.test.firstCard.rank, state.test.pushedCard.rank, await economy()], ['8', '4', { player: true, referee: true }]);
    check('all boundary scenarios complete without browser exceptions', report.pageErrors, []);
    report.status = 'passed';
  } finally {
    await browser.close();
  }
}

main().then(() => {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`PASS: ${report.completed.length} focused boundary checks. Evidence: ${reportPath}`);
}).catch(error => {
  report.status = 'failed';
  report.error = error.stack;
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(error);
  process.exitCode = 1;
});
