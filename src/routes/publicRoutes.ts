import express from 'express';
import { getEventInventory } from '../controllers/eventController.js';
import { requirePublishableKey } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply the publishable key middleware to all public routes
router.use(requirePublishableKey);

// GET /api/public/inventory/:eventId
router.get('/inventory/:eventId', getEventInventory);

export default router;