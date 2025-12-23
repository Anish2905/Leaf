import * as argon2 from "argon2";

// Argon2id configuration for password hashing
// Using recommended OWASP parameters
const ARGON2_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
};

export async function hashPassphrase(passphrase: string): Promise<string> {
    return argon2.hash(passphrase, ARGON2_OPTIONS);
}

export async function verifyPassphrase(
    passphrase: string,
    hash: string
): Promise<boolean> {
    try {
        return await argon2.verify(hash, passphrase);
    } catch {
        return false;
    }
}

// Passphrase strength validation
export function validatePassphraseStrength(passphrase: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (passphrase.length < 12) {
        errors.push("Passphrase must be at least 12 characters long");
    }

    if (passphrase.length > 128) {
        errors.push("Passphrase must be at most 128 characters long");
    }

    // Check for common patterns
    const commonPatterns = [
        /^(.)\1+$/, // All same character
        /^(012|123|234|345|456|567|678|789|890)+$/, // Sequential numbers
        /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i, // Sequential letters
    ];

    for (const pattern of commonPatterns) {
        if (pattern.test(passphrase)) {
            errors.push("Passphrase contains predictable patterns");
            break;
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
