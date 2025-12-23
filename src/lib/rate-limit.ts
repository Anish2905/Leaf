import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// In-memory fallback for development
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function createInMemoryRateLimiter(limit: number, windowMs: number) {
    return {
        async limit(identifier: string) {
            const now = Date.now();
            const record = inMemoryStore.get(identifier);

            if (!record || now > record.resetAt) {
                inMemoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
                return { success: true, remaining: limit - 1, reset: now + windowMs };
            }

            if (record.count >= limit) {
                return { success: false, remaining: 0, reset: record.resetAt };
            }

            record.count++;
            return { success: true, remaining: limit - record.count, reset: record.resetAt };
        },
    };
}

// Rate limiters
let passphraseRateLimiter: ReturnType<typeof createInMemoryRateLimiter> | Ratelimit;
let passkeyRateLimiter: ReturnType<typeof createInMemoryRateLimiter> | Ratelimit;
let authRateLimiter: ReturnType<typeof createInMemoryRateLimiter> | Ratelimit;
let apiRateLimiter: ReturnType<typeof createInMemoryRateLimiter> | Ratelimit;

// Initialize rate limiters
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Passphrase: 5 attempts per 15 minutes
    passphraseRateLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "ratelimit:passphrase",
    });

    // Passkey: 10 attempts per 15 minutes
    passkeyRateLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "15 m"),
        prefix: "ratelimit:passkey",
    });

    // General auth: 30 requests per 15 minutes
    authRateLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "15 m"),
        prefix: "ratelimit:auth",
    });

    // API: 100 requests per minute
    apiRateLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        prefix: "ratelimit:api",
    });
} else {
    // In-memory fallback for development
    console.warn("Upstash Redis not configured, using in-memory rate limiting");
    passphraseRateLimiter = createInMemoryRateLimiter(5, 15 * 60 * 1000);
    passkeyRateLimiter = createInMemoryRateLimiter(10, 15 * 60 * 1000);
    authRateLimiter = createInMemoryRateLimiter(30, 15 * 60 * 1000);
    apiRateLimiter = createInMemoryRateLimiter(100, 60 * 1000);
}

export async function getClientIP(): Promise<string> {
    const headersList = await headers();
    return (
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        "unknown"
    );
}

export type RateLimitType = "passphrase" | "passkey" | "auth" | "api";

export async function checkRateLimit(
    type: RateLimitType,
    identifier?: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
    const ip = identifier || (await getClientIP());
    const key = `${type}:${ip}`;

    let limiter;
    switch (type) {
        case "passphrase":
            limiter = passphraseRateLimiter;
            break;
        case "passkey":
            limiter = passkeyRateLimiter;
            break;
        case "auth":
            limiter = authRateLimiter;
            break;
        case "api":
            limiter = apiRateLimiter;
            break;
    }

    const result = await limiter.limit(key);
    return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
    };
}

export function rateLimitHeaders(result: { remaining: number; reset: number }) {
    return {
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
    };
}
