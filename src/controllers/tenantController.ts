import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from '../config/database.js';

// Helper function to generate secure, random API keys
const generateApiKey = (prefix: 'pk' | 'sk') => {
    const randomString = crypto.randomBytes(24).toString('hex');
    return `${prefix}_test_${randomString}`;
};

export const registerTenant = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Tenant name is required' });
            return;
        }

        // 1. Generate the raw keys
        const publishableKey = generateApiKey('pk');
        const rawSecretKey = generateApiKey('sk');

        // 2. Hash the secret key (Cost factor 10)
        const saltRounds = 10;
        const secretKeyHash = await bcrypt.hash(rawSecretKey, saltRounds);

        // 3. Insert into PostgreSQL
        const insertQuery = `
      INSERT INTO tenants (name, publishable_key, secret_key_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, publishable_key, created_at;
    `;

        const result = await db.query(insertQuery, [name, publishableKey, secretKeyHash]);
        const newTenant = result.rows[0];

        // 4. Return the keys to the developer (THIS IS THE ONLY TIME THEY SEE THE RAW SECRET KEY)
        res.status(201).json({
            message: 'Tenant registered successfully. Please save your secret key, it will not be shown again.',
            tenant: newTenant,
            secret_key: rawSecretKey
        });

    } catch (error) {
        console.error('Error registering tenant:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};