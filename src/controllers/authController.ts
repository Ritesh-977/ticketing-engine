import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

// Helper function to generate fallback legacy keys
const generateApiKey = (prefix: 'pk' | 'sk') => {
    const randomString = crypto.randomBytes(24).toString('hex');
    return `${prefix}_test_${randomString}`;
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ error: 'Name, email, and password are required' });
            return;
        }

        // Check if user already exists
        const checkQuery = 'SELECT id FROM tenants WHERE email = $1';
        const checkResult = await db.query(checkQuery, [email]);
        if (checkResult.rows.length > 0) {
            res.status(409).json({ error: 'Email already in use' });
            return;
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Legacy: generate master publishable and secret keys for the tenant record itself
        const publishableKey = generateApiKey('pk');
        const rawSecretKey = generateApiKey('sk');
        const secretKeyHash = await bcrypt.hash(rawSecretKey, saltRounds);

        const insertQuery = `
            INSERT INTO tenants (name, email, password_hash, publishable_key, secret_key_hash)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, email, created_at;
        `;

        const result = await db.query(insertQuery, [name, email, passwordHash, publishableKey, secretKeyHash]);
        const newTenant = result.rows[0];

        // Generate JWT Token
        const token = jwt.sign(
            { tenantId: newTenant.id, name: newTenant.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            tenant: newTenant,
            token
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const query = 'SELECT id, name, password_hash FROM tenants WHERE email = $1';
        const result = await db.query(query, [email]);

        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const tenant = result.rows[0];
        const isValid = await bcrypt.compare(password, tenant.password_hash);

        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { tenantId: tenant.id, name: tenant.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login successful',
            tenant: { id: tenant.id, name: tenant.name },
            token
        });

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
};
