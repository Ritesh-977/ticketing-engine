import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { type Application } from 'express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ticketing Engine API (TEaaS)',
            version: '1.0.0',
            description: 'A multi-tenant, high-concurrency flash-sale and ticketing engine.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                SecretKeyAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'API Key',
                    description: 'Use your Secret Key (sk_test_...) here.',
                },
                PublishableKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-publishable-key',
                    description: 'Use your Publishable Key (pk_test_...) here.',
                },
            },
        },
    },
    // This tells Swagger where to look for your documentation comments!
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
    // Hosts the interactive UI at /api-docs
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Exposes the raw JSON file for external tools (like Postman imports)
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
};