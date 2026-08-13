const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PASSPHRASE_ENV = "GLOAM_RULEBOOK_PASSPHRASE";
const encryptedPath = path.resolve(process.argv[2] || "public/rulebook/gloam-source.enc.json");
const passphrase = process.env[PASSPHRASE_ENV];

if (!passphrase) {
  process.stderr.write(`${PASSPHRASE_ENV} is required.\n`);
  process.exit(1);
}

const envelope = JSON.parse(fs.readFileSync(encryptedPath, "utf8"));
if (envelope.version !== 1 || envelope.algorithm !== "AES-256-GCM") throw new Error("Unexpected encrypted source format");
if (envelope.kdf?.name !== "PBKDF2" || envelope.kdf?.hash !== "SHA-256") throw new Error("Unexpected encrypted source KDF");

const salt = Buffer.from(envelope.kdf.salt, "base64");
const iv = Buffer.from(envelope.iv, "base64");
const payload = Buffer.from(envelope.payload, "base64");
const ciphertext = payload.subarray(0, -16);
const tag = payload.subarray(-16);
const key = crypto.pbkdf2Sync(passphrase, salt, envelope.kdf.iterations, 32, "sha256");
const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
decipher.setAuthTag(tag);
const source = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"));

const documents = new Map(source.documents.map((document) => [document.id, document]));
const pageHash = (documentId, pageNumber) => {
  const text = documents.get(documentId)?.pages.find((item) => item.page === pageNumber)?.text || "";
  return crypto.createHash("sha256").update(text).digest("hex");
};
const checks = [
  [documents.get("gloam-1.02")?.pages.length === 60, "Gloam page count"],
  [documents.get("combat-example")?.pages.length === 3, "Combat Example page count"],
  [documents.get("character-sheet")?.pages.length === 1, "Character Sheet page count"],
  [pageHash("gloam-1.02", 7) === "427528713413022578410e1e119a037f6ee974f61957f8c9f60f51121f1ff174", "deck source page"],
  [pageHash("gloam-1.02", 30) === "d7fd0f66673cbdaba05d68488f84066fcd8648812d2a03e587b576f8326b6410", "combat opening page"],
  [pageHash("gloam-1.02", 31) === "4196aee218827c34b76e0dbcd0ea6057e0a2e6ab01ce93f5a64f05ffe2c95b4b", "combat procedure page"],
  [pageHash("gloam-1.02", 42) === "1436969583fcdfe113429984e1c3ad4dd3c951839965ddd153e8b1ee82b498a4", "event procedure page"],
  [pageHash("combat-example", 3) === "3a0e14ae1da80e38358766f1ccce03cd7d6caa876d4f95db0c2676de9a9427c8", "Combat Example final page"],
];

const failure = checks.find(([passed]) => !passed);
if (failure) throw new Error(`Encrypted source verification failed: ${failure[1]}`);
process.stdout.write(`Encrypted rulebook verified: ${source.documents.reduce((total, document) => total + document.pages.length, 0)} pages, ${checks.length} canonical checks PASS\n`);
