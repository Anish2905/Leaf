import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    type VerifiedRegistrationResponse,
    type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
    RegistrationResponseJSON,
    AuthenticationResponseJSON,
    AuthenticatorTransportFuture,
} from "@simplewebauthn/types";
import { db } from "@/lib/db";
import { credentials, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// WebAuthn configuration
const rpName = process.env.WEBAUTHN_RP_NAME || "Polar Stellar";
const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

export interface StoredCredential {
    id: string;
    publicKey: Uint8Array;
    counter: number;
    transports?: AuthenticatorTransportFuture[];
}

// Get user's existing credentials for excludeCredentials
async function getUserCredentials(userId: string): Promise<StoredCredential[]> {
    const userCredentials = await db
        .select()
        .from(credentials)
        .where(eq(credentials.userId, userId));

    return userCredentials.map((cred) => ({
        id: cred.id,
        publicKey: new Uint8Array(cred.publicKey),
        counter: cred.counter,
        transports: cred.transports
            ? (JSON.parse(cred.transports) as AuthenticatorTransportFuture[])
            : undefined,
    }));
}

// Generate registration options for a new passkey
export async function generatePasskeyRegistrationOptions(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).get();

    if (!user) {
        throw new Error("User not found");
    }

    const userCredentials = await getUserCredentials(userId);

    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: new TextEncoder().encode(userId),
        userName: "owner", // Single user app
        userDisplayName: "Owner",
        attestationType: "none", // We don't need attestation for personal use
        excludeCredentials: userCredentials.map((cred) => ({
            id: cred.id,
            transports: cred.transports,
        })),
        authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
            authenticatorAttachment: "platform", // Prefer platform authenticators
        },
    });

    return options;
}

// Verify registration response and store credential
export async function verifyPasskeyRegistration(
    userId: string,
    response: RegistrationResponseJSON,
    expectedChallenge: string,
    deviceName?: string
): Promise<VerifiedRegistrationResponse> {
    const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
        const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

        // Store the credential
        await db.insert(credentials).values({
            id: credentialID,
            userId,
            publicKey: Buffer.from(credentialPublicKey),
            counter: counter,
            deviceName: deviceName || "Unknown Device",
            transports: response.response.transports
                ? JSON.stringify(response.response.transports)
                : null,
        });
    }

    return verification;
}

// Generate authentication options
export async function generatePasskeyAuthenticationOptions(userId?: string) {
    let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];

    if (userId) {
        const userCredentials = await getUserCredentials(userId);
        allowCredentials = userCredentials.map((cred) => ({
            id: cred.id,
            transports: cred.transports,
        }));
    }

    const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "preferred",
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    });

    return options;
}

// Verify authentication response
export async function verifyPasskeyAuthentication(
    response: AuthenticationResponseJSON,
    expectedChallenge: string
): Promise<{ verified: boolean; userId?: string; credentialId?: string }> {
    // Find the credential
    const credential = await db
        .select()
        .from(credentials)
        .where(eq(credentials.id, response.id))
        .get();

    if (!credential) {
        return { verified: false };
    }

    const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
            credentialID: credential.id,
            credentialPublicKey: new Uint8Array(credential.publicKey),
            counter: credential.counter,
            transports: credential.transports
                ? (JSON.parse(credential.transports) as AuthenticatorTransportFuture[])
                : undefined,
        },
    });

    if (verification.verified) {
        // Update counter and last used time
        await db
            .update(credentials)
            .set({
                counter: verification.authenticationInfo.newCounter,
                lastUsedAt: new Date().toISOString(),
            })
            .where(eq(credentials.id, response.id));

        return {
            verified: true,
            userId: credential.userId,
            credentialId: credential.id,
        };
    }

    return { verified: false };
}

// Delete a credential (revoke device)
export async function revokeCredential(
    userId: string,
    credentialId: string
): Promise<boolean> {
    const result = await db
        .delete(credentials)
        .where(eq(credentials.id, credentialId))
        .returning();

    return result.length > 0;
}

// List user's credentials
export async function listUserCredentials(userId: string) {
    return db
        .select({
            id: credentials.id,
            deviceName: credentials.deviceName,
            lastUsedAt: credentials.lastUsedAt,
            createdAt: credentials.createdAt,
        })
        .from(credentials)
        .where(eq(credentials.userId, userId));
}
