/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */

export const up = (pgm) => {
    pgm.sql(`
    -- 1. Tenants Table (The external developers)
    CREATE TABLE tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        publishable_key VARCHAR(255) UNIQUE NOT NULL,
        secret_key_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Events Table (The flash sales)
    CREATE TABLE events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        total_inventory INTEGER NOT NULL CHECK (total_inventory >= 0),
        status VARCHAR(50) DEFAULT 'DRAFT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Orders Table (The transactions)
    CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id),
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        idempotency_key VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create Indexes for fast lookups
    CREATE INDEX idx_events_tenant_id ON events(tenant_id);
    CREATE INDEX idx_orders_event_id ON orders(event_id);
  `);
};

export const down = (pgm) => {
    pgm.sql(`
    DROP TABLE orders;
    DROP TABLE events;
    DROP TABLE tenants;
  `);
};