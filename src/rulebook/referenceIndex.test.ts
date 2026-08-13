import { describe, expect, it } from "vitest";
import sourceManifest from "../../public/rulebook/gloam-source.manifest.json";
import { RULEBOOK_GROUPS, RULEBOOK_SECTIONS, findRulebookSection } from "./referenceIndex";

interface SourceManifest {
  encryption: string;
  documents: { id: string; pages: number; firstPage: number; lastPage: number }[];
}

const manifest = sourceManifest as SourceManifest;
const documents = new Map(manifest.documents.map((document) => [document.id, document]));

describe("Gloam personal rulebook transplant", () => {
  it("covers every printed source page and both companion documents", () => {
    expect(manifest.encryption).toBe("AES-256-GCM");
    expect(documents.get("gloam-1.02")?.pages).toBe(60);
    expect(documents.get("combat-example")?.pages).toBe(3);
    expect(documents.get("character-sheet")?.pages).toBe(1);
    expect(RULEBOOK_SECTIONS).toHaveLength(44);
  });

  it("locks the published transplant coverage metrics", () => {
    expect({
      chapters: RULEBOOK_GROUPS.length,
      sections: RULEBOOK_SECTIONS.length,
      rules: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("RULE")).length,
      tables: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("TABLE")).length,
      procedures: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("PROCEDURE")).length,
      examples: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("EXAMPLE")).length,
      refereeNotes: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("REFEREE NOTES")).length,
      references: RULEBOOK_SECTIONS.filter((item) => item.kinds.includes("REFERENCE") || item.kinds.includes("CONTEXT")).length,
      crossLinks: RULEBOOK_SECTIONS.reduce((total, item) => total + item.related.length, 0),
    }).toEqual({
      chapters: 7,
      sections: 44,
      rules: 31,
      tables: 23,
      procedures: 26,
      examples: 9,
      refereeNotes: 30,
      references: 23,
      crossLinks: 146,
    });
  });

  it("keeps section pages, cross-links, tables, and runtime consumers resolvable", () => {
    const validTabs = new Set(["character", "tests", "magic", "map", "downtime", "log"]);
    for (const section of RULEBOOK_SECTIONS) {
      const document = documents.get(section.documentId);
      expect(document, section.id).toBeDefined();
      expect(section.pages[0], section.id).toBeGreaterThanOrEqual(document?.firstPage || 1);
      expect(section.pages[1], section.id).toBeLessThanOrEqual(document?.lastPage || 0);
      expect(section.kinds.length, section.id).toBeGreaterThan(0);
      expect(section.summaryKo.trim().length, section.id).toBeGreaterThan(10);
      for (const related of section.related) expect(findRulebookSection(related), `${section.id} -> ${related}`).toBeDefined();
      if (section.runtimeTab) expect(validTabs.has(section.runtimeTab), section.id).toBe(true);
      if (section.kinds.includes("TABLE")) expect(section.tableTitle, section.id).toBeTruthy();
    }
  });

  it("keeps the public manifest metadata-only", () => {
    expect(Object.keys(sourceManifest).sort()).toEqual(["documents", "edition", "encryption"]);
    expect(sourceManifest.documents.every((document) => Object.keys(document).length === 5)).toBe(true);
  });
});
