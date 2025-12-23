import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-in-production-min-32-chars"
);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface TokenPayload extends JWTPayload {
    sub: string; // user id
    credentialId?: string; // device credential id
    type: "access" | "refresh";
}

export async function createAccessToken(
    userId: string,
    credentialId?: string
): Promise<string> {
    return new SignJWT({
        sub: userId,
        credentialId,
        type: "access",
    } as TokenPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(JWT_SECRET);
}

export async function createRefreshToken(
    userId: string,
    credentialId?: string
): Promise<string> {
    return new SignJWT({
        sub: userId,
        credentialId,
        type: "refresh",
    } as TokenPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as TokenPayload;
    } catch {
        return null;
    }
}

export async function setAuthCookies(
    userId: string,
    credentialId?: string
): Promise<void> {
    const cookieStore = await cookies();

    const accessToken = await createAccessToken(userId, credentialId);
    const refreshToken = await createRefreshToken(userId, credentialId);

    cookieStore.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60, // 15 minutes
        path: "/",
    });

    cookieStore.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
    });
}

export async function clearAuthCookies(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
}

export async function getSession(): Promise<TokenPayload | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (accessToken) {
        const payload = await verifyToken(accessToken);
        if (payload && payload.type === "access") {
            return payload;
        }
    }

    // Try refresh token
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (refreshToken) {
        const payload = await verifyToken(refreshToken);
        if (payload && payload.type === "refresh") {
            // Issue new access token
            await setAuthCookies(payload.sub, payload.credentialId);
            return {
                ...payload,
                type: "access",
            };
        }
    }

    return null;
}

export async function requireAuth(): Promise<TokenPayload> {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }
    return session;
}
