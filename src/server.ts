import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import './config/database.js';
import './config/redis.js';

// Import routes
import tenantRoutes from './routes/tenantRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { setupSwagger } from './config/swagger.js';
import { mq } from './config/rabbitmq.js';
import { startNotificationWorker } from './workers/notificationWorker.js';


// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Security and Parsing Middleware
app.use(helmet()); // Secures HTTP headers
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Parses incoming JSON payloads

// Register API Routes
app.use('/api/tenants', tenantRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/public', publicRoutes);

// Health Check Endpoint (To verify the server is alive)
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Ticketing Engine API is running',
        timestamp: new Date().toISOString()
    });
});

// Initialize Swagger Documentation UI
setupSwagger(app);

// Start the server
app.listen(PORT, async () => {
    console.log(`🚀 API Gateway is running on http://localhost:${PORT}`);
    console.log(`📚 Swagger Docs available at http://localhost:${PORT}/api-docs`);

    // Initialize RabbitMQ and start the background worker
    await mq.connect();
    startNotificationWorker();
});