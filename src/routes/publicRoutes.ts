import express from 'express';
import { getEventInventory } from '../controllers/eventController.js';
import { createOrder } from '../controllers/orderController.js';
import { requirePublishableKey } from '../middleware/auth.js';

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

/**
 * @openapi
 * /api/public/checkout/{eventId}:
 * post:
 * tags:
 * - Checkout (Public)
 * summary: Process a ticket order safely using Redis distributed locking
 * security:
 * - PublishableKeyAuth: []
 * parameters:
 * - in: path
 * name: eventId
 * required: true
 * schema:
 * type: string
 * format: uuid
 * responses:
 * 201:
 * description: Order successful
 * 400:
 * description: Sold out
 * 429:
 * description: High traffic, lock could not be acquired
 */
router.post('/checkout/:eventId', createOrder); // <-- NEW ROUTE

export default router;