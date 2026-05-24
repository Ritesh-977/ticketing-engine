import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid Authorization header. Expected Bearer token.' });
            return;
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'Token missing from Authorization header.' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { tenantId: string, name: string };

        // Attach to req for downstream usage
        req.tenant = {
            id: decoded.tenantId,
            name: decoded.name
        };

        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
