import { type Request, type Response } from 'express';
import { db } from '../config/database.js';
import { generatePublishableKey, generateSecretKey, hashSecretKey } from '../utils/crypto.js';

// ─── Interface Definitions ───────────────────────────────────────────────────

/** Shape of a row returned from the api_keys table after INSERT. */
interface ApiKeyRow {
    id: string;
    tenant_id: string;
    publishable_key: string;
    environment: string;
    status: string;
    created_at: string;
}

/** Shape of the success response sent back to the client. */
interface GenerateKeysResponse {
    message: string;
    api_key: {
        id: string;
        tenant_id: string;
        publishable_key: string;
        secret_key: string;   // Raw — shown exactly once
        environment: string;
        status: string;
        created_at: string;
    };
}

/** Shape of an error response. */
interface ErrorResponse {
    error: string;
}

// ─── Controller ──────────────────────────────────────────────────────────────

/**
 * POST /api/tenants/keys
 *
 * Generates a new publishable + secret key pair for the authenticated tenant.
 * The secret key is returned in plaintext **exactly once**; only its bcrypt
 * hash is stored in PostgreSQL.
 *
 * The entire operation is wrapped in an explicit transaction so that a
 * failure at any step triggers a ROLLBACK — no orphaned rows.
 */
export const generateApiKeys = async (
    req: Request,
    res: Response<GenerateKeysResponse | ErrorResponse>
): Promise<void> => {
    // The requireSecretKey middleware guarantees req.tenant is populated.
    const tenantId: string | undefined = req.tenant?.id;

    if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: Tenant identity not found on request.' });
        return;
    }

    // Acquire a dedicated client from the pool for the transaction.
    const client = await db.connect();

    try {
        // ── 1. Generate raw key material ─────────────────────────────────
        const rawPublishableKey: string = generatePublishableKey();
        const rawSecretKey: string = generateSecretKey();

        // ── 2. Hash the secret key (bcrypt, 12 rounds) ──────────────────
        const secretKeyHash: string = await hashSecretKey(rawSecretKey);

        // ── 3. Persist inside a transaction ──────────────────────────────
        await client.query('BEGIN');

        const insertQuery: string = `
            INSERT INTO api_keys (tenant_id, publishable_key, secret_key_hash, environment, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, tenant_id, publishable_key, environment, status, created_at;
        `;

        const values: string[] = [tenantId, rawPublishableKey, secretKeyHash, 'live', 'active'];
        const result = await client.query<ApiKeyRow>(insertQuery, values);

        await client.query('COMMIT');

        const insertedRow: ApiKeyRow | undefined = result.rows[0];

        if (!insertedRow) {
            throw new Error('Insert succeeded but returned no rows — unexpected state.');
        }

        // ── 4. Return the raw secret key (one-time disclosure) ───────────
        res.status(201).json({
            message: 'API keys generated successfully. Store your secret key securely — it will not be shown again.',
            api_key: {
                id: insertedRow.id,
                tenant_id: insertedRow.tenant_id,
                publishable_key: insertedRow.publishable_key,
                secret_key: rawSecretKey,
                environment: insertedRow.environment,
                status: insertedRow.status,
                created_at: insertedRow.created_at,
            },
        });

    } catch (error: unknown) {
        // Rollback the transaction on any failure.
        await client.query('ROLLBACK');

        const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error generating API keys:', errorMessage);

        res.status(500).json({ error: 'Internal server error while generating API keys.' });
    } finally {
        // Always release the client back to the pool.
        client.release();
    }
};

/**
 * GET /api/tenants/keys
 *
 * Lists all active API keys for the authenticated tenant.
 * Crucially omits the secret_key_hash.
 */
export const listApiKeys = async (
    req: Request,
    res: Response
): Promise<void> => {
    const tenantId: string | undefined = req.tenant?.id;

    if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: Tenant identity not found on request.' });
        return;
    }

    try {
        const query = `
            SELECT id, publishable_key, environment, status, created_at
            FROM api_keys
            WHERE tenant_id = $1 AND status = 'active'
            ORDER BY created_at DESC;
        `;

        const result = await db.query(query, [tenantId]);

        res.status(200).json({ keys: result.rows });
    } catch (error: unknown) {
        const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching API keys:', errorMessage);

        res.status(500).json({ error: 'Internal server error while fetching API keys.' });
    }
};

/**
 * DELETE /api/tenants/keys/:keyId
 *
 * Soft-deletes an API key by setting its status to 'revoked'.
 * Ensures the key belongs to the authenticated tenant.
 */
export const revokeApiKey = async (
    req: Request,
    res: Response
): Promise<void> => {
    const tenantId: string | undefined = req.tenant?.id;
    const { keyId } = req.params;

    if (!tenantId) {
        res.status(401).json({ error: 'Unauthorized: Tenant identity not found on request.' });
        return;
    }

    if (!keyId) {
        res.status(400).json({ error: 'Bad Request: keyId parameter is required.' });
        return;
    }

    try {
        const query = `
            UPDATE api_keys 
            SET status = 'revoked' 
            WHERE id = $1 AND tenant_id = $2
            RETURNING id;
        `;

        const result = await db.query(query, [keyId, tenantId]);

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Not Found: API key does not exist or does not belong to this tenant.' });
            return;
        }

        res.status(200).json({ message: 'API key successfully revoked.' });
    } catch (error: unknown) {
        const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error revoking API key:', errorMessage);

        res.status(500).json({ error: 'Internal server error while revoking API key.' });
    }
};
