import { type Request, type Response } from 'express';
import { db } from '../config/database.js';
import { acquireLock, releaseLock } from '../utils/lock.js';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const { eventId } = req.params;
    const tenantId = req.tenant?.id;

    // 1. Define the unique lock key for THIS specific event
    const lockKey = `lock:event:${eventId}`;
    let lockValue: string | null = null;

    try {
        // 2. Attempt to acquire the Redis lock (Wait up to 3 seconds before timing out)
        lockValue = await acquireLock(lockKey, 3000);

        if (!lockValue) {
            // If we can't get the lock, it means thousands of people are buying at this exact second.
            res.status(429).json({ error: 'High traffic detected. Please try again in a moment.' });
            return;
        }

        // 3. Start a PostgreSQL Transaction
        await db.query('BEGIN');

        // 4. Check Inventory
        // We also use "FOR UPDATE" as a secondary Postgres-level lock, just to be absolutely bulletproof.
        const checkQuery = `
      SELECT total_inventory, status 
      FROM events 
      WHERE id = $1 AND tenant_id = $2
      FOR UPDATE;
    `;
        const eventResult = await db.query(checkQuery, [eventId, tenantId]);

        if (eventResult.rows.length === 0) {
            await db.query('ROLLBACK');
            res.status(404).json({ error: 'Event not found.' });
            return;
        }

        const event = eventResult.rows[0];

        if (event.total_inventory <= 0 || event.status === 'COMPLETED') {
            await db.query('ROLLBACK');
            res.status(400).json({ error: 'Event is completely sold out.' });
            return;
        }

        // 5. Deduct Inventory
        const updateQuery = `
      UPDATE events 
      SET total_inventory = total_inventory - 1,
          status = CASE WHEN total_inventory - 1 = 0 THEN 'COMPLETED' ELSE status END
      WHERE id = $1
      RETURNING total_inventory;
    `;
        await db.query(updateQuery, [eventId]);

        // 6. Create the Order Record
        const insertOrderQuery = `
      INSERT INTO orders (event_id, status)
      VALUES ($1, 'CONFIRMED')
      RETURNING id, status, created_at;
    `;
        const orderResult = await db.query(insertOrderQuery, [eventId]);

        // 7. Commit the Transaction (Save everything permanently)
        await db.query('COMMIT');

        res.status(201).json({
            message: 'Order successful!',
            order: orderResult.rows[0]
        });

    } catch (error) {
        // If ANYTHING goes wrong (Node crashes, Postgres errors), undo everything!
        await db.query('ROLLBACK');
        console.error('Checkout Error:', error);
        res.status(500).json({ error: 'Internal server error during checkout.' });
    } finally {
        // 8. Always release the lock, whether the order succeeded or failed
        if (lockValue) {
            await releaseLock(lockKey, lockValue);
        }
    }
};