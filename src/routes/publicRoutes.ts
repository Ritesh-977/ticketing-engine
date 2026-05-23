import express from 'express';
import { getEventInventory } from '../controllers/eventController.js';
import { requirePublishableKey } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply the publishable key middleware to all public routes
router.use(requirePublishableKey);

/**
 * @openapi
 * /api/public/inventory/{eventId}:
 *   get:
 *     tags:
 *       - Inventory (Public)
 *     summary: Get public inventory count for a specific event
 *     security:
 *       - PublishableKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the event
 *     responses:
 *       200:
 *         description: Event inventory details
 *       401:
 *         description: Unauthorized (Invalid Publishable Key)
 *       404:
 *         description: Event not found
 */
router.get('/inventory/:eventId', getEventInventory);

export default router;