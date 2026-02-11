import { Migration } from './types';

/**
 * Migration 005: Add localidade_estado_id to centro_custos and localidade_cidades
 *
 * - Adds localidade_estado_id to centro_custos (comes from backend on login)
 * - Adds localidade_estado_id to localidade_cidades (comes from sync endpoint)
 * - Replaces centro_custo_id filtering with localidade_estado_id for cidades
 */
export const migration_005_add_localidade_estado_id: Migration = {
    version: 5,
    description: 'Add localidade_estado_id to centro_custos and localidade_cidades',

    up: async (database) => {
        await database.execAsync(`
            ALTER TABLE centro_custos ADD COLUMN localidade_estado_id integer NULL;
            ALTER TABLE localidade_cidades ADD COLUMN localidade_estado_id integer NULL;
            CREATE INDEX IF NOT EXISTS lc_localidade_estado_id_idx ON localidade_cidades (localidade_estado_id);
        `);
    },

    down: async (_database) => {
        // SQLite does not support DROP COLUMN in older versions
        // These columns will remain but be unused if rolled back
    }
};
