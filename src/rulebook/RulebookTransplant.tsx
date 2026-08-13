import { useEffect, useMemo, useRef, useState } from "react";
import {
  RULEBOOK_GROUPS,
  RULEBOOK_SECTIONS,
  findRulebookSection,
  type RulebookSection,
  type RuntimeTab,
} from "./referenceIndex";

interface SourcePage {
  page: number;
  text: string;
}

interface SourceDocument {
  id: "gloam-1.02" | "combat-example" | "character-sheet";
  title: string;
  pages: SourcePage[];
}

interface SourceBundle {
  edition: string;
  generatedFrom: string[];
  documents: SourceDocument[];
}

interface EncryptedSourceEnvelope {
  version: 1;
  algorithm: "AES-256-GCM";
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  iv: string;
  payload: string;
}

interface ReferenceState {
  bookmarks: string[];
  notes: Record<string, string>;
  recent: string[];
}

interface SearchResult {
  key: string;
  label: string;
  detail: string;
  section?: RulebookSection;
  documentId?: SourceDocument["id"];
  page?: number;
}

type ViewMode = "index" | "tables" | "bookmarks" | "recent";

const REFERENCE_STORAGE_KEY = "gloam-rulebook-reference-v1";
let cachedSourceBundle: SourceBundle | null = null;
let cachedEncryptedSource: EncryptedSourceEnvelope | null = null;
let encryptedSourceRequest: Promise<EncryptedSourceEnvelope> | null = null;

const loadEncryptedSource = () => {
  if (cachedEncryptedSource) return Promise.resolve(cachedEncryptedSource);
  if (!encryptedSourceRequest) {
    encryptedSourceRequest = fetch(`${import.meta.env.BASE_URL}rulebook/gloam-source.enc.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<EncryptedSourceEnvelope>;
      })
      .then((envelope) => {
        if (envelope.version !== 1 || envelope.algorithm !== "AES-256-GCM" || envelope.kdf?.name !== "PBKDF2") {
          throw new Error("Unsupported encrypted source format");
        }
        cachedEncryptedSource = envelope;
        return envelope;
      })
      .catch((error) => {
        encryptedSourceRequest = null;
        throw error;
      });
  }
  return encryptedSourceRequest;
};

const decodeBase64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

const decryptSourceBundle = async (envelope: EncryptedSourceEnvelope, passphrase: string) => {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey({
    name: "PBKDF2",
    hash: envelope.kdf.hash,
    salt: decodeBase64(envelope.kdf.salt),
    iterations: envelope.kdf.iterations,
  }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({
    name: "AES-GCM",
    iv: decodeBase64(envelope.iv),
    tagLength: 128,
  }, key, decodeBase64(envelope.payload));
  const bundle = JSON.parse(new TextDecoder().decode(plaintext)) as SourceBundle;
  if (!Array.isArray(bundle.documents) || bundle.documents.length !== 3) throw new Error("Invalid source bundle");
  return bundle;
};

const emptyReferenceState = (): ReferenceState => ({ bookmarks: [], notes: {}, recent: [] });

const loadReferenceState = (): ReferenceState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REFERENCE_STORAGE_KEY) || "null") as Partial<ReferenceState> | null;
    if (!parsed) return emptyReferenceState();
    return {
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks.filter((item): item is string => typeof item === "string") : [],
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      recent: Array.isArray(parsed.recent) ? parsed.recent.filter((item): item is string => typeof item === "string").slice(0, 12) : [],
    };
  } catch {
    return emptyReferenceState();
  }
};

const documentLabel: Record<SourceDocument["id"], string> = {
  "gloam-1.02": "Gloam v1.02",
  "combat-example": "Combat Example",
  "character-sheet": "Character Sheet",
};

const runtimeLabel: Record<RuntimeTab, string> = {
  character: "Create Your Character",
  tests: "Tests & Combat",
  magic: "Magick & Oracles",
  map: "Generating Maps & Event Deck",
  downtime: "Bestiary & Downtime",
  log: "Chronicle & Archive",
};

const pageKey = (documentId: SourceDocument["id"], page: number) => `page:${documentId}:${page}`;
const sectionKey = (id: string) => `section:${id}`;
const tableKey = (id: string) => `table:${id}`;

const excerpt = (text: string, query: string) => {
  const compact = text.replace(/\s+/g, " ").trim();
  const at = compact.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (at < 0) return compact.slice(0, 190);
  return compact.slice(Math.max(0, at - 70), Math.min(compact.length, at + query.length + 120));
};

export default function RulebookTransplant({
  initialSectionId,
  currentTab,
  onClose,
  onOpenRuntime,
}: {
  initialSectionId?: string;
  currentTab: RuntimeTab;
  onClose: () => void;
  onOpenRuntime: (tab: RuntimeTab) => void;
}) {
  const [source, setSource] = useState<SourceBundle | null>(cachedSourceBundle);
  const [encryptedSource, setEncryptedSource] = useState<EncryptedSourceEnvelope | null>(cachedEncryptedSource);
  const [passphrase, setPassphrase] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [referenceState, setReferenceState] = useState<ReferenceState>(loadReferenceState);
  const [mode, setMode] = useState<ViewMode>("index");
  const [query, setQuery] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId || "welcome");
  const [selectedPage, setSelectedPage] = useState<{ documentId: SourceDocument["id"]; page: number } | null>(null);
  const [pageInput, setPageInput] = useState("");
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cachedSourceBundle) return;
      try {
        const envelope = await loadEncryptedSource();
        if (!cancelled) setEncryptedSource(envelope);
      } catch {
        if (!cancelled) setSourceError("암호화된 원문 자료를 불러오지 못했습니다. 연결을 확인한 뒤 다시 열어 주세요.");
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    localStorage.setItem(REFERENCE_STORAGE_KEY, JSON.stringify(referenceState));
  }, [referenceState]);

  useEffect(() => {
    const handleDialogKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKeyboard);
    return () => window.removeEventListener("keydown", handleDialogKeyboard);
  }, [onClose]);

  const unlockSource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!encryptedSource || !passphrase || unlocking) return;
    setUnlocking(true);
    setSourceError("");
    try {
      const bundle = await decryptSourceBundle(encryptedSource, passphrase);
      cachedSourceBundle = bundle;
      setSource(bundle);
      setPassphrase("");
    } catch {
      setSourceError("암호가 맞지 않거나 원문 자료가 손상되었습니다.");
    } finally {
      setUnlocking(false);
    }
  };

  const documents = useMemo(() => new Map(source?.documents.map((item) => [item.id, item]) || []), [source]);
  const selectedSection = findRulebookSection(selectedSectionId) || RULEBOOK_SECTIONS[0];
  const sourcePages = useMemo(() => {
    if (!source || selectedPage) return [];
    const document = documents.get(selectedSection.documentId);
    return document?.pages.filter((page) => page.page >= selectedSection.pages[0] && page.page <= selectedSection.pages[1]) || [];
  }, [documents, selectedPage, selectedSection, source]);
  const directPage = selectedPage ? documents.get(selectedPage.documentId)?.pages.find((item) => item.page === selectedPage.page) : undefined;
  const directPageHasTable = selectedPage ? RULEBOOK_SECTIONS.some((item) => (
    item.documentId === selectedPage.documentId
    && item.kinds.includes("TABLE")
    && selectedPage.page >= item.pages[0]
    && selectedPage.page <= item.pages[1]
  )) : false;

  const currentReferences = useMemo(
    () => RULEBOOK_SECTIONS.filter((item) => item.runtimeTab === currentTab),
    [currentTab],
  );

  const coverage = useMemo(() => ({
    sections: RULEBOOK_SECTIONS.length,
    rules: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("RULE")).length,
    tables: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("TABLE")).length,
    procedures: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("PROCEDURE")).length,
    examples: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("EXAMPLE")).length,
    refereeNotes: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("REFEREE NOTES")).length,
    references: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("REFERENCE") || item.kinds.includes("CONTEXT")).length,
    crossLinks: RULEBOOK_SECTIONS.reduce((total, item) => total + item.related.length, 0),
  }), []);

  const searchResults = useMemo<SearchResult[]>(() => {
    const needle = query.trim();
    if (!needle || !source) return [];
    const pageMatch = needle.match(/^p(?:age)?\.?\s*(\d+)$/i);
    if (pageMatch) {
      const page = Number(pageMatch[1]);
      const results: SearchResult[] = [];
      const sourcePage = documents.get("gloam-1.02")?.pages.find((item) => item.page === page);
      if (sourcePage) results.push({ key: `page-gloam-${page}`, label: `Gloam v1.02 · p.${page}`, detail: excerpt(sourcePage.text, needle), documentId: "gloam-1.02", page });
      RULEBOOK_SECTIONS.filter((item) => item.documentId === "gloam-1.02" && page >= item.pages[0] && page <= item.pages[1]).forEach((item) => {
        results.push({ key: `section-${item.id}`, label: `${item.title} · p.${item.pages[0]}${item.pages[1] === item.pages[0] ? "" : `-${item.pages[1]}`}`, detail: item.summaryKo, section: item });
      });
      return results;
    }

    const lowered = needle.toLocaleLowerCase();
    const sectionHits = RULEBOOK_SECTIONS.filter((item) => [
      item.title,
      item.titleKo,
      item.summaryKo,
      item.refereeBoundaryKo || "",
      item.keywords.join(" "),
      item.kinds.join(" "),
      item.tableTitle || "",
    ].join(" ").toLocaleLowerCase().includes(lowered)).map((item) => ({
      key: `section-${item.id}`,
      label: `${item.title} · ${documentLabel[item.documentId]} p.${item.pages[0]}${item.pages[1] === item.pages[0] ? "" : `-${item.pages[1]}`}`,
      detail: item.summaryKo,
      section: item,
    }));

    const pageHits: SearchResult[] = [];
    for (const document of source.documents) {
      for (const page of document.pages) {
        if (!page.text.toLocaleLowerCase().includes(lowered)) continue;
        pageHits.push({
          key: `page-${document.id}-${page.page}`,
          label: `${document.title} · p.${page.page}`,
          detail: excerpt(page.text, needle),
          documentId: document.id,
          page: page.page,
        });
        if (pageHits.length >= 30) break;
      }
      if (pageHits.length >= 30) break;
    }
    return [...sectionHits, ...pageHits].slice(0, 40);
  }, [documents, query, source]);

  const persistReferenceState = (recipe: (previous: ReferenceState) => ReferenceState) => setReferenceState((previous) => recipe(previous));

  const visitSection = (id: string) => {
    setSelectedSectionId(id);
    setSelectedPage(null);
    setQuery("");
    persistReferenceState((previous) => ({ ...previous, recent: [id, ...previous.recent.filter((item) => item !== id)].slice(0, 12) }));
  };

  const visitPage = (documentId: SourceDocument["id"], page: number) => {
    setSelectedPage({ documentId, page });
    setQuery("");
  };

  const toggleBookmark = (key: string) => persistReferenceState((previous) => ({
    ...previous,
    bookmarks: previous.bookmarks.includes(key) ? previous.bookmarks.filter((item) => item !== key) : [...previous.bookmarks, key],
  }));

  const updateNote = (key: string, value: string) => persistReferenceState((previous) => ({ ...previous, notes: { ...previous.notes, [key]: value } }));

  const exportReferenceNotes = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...referenceState }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gloam-personal-rulebook-notes.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const jumpToPrintedPage = () => {
    const parsed = Number(pageInput.replace(/[^0-9]/g, ""));
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 60) return;
    visitPage("gloam-1.02", parsed);
  };

  const renderSectionList = (sections: RulebookSection[]) => (
    <div className="rulebook-index-list">
      {sections.map((item) => (
        <button key={item.id} className={selectedSectionId === item.id && !selectedPage ? "active" : ""} onClick={() => visitSection(item.id)}>
          <span>{item.title}</span>
          <small>{item.titleKo} · p.{item.pages[0]}{item.pages[1] === item.pages[0] ? "" : `-${item.pages[1]}`}</small>
        </button>
      ))}
    </div>
  );

  const renderBookmark = (bookmark: string) => {
    const [kind, id, pageValue] = bookmark.split(":");
    if (kind === "section" || kind === "table") {
      const item = findRulebookSection(id);
      if (!item) return null;
      return <button key={bookmark} onClick={() => visitSection(item.id)}><span>{kind === "table" ? item.tableTitle : item.title}</span><small>{documentLabel[item.documentId]} · p.{item.pages[0]}</small></button>;
    }
    if (kind === "page") {
      const documentId = id as SourceDocument["id"];
      const page = Number(pageValue);
      return <button key={bookmark} onClick={() => visitPage(documentId, page)}><span>{documentLabel[documentId]} · p.{page}</span><small>인쇄 페이지 갈피</small></button>;
    }
    return null;
  };

  const activeKey = selectedPage ? pageKey(selectedPage.documentId, selectedPage.page) : sectionKey(selectedSection.id);

  return (
    <div className="rulebook-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section ref={dialogRef} className="rulebook-transplant" role="dialog" aria-modal="true" aria-labelledby="rulebook-title">
        <header className="rulebook-masthead">
          <div>
            <p>PRIVATE v1.1 · GLOAM v1.02 SOURCE</p>
            <h2 id="rulebook-title">통합 룰북</h2>
            <span>원문 규칙과 Referee 판단을 분리해 읽는 개인용 판본</span>
          </div>
          <button className="rulebook-close" onClick={onClose} aria-label="통합 룰북 닫기" autoFocus={Boolean(source)}>닫기</button>
        </header>

        <div className="rulebook-search-strip">
          <label>원문 찾기<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="규칙, Talent, 괴수, 표, p.31" /></label>
          <label>인쇄 쪽<input value={pageInput} onChange={(event) => setPageInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") jumpToPrintedPage(); }} placeholder="p.31" /></label>
          <button onClick={jumpToPrintedPage}>쪽 펼치기</button>
        </div>

        <nav className="rulebook-mode-index" aria-label="통합 룰북 색인">
          {([['index', '목차'], ['tables', '표 서고'], ['bookmarks', '갈피'], ['recent', '최근 펼친 곳']] as [ViewMode, string][]).map(([key, label]) => (
            <button key={key} className={mode === key ? "active" : ""} onClick={() => { setMode(key); setQuery(""); }}>{label}</button>
          ))}
        </nav>

        <div className="rulebook-layout">
          <aside className="rulebook-index">
            {query ? (
              <>
                <h3>검색 결과 · {searchResults.length}</h3>
                <div className="rulebook-search-results">
                  {searchResults.map((result) => (
                    <button key={result.key} onClick={() => result.section ? visitSection(result.section.id) : visitPage(result.documentId!, result.page!)}>
                      <span>{result.label}</span><small>{result.detail}{result.detail.length >= 190 ? "…" : ""}</small>
                    </button>
                  ))}
                  {searchResults.length === 0 && <p>일치하는 원문이 없습니다.</p>}
                </div>
              </>
            ) : mode === "tables" ? (
              <>
                <h3>실제 플레이 표 · {RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("TABLE")).length}</h3>
                {renderSectionList(RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("TABLE")))}
              </>
            ) : mode === "bookmarks" ? (
              <>
                <h3>개인 갈피 · {referenceState.bookmarks.length}</h3>
                <div className="rulebook-index-list">{referenceState.bookmarks.map(renderBookmark)}{referenceState.bookmarks.length === 0 && <p>아직 꽂아 둔 갈피가 없습니다.</p>}</div>
                <button onClick={exportReferenceNotes}>갈피·메모 내보내기</button>
              </>
            ) : mode === "recent" ? (
              <>
                <h3>최근 펼친 곳</h3>
                {renderSectionList(referenceState.recent.map(findRulebookSection).filter((item): item is RulebookSection => Boolean(item)))}
              </>
            ) : (
              <>
                <section className="rulebook-coverage">
                  <h3>이식 기록</h3>
                  <dl>
                    <div><dt>원문 쪽</dt><dd>64</dd></div>
                    <div><dt>절</dt><dd>{coverage.sections}</dd></div>
                    <div><dt>규칙</dt><dd>{coverage.rules}</dd></div>
                    <div><dt>절차</dt><dd>{coverage.procedures}</dd></div>
                    <div><dt>표</dt><dd>{coverage.tables}</dd></div>
                    <div><dt>예시</dt><dd>{coverage.examples}</dd></div>
                    <div><dt>심판 주석</dt><dd>{coverage.refereeNotes}</dd></div>
                    <div><dt>맥락·참조</dt><dd>{coverage.references}</dd></div>
                    <div><dt>상호 연결</dt><dd>{coverage.crossLinks}</dd></div>
                  </dl>
                </section>
                <section className="rulebook-current-context">
                  <h3>현재 장부</h3>
                  <p>{runtimeLabel[currentTab]}</p>
                  {renderSectionList(currentReferences.slice(0, 8))}
                </section>
                {RULEBOOK_GROUPS.map((group) => (
                  <section key={group}>
                    <h3>{group}</h3>
                    {renderSectionList(RULEBOOK_SECTIONS.filter((item) => item.group === group))}
                  </section>
                ))}
              </>
            )}
          </aside>

          <article className="rulebook-reading-page">
            {!source && !encryptedSource && !sourceError && <p className="rulebook-loading">봉인된 원문을 가져오는 중입니다…</p>}
            {!source && encryptedSource && (
              <form className="rulebook-unlock" onSubmit={unlockSource}>
                <p>PRIVATE SOURCE · SEALED EDITION</p>
                <h2>개인 룰북 봉인</h2>
                <span>원문은 공개 저장소와 배포 서버에서 암호문으로만 보관됩니다. 암호는 이 세션의 해독에만 쓰이며 저장되지 않습니다.</span>
                <label>개인 룰북 암호<input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} autoComplete="off" autoFocus /></label>
                {sourceError && <p className="save-error" role="alert">{sourceError}</p>}
                <button type="submit" disabled={!passphrase || unlocking}>{unlocking ? "봉인을 푸는 중…" : "원문 잠금 풀기"}</button>
              </form>
            )}
            {!source && !encryptedSource && sourceError && <p className="save-error" role="alert">{sourceError}</p>}
            {source && directPage && selectedPage ? (
              <>
                <header className="rulebook-source-heading">
                  <p>SOURCE PAGE</p>
                  <h2>{documentLabel[selectedPage.documentId]} · p.{selectedPage.page}</h2>
                  <div className="rulebook-reading-actions">
                    <button onClick={() => toggleBookmark(pageKey(selectedPage.documentId, selectedPage.page))}>{referenceState.bookmarks.includes(pageKey(selectedPage.documentId, selectedPage.page)) ? "갈피 빼기" : "쪽에 갈피 꽂기"}</button>
                  </div>
                </header>
                <pre className={`rulebook-source-text${directPageHasTable ? " table-layout" : ""}`}>{directPage.text}</pre>
                <label className="rulebook-note">개인 메모 / House Rule <small>원문 및 게임 엔진과 분리되며 자동 적용되지 않습니다.</small><textarea value={referenceState.notes[activeKey] || ""} onChange={(event) => updateNote(activeKey, event.target.value)} /></label>
              </>
            ) : source ? (
              <>
                <header className="rulebook-source-heading">
                  <p>{selectedSection.kinds.join(" · ")}</p>
                  <h2>{selectedSection.title}</h2>
                  <span>{selectedSection.titleKo} · {documentLabel[selectedSection.documentId]} p.{selectedSection.pages[0]}{selectedSection.pages[1] === selectedSection.pages[0] ? "" : `-${selectedSection.pages[1]}`}</span>
                  <div className="rulebook-reading-actions">
                    <button onClick={() => toggleBookmark(sectionKey(selectedSection.id))}>{referenceState.bookmarks.includes(sectionKey(selectedSection.id)) ? "갈피 빼기" : "규칙에 갈피 꽂기"}</button>
                    {selectedSection.tableTitle && <button onClick={() => toggleBookmark(tableKey(selectedSection.id))}>{referenceState.bookmarks.includes(tableKey(selectedSection.id)) ? "표 갈피 빼기" : "표에 갈피 꽂기"}</button>}
                    {selectedSection.runtimeTab && <button onClick={() => onOpenRuntime(selectedSection.runtimeTab!)}>현재 게임에서 관련 장부 열기</button>}
                  </div>
                </header>

                <section className="rulebook-practical-summary">
                  <h3>실용 개요</h3>
                  <p>{selectedSection.summaryKo}</p>
                </section>

                {selectedSection.refereeBoundaryKo && <aside className="rulebook-referee-boundary"><h3>REFEREE NOTES</h3><p>{selectedSection.refereeBoundaryKo}</p></aside>}

                {selectedSection.tableTitle && <section className="rulebook-table-heading"><h3>TABLE · {selectedSection.tableTitle}</h3><p>아래 원문 쪽의 행과 수치를 그대로 참조합니다. 현재 runtime consumer: {selectedSection.runtimeTab ? runtimeLabel[selectedSection.runtimeTab] : "참조 전용"}.</p></section>}

                <section>
                  <h3>CANONICAL SOURCE</h3>
                  {sourcePages.map((page) => <div className="rulebook-source-page" key={`${selectedSection.documentId}-${page.page}`}><header><span>{documentLabel[selectedSection.documentId]} · p.{page.page}</span><button onClick={() => visitPage(selectedSection.documentId, page.page)}>이 쪽만 펼치기</button></header><pre className={`rulebook-source-text${selectedSection.kinds.includes("TABLE") ? " table-layout" : ""}`}>{page.text}</pre></div>)}
                </section>

                <section className="rulebook-crosslinks">
                  <h3>관련 원문</h3>
                  <div>{selectedSection.related.map(findRulebookSection).filter((item): item is RulebookSection => Boolean(item)).map((item) => <button key={item.id} onClick={() => visitSection(item.id)}>{item.title} · p.{item.pages[0]}</button>)}</div>
                </section>

                <label className="rulebook-note">개인 메모 / House Rule <small>Canonical Rule과 분리되며 gameplay engine을 자동 override하지 않습니다.</small><textarea value={referenceState.notes[activeKey] || ""} onChange={(event) => updateNote(activeKey, event.target.value)} /></label>
              </>
            ) : null}
          </article>
        </div>
      </section>
    </div>
  );
}
