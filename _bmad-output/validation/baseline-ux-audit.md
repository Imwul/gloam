# Independent baseline UX audit — Gloam, 2026-10-08

Scope: full Gloam1.02.pdf text (60 pages), all combat example pages, character sheet; independently read before current source inspection and without prior repository audits. Original application files not changed. Frozen original source at /tmp/gloam-baseline, baseline server http://127.0.0.1:5188. Browser: bundled Playwright + system Google Chrome, desktop1440×900 and mobile390×844. Screenshots: /tmp/gloam-review/baseline-*.png. Fonts and public assets were copied/linked separately after cloud hydration; initial captures used fallback fonts. Scroll measurements below from baseline-browser-output.txt. A repeated run with resolved fonts confirms layout and yields same panel coordinates.

## Rulebook-derived play loop

1. Players pursue three actionable Goals and declare fictional actions using Stats, equipment, Instincts, Talents, known words and relationships. Good plan/time/equipment means no Test needed.
2. If uncertain: select relevant Stat, declare one helper before drawing, draw Player card and add Stat and modifiers against14. Matching-suit first-draw success is Great Success. Failure may be accepted or Pushed; failed Push grants Resolve. Resolve can improve total after seeing it. Whenever a player gains Resolve, Referee gains Resolve too (p34).
3. During exploration: travel/watch passage, events on noise/new location/delay/drama, reactions before combat, oracles to resolve questions, optional card map generation. Event/Oracle controls are frequently used; map-generation configuration is less frequent.
4. Combat: declare concrete objective; cards retained between rounds and topped up to4 per PC,3 per monster/NPC; each chooses hidden Initiative, acts low-to-high and reveals on turn. Initiative is defensive target. Spend cards for actions/responses, never Push; apply opposing Stat only on opposed actions; spend Resolve after results; then choose body part, apply armor and notches, update lasting Wounds. Great Success adds an extra Attack Wound. End round discard unwanted cards. Fool recalls all cards and both decks at round end. Combat example repeatedly uses player Resolve after seeing failed attacks.
5. At safe rest: full night+meal heals one chosen Wound. Session start grants Resolve; session end awards1–3XP for participation, one Goal fulfilled, life-threatening situation. Goals/Instincts/relationships drive next-session world reactions. Downtime training takes one day/XP spent; hired help requires weekly Coins tests.

## Measured hierarchy and access

| Essential area | Desktop top Y | Mobile top Y | Implication |
|---|---:|---:|---|
| First main panel |439|589|Navigation+masthead use49%/70% of the initial viewport before any play tool|
| Combat flow on Tests&Combat |983|1716|At least one/roughly two viewport scrolls before round controls|
| Combat actions |1485|2225|Actions disconnected from hand/initiative|
| Damage application |1485|2987|Result-to-damage requires moving elsewhere and re-entry|
| Goal/Instinct block on Character |1193|2269|Narrative engine not visible while playing|
| Oracle block on Magick&Oracles |1229|2793|Solo/general narrative tool placed after two spell workflows and alchemy|
| Event draw on Maps&Event Deck |1948|4613|Sixteen map tiles must be passed to use repeated event procedure|
| Bestiary on Bestiary&Downtime |1640|2663|Encounter setup behind time/rest/carousing/hireling panels|
| Complete Character page |5173|9468|All four vocations/24Talents displayed alongside character setup and live sheet|

No horizontal document overflow at390px was observed. This does not establish usability: the mobile app is a long stacked form, including16 mapcells and21 monsters.

## Findings by priority

P0 gameplay fidelity: no player Resolve button for the most recent combat Test. Ordinary Test's Resolve button cannot affect combat results. Official combat example's Lizzie/Anna last-minute+1 attacks cannot be represented faithfully. GM Resolve gain/spend trigger reversed in current code. Nimble Talent spends/logs but cannot swap an already-selected Initiative. Sally Forth only logs activation without providing extra action when cards are gone. Monster Wounds enter note strings and an aggregate counter, but their displayed Speed stays the printed base value; no leg-speed or torso-test effect updates. These gaps require implementation or explicit local mechanical controls, not more narrative warnings.

P1 navigation: encounter combat and general tests share one long page; bestiary is grouped with downtime; events grouped under map; oracles grouped after spells. These are book/table categories rather than live-play tasks. 'startTest' state presets from purchase/magic/reaction/hireling buttons do not navigate to Tests, creating a hidden state change and an extra manual tab hop. 'Add to combat' from Bestiary similarly does not open combat. First screen opens Character creation every time, regardless of established character.

P1 action friction: attack and damage are separate forms. After resolving the action, damage target remains Player and incoming Wounds remains its own default, requiring target re-selection, incoming Wounds re-entry, hit-part selection and armor selection. Since ordinary attacks let defender choose location, preserve that choice but hand off the known target/damage. Combat cards are shown in one panel and then re-chosen from a select in another. Entire armor catalogue is always visible, including armor not owned.

P1 access to rules: contextual source links exist but all source/summary display is behind a passphrase gate. A table-side quick reference to Tests, Combat, Wounds, Resolve, Rest, armor, time scales and actions should be readable immediately, with original-page links for deeper verification. Current dynamic Combat flow heading has no context source mapping (mapping uses exact fixed panel titles). Legal original-source privacy can remain intact without gating operational paraphrases.

P2 excessive hierarchy: top-level integrity counts, Undo count, export/import/new/reset precede all gameplay. Masthead and six long English chapter labels crowd mobile. Korean interface alternates English book terminology, Korean descriptions and mixed warnings. Repeated '장부는 ... 하지 않습니다' developer/engine-boundary prose dominates small panel space, while the player needs what happens next, what resource changes and the consequence preview. Some disabled labels (cross-vocation starting Talents) repeat dozens of times instead of hiding unrelated catalogue content until requested.

P2 duplicates: Player Resolve count on Character but GM count only deep in Bestiary; stats editable both Character and ordinary Test; Monster selectable in Combat and listed exhaustively in Downtime; same export/integrity information in masthead and Archive. Inventory/magic/relationships/catalogues should be on demand under live summaries.

P2 missing procedure guidance: Character creation order is Lifepath→Stats→Vocation→Goals/Instincts→Friend/Foe→five free items, but UI starts with Name/age/manual Vocation before Lifepath and offers no next-step progression. Stats4 and Vocation can contradict until manual 'derive vocation' click. Sessions allow repeatedXP reason button taps without a once-per-session checklist.

## Baseline operation counts (discrete controls; scroll and text focus excluded)

- Ordinary test from initial Character: Tests tab→draw =2 controls, plus optional suit/modifiers. Required button starts below first fold.
- Event from initial Character: Maps tab→event draw =2 controls, but event panelY4613 mobile.
- Oracle from initial Character: Magick tab→oracle kind draw =2 controls, but panelY2793 mobile.
- Prepare a hireling test from initial Character: Downtime tab→preset→Tests tab→draw =4 controls. 'preset' should open the ready test.
- Combat called-shot+damage from initial Character with fresh enemy: Tests tab, monster selection, add, deal, player Initiative, expand GM hand, GM Initiative, two reveal buttons, action target, action card, called-shot, weapon Wounds, resolve action, damage target, hit part, incoming Wounds, armor, apply =19 discrete controls. After an already-running round, action+damage still needs up to10 controls and multiple scroll moves. One called-shot attack cannot be upgraded with player Resolve in current UI.

## Design requirements to validate

Default live-play view should expose resources, active Goals/Instincts, uncertain action Test, immediate failure choices, event/reaction/oracle access and quick rule search. Combat should be a dedicated workspace with persistent objective/phase, hand→action→result→damage progression, all participants' states, player+GM Resolve, response/initiative swap mechanics. Character setup/catalogues/archival operations should be secondary. Mobile needs direct subview access and compact summary rather than permanent catalogue forms. Operational copy should show supported steps/consequences instead of implementation boundaries.
