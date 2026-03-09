import { Migration } from './types';

export const migration_008_add_tipo_servico_nome_to_acao_campos: Migration = {
    version: 8,
    description: 'Add tipo_servico_nome column to acao_campos',

    up: async (database) => {
        await database.execAsync(`
            ALTER TABLE acao_campos ADD COLUMN tipo_servico_nome TEXT;
        `);
    },

    down: async (_database) => {
        // SQLite does not support DROP COLUMN in older versions
    }
};
