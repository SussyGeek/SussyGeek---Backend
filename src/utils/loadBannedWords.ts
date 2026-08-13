import fs from "node:fs/promises";
import crypto from "node:crypto";

export async function loadBannedWords(
    filePath: string,
    keyHex: string
): Promise<Set<string>> {
    const key = Buffer.from(keyHex, "hex");

    if (key.length !== 32) {
        throw new Error(
            "AES-256 key must be exactly 32 bytes / 64 hex characters."
        );
    }

    const encrypted = await fs.readFile(filePath);

    // Python AESGCM format:
    // [12-byte nonce][ciphertext + 16-byte auth tag]

    if (encrypted.length < 12 + 16) {
        throw new Error("Invalid encrypted banned-words file.");
    }

    const nonce = encrypted.subarray(0, 12);
    const authTag = encrypted.subarray(encrypted.length - 16);
    const ciphertext = encrypted.subarray(
        12,
        encrypted.length - 16
    );

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        nonce
    );

    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    const words = plaintext
        .toString("utf8")
        .split("\n")
        .map(word => word.trim())
        .filter(Boolean);

    return new Set(words);
}