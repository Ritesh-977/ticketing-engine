/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */

export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE tenants 
        ADD COLUMN email VARCHAR(255) UNIQUE,
        ADD COLUMN password_hash VARCHAR(255);
    `);
};

export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE tenants 
        DROP COLUMN email,
        DROP COLUMN password_hash;
    `);
};
