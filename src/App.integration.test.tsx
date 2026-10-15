// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { cardEconomyValid, freshState, type GameState } from "./App";
import { cardId } from "./rules";

// These exercise production React handlers in an in-memory DOM, never a browser profile.
let root: Root | undefined;
const storageKey = "gloam_companion_v2";
const initial = () => {
  const state = freshState();
  state.character.name = "검증 모험가"; state.character.age = 24;
  state.character.vocation = "Mystic"; state.character.talents = ["Magick"];
  state.character.stats = { cups: 2, wands: 4, swords: 3, coins: 1 };
  const first = state.playerDeck.find(card => card.rank === "King" && card.suit === "cups")!;
  state.playerDeck = [first, ...state.playerDeck.filter(card => cardId(card) !== cardId(first))];
  return state;
};
const mount = async (state?: GameState) => {
  if (root) await act(async () => root!.unmount());
  if (state) localStorage.setItem(storageKey, JSON.stringify({ version: 2, state, undo: [] }));
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById("root")!);
  await act(async () => root!.render(<App />));
};
const click = async (element: HTMLElement) => { await act(async () => element.click()); };
const nav = async (tab: string) => click(document.querySelector<HTMLButtonElement>(`button[data-tab="${tab}"]`)!);
const button = (text: string, scope: ParentNode = document) => {
  const buttons = [...scope.querySelectorAll<HTMLButtonElement>("button")];
  const found = buttons.find(el => el.textContent?.trim() === text) ?? buttons.find(el => el.textContent?.includes(text));
  if (!found) throw new Error(`Button missing: ${text}`);
  return found;
};
const field = (text: string) => {
  const label = [...document.querySelectorAll("label")].find(el => el.textContent?.trim().startsWith(text));
  const input = label?.querySelector<HTMLInputElement | HTMLSelectElement>("input,select");
  if (!input) throw new Error(`Field missing: ${text}`);
  return input;
};
const change = async (text: string, value: string) => {
  const input = field(text);
  const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
};
const saved = async (): Promise<GameState> => {
  await act(async () => vi.advanceTimersByTime(200));
  return JSON.parse(localStorage.getItem(storageKey)!).state;
};

beforeEach(() => {
  const entries = new Map<string, string>();
  // Node 26 also defines localStorage; explicitly isolate the DOM test's storage.
  const storage: Storage = {
    get length() { return entries.size; },
    key: index => [...entries.keys()][index] ?? null,
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, String(value)); },
    removeItem: key => { entries.delete(key); },
    clear: () => entries.clear(),
  };
  vi.stubGlobal("localStorage", storage);
  vi.useFakeTimers(); localStorage.clear();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined; localStorage.clear(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals();
});

describe("rulebook procedures through the actual App handlers", () => {
  it("draws one initial word of each kind, blocks rapid repeat clicks, and keeps that boundary after reload", async () => {
    await mount(initial()); await nav("magic");
    const minor = button("첫 준비 · 소 아르카나");
    await act(async () => { minor.click(); minor.click(); });
    expect(minor.disabled).toBe(true);
    const major = button("첫 준비 · 대 아르카나");
    await act(async () => { major.click(); major.click(); });
    let state = await saved();
    expect(state.character.knownMinorWords).toHaveLength(1);
    expect(state.character.knownMajorWords).toHaveLength(1);
    expect(state.playerDeck).toHaveLength(56);
    expect(state.refereeDeck).toHaveLength(20);
    expect(cardEconomyValid(state)).toEqual({ player: true, referee: true });
    await mount(); await nav("magic");
    expect(button("첫 준비 · 소 아르카나").disabled).toBe(true);
    expect(button("첫 준비 · 대 아르카나").disabled).toBe(true);
    state = await saved(); expect(state.character.knownMinorWords).toHaveLength(1);
  });

  it("brews from the submitted recipe, awards one dose, and cannot award it again after editing or reload", async () => {
    await mount(initial()); await nav("magic");
    await change("괴수의 일부·정수", "트롤의 심장"); await change("원하는 조제물", "회복약");
    for (const label of ["일부·정수 확인", "끓일 솥 확인", "실용 지식 확인", "병·그릇 확인"]) await click(field(label));
    await click(button("완드 판정 마련 · 1경점"));
    expect((await saved()).watch).toBe(2);
    await click(button("판정 카드 뽑기"));
    expect((await saved()).test.result?.success).toBe(true);
    await nav("magic"); await change("원하는 조제물", "전혀 다른 약");
    await click(button("성공 뒤 1회분 기록"));
    let state = await saved();
    expect(state.character.inventory).toEqual([expect.objectContaining({ name: "회복약 · 1회분", uses: 1 })]);
    expect(state.test.alchemy?.doseRecorded).toBe(true);
    expect(button("성공 뒤 1회분 기록").disabled).toBe(true);
    await mount(); await nav("magic");
    expect(button("성공 뒤 1회분 기록").disabled).toBe(true);
    state = await saved(); expect(state.character.inventory).toHaveLength(1);
  });

  it("does not offer armor for another body part and rejects insufficient Swords", async () => {
    const state = initial(); state.character.stats.swords = 1;
    await mount(state); await nav("tests");
    let armor = field("플레이어 갑옷") as HTMLSelectElement;
    expect([...armor.options].some(option => option.value === "helmet")).toBe(false);
    expect([...armor.options].find(option => option.value === "cuirass")?.disabled).toBe(true);
    await change("플레이어 갑옷", "gambeson"); await change("들어온 부상", "2");
    await click(button("피해 적용"));
    expect((await saved()).character).toMatchObject({ wounds: { torso: true }, armorNotches: { gambeson: 1 } });
    await change("신체 부위", "head"); armor = field("플레이어 갑옷") as HTMLSelectElement;
    expect(armor.value).toBe("none");
    expect([...armor.options].some(option => option.value === "gambeson")).toBe(false);
    await change("플레이어 갑옷", "helmet"); await click(button("피해 적용"));
    expect((await saved()).character).toMatchObject({ wounds: { head: false }, armorNotches: { helmet: 0 } });
  });

  it("updates the primary starting Talent while keeping the explicitly recorded solo bonus", async () => {
    const state = initial(); state.character.talents.push("Nimble"); state.character.soloTalent = "Nimble";
    await mount(state); await nav("character");
    await change("Cups", "4"); await change("Wands", "2");
    await click(button("천직 · 시작 재능 설정"));
    const next = await saved();
    expect(next.character.vocation).toBe("Herald");
    expect(next.character.talents).toEqual(["Nimble", "Disarming Presence"]);
  });

  it("can discard the Fool to move and still recalls both decks at that round's end", async () => {
    const state = initial(); const fool = state.playerDeck.find(card => card.rank === "0")!;
    state.playerDeck = state.playerDeck.filter(card => card.rank !== "0");
    state.combat.active = true; state.combat.foolPending = true; state.combat.playerHand = [fool];
    await mount(state); await nav("tests"); await change("행동", "Move");
    await change("카드", cardId(fool)); await change("행동", "Attack");
    expect(field("카드").value).toBe(""); expect(button("행동 카드 사용").disabled).toBe(true);
    await change("행동", "Move"); await change("카드", cardId(fool)); await click(button("행동 카드 사용"));
    let next = await saved();
    expect(next.combat.lastResult).toMatchObject({ action: "Move", total: 1 });
    expect(next.playerDiscard.some(card => card.rank === "0")).toBe(true);
    expect(next.combat.playerHand).toHaveLength(0);
    expect(next.combat.foolPending).toBe(true);
    await click(button("라운드 끝내기")); next = await saved();
    expect(next.playerDeck).toHaveLength(57); expect(next.refereeDeck).toHaveLength(21);
    expect(cardEconomyValid(next)).toEqual({ player: true, referee: true });
  });

  it("charges the printed XP and training days, blocks foreign starting Talents, and caps stats at six", async () => {
    const state = initial(); state.character.vocation = "Herald"; state.character.talents = ["Disarming Presence"];
    state.character.xp = 30; state.character.stats.coins = 6;
    await mount(state); await nav("character"); await click(button("재능·성장"));
    const talent = (name: string) => [...document.querySelectorAll<HTMLElement>(".talent")].find(el => el.querySelector("strong")?.textContent?.trim().endsWith(name))!;
    expect(button("다른 천직의 시작", talent("Magick")).disabled).toBe(true);
    await click(button("배우기 · 경험치 5", talent("Academic")));
    expect((await saved()).character.xp).toBe(25); expect((await saved()).day).toBe(6);
    await click(button("배우기 · 경험치 10", talent("Bind Magick")));
    expect((await saved()).character.xp).toBe(15); expect((await saved()).day).toBe(16);
    await click(button("Swords 올리기"));
    const next = await saved();
    expect(next.character.xp).toBe(5); expect(next.day).toBe(26); expect(next.character.stats.swords).toBe(4);
    expect(button("Coins 올리기").disabled).toBe(true);
  });

  it("applies Resolve after seeing a failed Test, reaches a matching-suit Great Success, and does not pay the Referee on spending", async () => {
    const state = initial(); state.character.resolve = 3; state.refereeResolve = 9;
    const card = state.playerDeck.find(item => item.rank === "10" && item.suit === "cups")!;
    state.playerDeck = [card, ...state.playerDeck.filter(item => cardId(item) !== cardId(card))];
    await mount(state); await click(button("판정 카드 뽑기"));
    expect((await saved()).test.result).toMatchObject({ total: 12, status: "failure" });
    await click(button("결의 1점 · 합계 +1")); await click(button("결의 1점 · 합계 +1"));
    const next = await saved();
    expect(next.test.result).toMatchObject({ total: 14, status: "great-success" });
    expect(next.character.resolve).toBe(1); expect(next.refereeResolve).toBe(9);
    expect(next.playerDeck).toHaveLength(56);
  });

  it("pays a downtime Goal at the next session start and settles each session once", async () => {
    const state = initial(); state.character.resolve = 4; state.refereeResolve = 5;
    state.character.goals = [{ id: "goal", text: "다리를 다시 잇는다", status: "active", note: "" }];
    await mount(state); await nav("downtime"); await click(button("세션 시작 · 결의 +1"));
    expect((await saved()).character.resolve).toBe(5);
    expect(button("세션 시작 · 결의 +1").disabled).toBe(true);
    await click(button("세션 정산 · XP 1")); expect((await saved()).character.xp).toBe(1);
    expect(button("세션 정산 · XP 1").disabled).toBe(true);
    await nav("character"); await click(button("3 목표·본능")); await click(button("완수"));
    let next = await saved(); expect(next.character.resolve).toBe(5); expect(next.pendingDowntimeGoalResolve).toBe(1);
    await nav("downtime"); await click(button("세션 시작 · 결의 +1")); next = await saved();
    expect(next.character.resolve).toBe(7); expect(next.refereeResolve).toBe(8);
    expect(next.pendingDowntimeGoalResolve).toBe(0); expect(next.sessionNumber).toBe(2);
  });

  it("can place all 21 Referee cards on an expanded map and keeps those areas after reload", async () => {
    await mount(initial()); await nav("map");
    await click(button("구역 4개 추가")); await click(button("구역 4개 추가"));
    for (let i = 0; i < 21; i += 1) await click(button("심판 카드 뽑기"));
    let state = await saved();
    expect(state.mapCells).toHaveLength(24); expect(state.mapCells.filter(cell => cell.liveCard)).toHaveLength(21);
    expect(state.refereeDeck).toHaveLength(0); expect(cardEconomyValid(state).referee).toBe(true);
    await mount(); state = await saved();
    expect(state.mapCells).toHaveLength(24); expect(state.mapCells.filter(cell => cell.liveCard)).toHaveLength(21);
    expect(cardEconomyValid(state)).toEqual({ player: true, referee: true });
  });
});
