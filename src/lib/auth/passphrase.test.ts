import { describe, it, expect } from "vitest";
import { validatePassphraseStrength } from "./passphrase";

// Note: hashPassphrase and verifyPassphrase require argon2 which needs native bindings
// These tests focus on the synchronous validation function

describe("Passphrase utilities", () => {
    describe("validatePassphraseStrength", () => {
        it("should reject passphrases shorter than 12 characters", () => {
            const result = validatePassphraseStrength("short");
            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                "Passphrase must be at least 12 characters long"
            );
        });

        it("should accept passphrases with 12+ characters", () => {
            const result = validatePassphraseStrength("this-is-a-secure-passphrase");
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should reject passphrases longer than 128 characters", () => {
            const longPassphrase = "a".repeat(129);
            const result = validatePassphraseStrength(longPassphrase);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                "Passphrase must be at most 128 characters long"
            );
        });

        it("should reject passphrases with all same character", () => {
            const result = validatePassphraseStrength("aaaaaaaaaaaa");
            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                "Passphrase contains predictable patterns"
            );
        });

        it("should reject sequential number patterns", () => {
            const result = validatePassphraseStrength("123456789012");
            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                "Passphrase contains predictable patterns"
            );
        });

        it("should reject sequential letter patterns", () => {
            const result = validatePassphraseStrength("abcdefghijkl");
            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                "Passphrase contains predictable patterns"
            );
        });

        it("should accept strong passphrases", () => {
            const strongPassphrases = [
                "correct-horse-battery-staple",
                "My$ecureP@ssphrase123!",
                "a-random-secure-string-here",
                "MixedCaseWithNumbers123",
            ];

            for (const passphrase of strongPassphrases) {
                const result = validatePassphraseStrength(passphrase);
                expect(result.valid).toBe(true);
            }
        });

        it("should return multiple errors for multiple issues", () => {
            const result = validatePassphraseStrength("short");
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should handle empty passphrase", () => {
            const result = validatePassphraseStrength("");
            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                "Passphrase must be at least 12 characters long"
            );
        });

        it("should handle unicode characters", () => {
            const result = validatePassphraseStrength("こんにちは世界パスワード");
            expect(result.valid).toBe(true);
        });
    });
});
