import { redis } from '../config/redis.js';
import crypto from 'crypto';

/**
 * Attempts to acquire an exclusive lock in Redis.
 * @param lockKey The unique name of the lock (e.g., "lock:event:123")
 * @param ttlMs How long before the lock auto-expires (Safety net so locks don't get stuck forever)
 * @returns A unique lock value if successful, or null if the lock is busy.
 */
export const acquireLock = async (lockKey: string, ttlMs: number = 5000): Promise<string | null> => {
    // Generate a random ID for THIS specific lock request
    const lockValue = crypto.randomBytes(16).toString('hex');

    // NX = Only set the key if it does NOT already exist
    // PX = Set an auto-expiration in milliseconds
    const result = await redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX');

    if (result === 'OK') {
        return lockValue; // We successfully grabbed the lock!
    }

    return null; // Someone else already has the lock.
};

/**
 * Releases the lock, but ONLY if we are the ones who own it.
 */
export const releaseLock = async (lockKey: string, lockValue: string): Promise<boolean> => {
    // We use a raw Lua script here to guarantee atomicity.
    // It checks if the value in Redis matches OUR lockValue. If it does, it deletes it.
    // This prevents us from accidentally deleting someone else's lock if ours expired early.
    const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

    const result = await redis.eval(luaScript, 1, lockKey, lockValue);
    return result === 1;
};