import express from 'express';
import { createEvent, getEvents } from '../controllers/eventController.js';
import { requireSecretKey } from '../middleware/authMiddleware.js';

const router = express.Router();

// ALL event routes require the external developer to be authenticated
router.use(requireSecretKey);

// POST /api/events -> Create an event
router.post('/', createEvent);

// GET /api/events -> List all events for this tenant
router.get('/', getEvents);

export default router;