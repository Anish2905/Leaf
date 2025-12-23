import { hash, compare } from "bcryptjs";

// Validation helper
export function validatePassphraseStrength(passphrase: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    if (passphrase.length < 12) {
        errors.push("Passphrase must be at least 12 characters long");
    }
    // Add more checks as needed (e.g. common passwords)

    return {
        valid: errors.length === 0,
        errors
    };
}

export async function hashPassphrase(passphrase: string): Promise<string> {
    return hash(passphrase, 12);
}

export async function verifyPassphrase(
    passphrase: string,
    hashValue: string
): Promise<boolean> {
    try {
        return await compare(passphrase, hashValue);
    } catch {
        return false;
    }
}
