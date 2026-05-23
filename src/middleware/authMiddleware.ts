import { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/database.js';

export const requireSecretKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1. Extract the token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid Authorization header. Format: Bearer sk_test_...' });
            return;
        }

        const secretKey = authHeader.split(' ')[1];

        if (!secretKey || !secretKey.startsWith('sk_')) {
            res.status(401).json({ error: 'Invalid key type. Secret key required.' });
            return;
        }

        // 2. Fetch ALL tenants (Since we don't know who this key belongs to yet)
        // NOTE: In Phase 2, we will optimize this by caching keys in Redis!
        const query = `SELECT id, name, secret_key_hash FROM tenants;`;
        const result = await db.query(query);

        // 3. Find the matching tenant by comparing the hash
        let matchedTenant = null;
        for (const tenant of result.rows) {
            const isValid = await bcrypt.compare(secretKey, tenant.secret_key_hash);
            if (isValid) {
                matchedTenant = tenant;
                break;
            }
        }

        if (!matchedTenant) {
            res.status(401).json({ error: 'Invalid API Key' });
            return;
        }

        // 4. Attach the tenant ID to the request so downstream routes know who is calling
        req.tenant = {
            id: matchedTenant.id,
            name: matchedTenant.name
        };

        next(); // Pass control to the next function
    } catch (error) {
        console.error('Authentication Error:', error);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};