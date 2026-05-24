import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Number of bcrypt salt rounds.
 * 12 provides a strong security margin (~300ms hash time) while remaining
 * practical for a key-generation endpoint that is called infrequently.
 */
const BCRYPT_SALT_ROUNDS: number = 12;

/**
 * Generates a publishable API key suitable for client-side embedding.
 *
 * Format: `pk_live_<48-char hex>`
 * Total length: 56 characters (prefix + 24 random bytes as hex)
 *
 * @returns A prefixed, cryptographically random publishable key.
 */
export const generatePublishableKey = (): string => {
    const randomString: string = crypto.randomBytes(24).toString('hex');
    return `pk_live_${randomString}`;
};

/**
 * Generates a secret API key that must be kept confidential by the tenant.
 *
 * Format: `sk_live_<64-char hex>`
 * Total length: 72 characters (prefix + 32 random bytes as hex)
 *
 * @returns A prefixed, cryptographically random secret key.
 */
export const generateSecretKey = (): string => {
    const randomString: string = crypto.randomBytes(32).toString('hex');
    return `sk_live_${randomString}`;
};

/**
 * Produces a one-way bcrypt hash of a raw secret key.
 * The hash is safe to persist; the raw key cannot be recovered from it.
 *
 * @param rawKey - The plaintext secret key to hash.
 * @returns The bcrypt hash string.
 */
export const hashSecretKey = async (rawKey: string): Promise<string> => {
    const hash: string = await bcrypt.hash(rawKey, BCRYPT_SALT_ROUNDS);
    return hash;
};
