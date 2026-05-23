import express from 'express';
import { registerTenant } from '../controllers/tenantController.js';
import { requireSecretKey } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Route: Anyone can register
router.post('/register', registerTenant);

// Protected Route: Requires a valid Secret Key
router.get('/me', requireSecretKey, (req, res) => {
    // If the middleware passes, req.tenant will be populated!
    res.status(200).json({
        message: 'Authentication successful',
        tenant: req.tenant
    });
});

export default router;