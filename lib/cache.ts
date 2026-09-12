// Upstash Redis — кэш повторных ответов + защита от превышения бесплатных
// лимитов (см. 02-ARCHITECTURE.md). Без KV_REST_API_URL/TOKEN работает как
// no-op: кэш и рейт-лимит просто выключены, а не роняют дев-сервер.
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const isConfigured = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const redis = isConfigured
  ? new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, "60 s"), // тот же лимит, что у NIM
      prefix: "echo:ratelimit",
    })
  : null;

export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (err) {
    console.error("cache: get не удался", err);
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttlSeconds = 60 * 60 * 24 * 7): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.error("cache: set не удался", err);
  }
}

/** true = запрос можно выполнять, false = превышен лимит */
export async function checkRateLimit(identifier: string): Promise<boolean> {
  if (!ratelimit) return true;
  try {
    const { success } = await ratelimit.limit(identifier);
    return success;
  } catch (err) {
    console.error("cache: rate limit не удался, пропускаю запрос", err);
    return true;
  }
}
