const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PASSPHRASE_ENV = "GLOAM_RULEBOOK_PASSPHRASE";
const ITERATIONS = 310_000;
const inputPath = path.resolve(process.argv[2] || "public/rulebook/gloam-source.json");
const outputPath = path.resolve(process.argv[3] || "public/rulebook/gloam-source.enc.json");
const passphrase = process.env[PASSPHRASE_ENV];

if (!passphrase) {
  process.stderr.write(`${PASSPHRASE_ENV} is required.\n`);
  process.exit(1);
}

const plaintext = fs.readFileSync(inputPath);
JSON.parse(plaintext.toString("utf8"));

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, 32, "sha256");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const payload = Buffer.concat([ciphertext, cipher.getAuthTag()]);

const envelope = {
  version: 1,
  algorithm: "AES-256-GCM",
  kdf: {
    name: "PBKDF2",
    hash: "SHA-256",
    iterations: ITERATIONS,
    salt: salt.toString("base64"),
  },
  iv: iv.toString("base64"),
  payload: payload.toString("base64"),
};

fs.writeFileSync(outputPath, `${JSON.stringify(envelope)}\n`, { mode: 0o644 });
process.stdout.write(`Encrypted ${plaintext.length} bytes to ${outputPath}\n`);
