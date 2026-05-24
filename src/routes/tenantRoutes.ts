import express from 'express';
import { registerTenant } from '../controllers/tenantController.js';
import { generateApiKeys, listApiKeys, revokeApiKey } from '../controllers/apiKeyController.js';
import { registerUser, loginUser } from '../controllers/authController.js';
import { requireSecretKey } from '../middleware/auth.js';
import { requireAuth } from '../middleware/jwtMiddleware.js';

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
// Public Route: Anyone can register (Legacy test route)
router.post('/register-legacy', registerTenant);

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

/**
 * @openapi
 * /api/tenants/keys:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Generate a new API key pair for the authenticated tenant
 *     description: |
 *       Creates a new publishable + secret key pair. The secret key is returned
 *       in plaintext **exactly once** in this response — only its bcrypt hash
 *       is stored. Treat the secret key like a password.
 *     security:
 *       - SecretKeyAuth: []
 *     responses:
 *       201:
 *         description: API keys generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "API keys generated successfully. Store your secret key securely — it will not be shown again."
 *                 api_key:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     tenant_id:
 *                       type: string
 *                       format: uuid
 *                     publishable_key:
 *                       type: string
 *                       example: "pk_live_a1b2c3d4e5f6..."
 *                     secret_key:
 *                       type: string
 *                       example: "sk_live_a1b2c3d4e5f6..."
 *                     environment:
 *                       type: string
 *                       example: "live"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized (Invalid or missing Secret Key)
 *       500:
 *         description: Internal server error
 */
// Protected Route: Requires a valid JWT Session to generate new key pairs
router.post('/keys', requireAuth, generateApiKeys);

/**
 * @openapi
 * /api/tenants/keys:
 *   get:
 *     tags:
 *       - Tenants
 *     summary: List all API keys for the authenticated tenant
 *     security:
 *       - SecretKeyAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved keys
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// Protected Route: Retrieve existing keys via JWT Session
router.get('/keys', requireAuth, listApiKeys);

/**
 * @openapi
 * /api/tenants/keys/{keyId}:
 *   delete:
 *     tags:
 *       - Tenants
 *     summary: Revoke an API key
 *     security:
 *       - SecretKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the API key to revoke
 *     responses:
 *       200:
 *         description: Successfully revoked the key
 *       400:
 *         description: Bad request (missing keyId)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Key not found or does not belong to tenant
 *       500:
 *         description: Internal server error
 */
// Protected Route: Revoke a specific key via JWT Session
router.delete('/keys/:keyId', requireAuth, revokeApiKey);

export default router;