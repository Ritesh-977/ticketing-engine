import express from 'express';
import { registerTenant } from '../controllers/tenantController.js';
import { requireSecretKey } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/tenants/register:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Register a new tenant account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Acme Corp"
 *     responses:
 *       201:
 *         description: Tenant registered successfully
 *       400:
 *         description: Bad request (missing required fields)
 *       500:
 *         description: Internal server error
 */
// Public Route: Anyone can register
router.post('/register', registerTenant);

/**
 * @openapi
 * /api/tenants/me:
 *   get:
 *     tags:
 *       - Tenants
 *     summary: Get details of the authenticated tenant
 *     security:
 *       - SecretKeyAuth: []
 *     responses:
 *       200:
 *         description: Authentication successful, returns tenant details
 *       401:
 *         description: Unauthorized (Invalid Secret Key)
 */
// Protected Route: Requires a valid Secret Key
router.get('/me', requireSecretKey, (req, res) => {
    // If the middleware passes, req.tenant will be populated!
    res.status(200).json({
        message: 'Authentication successful',
        tenant: req.tenant
    });
});

export default router;