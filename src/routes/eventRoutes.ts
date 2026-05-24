import express from 'express';
import { createEvent, getEvents } from '../controllers/eventController.js';
import { requireSecretKey } from '../middleware/auth.js';

const router = express.Router();

router.use(requireSecretKey);

/**
 * @openapi
 * /api/events:
 *   post:
 *     tags:
 *       - Events (Admin)
 *     summary: Create a new Flash Sale Event
 *     security:
 *       - SecretKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - total_inventory
 *             properties:
 *               name:
 *                 type: string
 *                 example: Winter Hoodie Drop 2026
 *               total_inventory:
 *                 type: integer
 *                 example: 500
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (Invalid Secret Key)
 */
router.post('/', createEvent);

/**
 * @openapi
 * /api/events:
 *   get:
 *     tags:
 *       - Events (Admin)
 *     summary: Get all events for the authenticated tenant
 *     security:
 *       - SecretKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of events
 */
router.get('/', getEvents);

export default router;