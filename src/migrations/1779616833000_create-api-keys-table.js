/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */

export const up = (pgm) => {
    pgm.sql(`
    -- API Keys table: Stores publishable and hashed secret keys per tenant
    CREATE TABLE api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        publishable_key VARCHAR(255) UNIQUE NOT NULL,
        secret_key_hash VARCHAR(255) NOT NULL,
        environment VARCHAR(50) NOT NULL DEFAULT 'live',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Index on publishable_key for O(1) lookups during request authentication
    CREATE INDEX idx_api_keys_publishable_key ON api_keys(publishable_key);

    -- Index on tenant_id for fast retrieval of all keys belonging to a tenant
    CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
  `);
};

export const down = (pgm) => {
    pgm.sql(`
    DROP TABLE IF EXISTS api_keys;
  `);
};
