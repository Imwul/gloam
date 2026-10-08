type MarkKind = "tower" | "divider" | "cups" | "wands" | "swords" | "coins";

/** Original line ornaments inspired by the book's ink and woodcut vocabulary. */
export default function GothicMark({ kind, className = "" }: { kind: MarkKind; className?: string }) {
  return <svg className={`gothic-mark ${className}`} viewBox={kind === "divider" ? "0 0 240 32" : "0 0 120 120"} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {kind === "tower" && <>
      <path d="M22 101V56l13-20 13 20v45M72 101V56l13-20 13 20v45M34 37V23m52 14V23M48 101V46l12-24 12 24v55M15 103h90M13 109h94" />
      <path d="M27 58h16M77 58h16M48 46h24M50 53h20M54 101V77q6-19 12 0v24M35 43l-3 7h6zM85 43l-3 7h6zM55 59l5-9 5 9v9H55z" fill="currentColor" />
      <path d="M28 65v30m4-31v29m7-30v32m42-30v30m5-30v27m5-26v30M50 87v14m20-14v14M18 101l-5-9 5-11-2-11 4-8M102 101l5-9-5-11 2-11-4-8M60 5v10m-5-5h10M48 15l-6-6m30 6 6-6M59 85v14m4-13v13" />
      <path d="M14 84q-10 1-8-8 8 1 8 8M106 84q10 1 8-8-8 1-8 8M16 98q-10 3-9-6 8-1 9 6M104 98q10 3 9-6-8-1-9 6" fill="currentColor" />
    </>}
    {kind === "divider" && <>
      <path d="M5 18q48-5 99 0m32 0q51-5 99 0M5 22q48-5 99 0m32 0q51-5 99 0M119 3v26m-8-17h16M110 20l9 9 10-9" />
      {[24, 48, 72, 162, 186, 210].map(x => <g key={x}><path d={`M${x} 18q-3-7-10-8 1 8 10 8M${x + 5} 20q6 5 12 1-5-5-12-1`} fill="currentColor" /><path d={`M${x + 8} 16l4-8`} /></g>)}
    </>}
    {kind === "cups" && <>
      <path d="M28 28q32-12 64 0M28 28q0 38 32 43 32-5 32-43M31 31q29 9 58 0M35 41q25 8 50 0M55 73v20l-19 10h48L65 93V73M30 40l-9 1q-8 23 16 26M90 40l9 1q8 23-16 26" />
      <path d="M42 47v13m7-12v15m22-15v15m7-16v12M41 97h38M37 108h46" />
    </>}
    {kind === "wands" && <>
      <path d="M54 105l9-94 7 1-8 94zM62 21l-11-8m10 18L45 24m15 22 18-10m-19 28-18-8m16 29 17-9M51 18q-14 0-14-10 13-2 14 10M46 28q-14 1-15-10 13-2 15 10M76 39q14 0 15-11-13-2-15 11M44 60q-14 2-17-9 13-3 17 9M71 80q14 1 17-10-13-3-17 10" />
      <path d="M57 103l6-69m2-4 1-13M47 104h25M55 110h13" />
    </>}
    {kind === "swords" && <>
      <path d="M60 8l10 17-4 49H54l-4-49zM60 18v55M35 79q25-8 50 0l-3 7q-22-6-44 0zM55 87v18h10V87M52 106h16l-8 8z" />
      <path d="M57 90h6m-6 5h6m-6 5h6M52 29l5 34M68 29l-5 34M39 76l-3-5m45 5 3-5" />
    </>}
    {kind === "coins" && <>
      <path d="M60 9q41 18 45 50-4 35-45 53Q19 94 15 59 19 27 60 9zM60 18q32 16 36 41-4 28-36 44-32-16-36-44 4-25 36-41zM60 28l8 23 24 1-19 15 7 24-20-14-20 14 7-24-19-15 24-1z" />
      <path d="M60 13v5M22 57h7m63 0h7M60 103v5M33 35l5 4m44-4-5 4M34 87l5-4m43 4-5-4" />
    </>}
  </svg>;
}
