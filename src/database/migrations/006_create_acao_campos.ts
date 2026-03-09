import { Migration } from './types';

export const migration_006_create_acao_campos: Migration = {
    version: 6,
    description: 'Create acao_campos table',

    up: async (database) => {
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS acao_campos (
                id INTEGER PRIMARY KEY,
                grupo_caderno_preco_id TEXT,
                caderno_preco_id TEXT,
                centro_custo_id TEXT NOT NULL,
                processo_id TEXT,
                tipo_servico_id INTEGER,
                tipo_acao TEXT,
                nome TEXT,
                valor REAL,
                codigo_descricao TEXT
            );
            CREATE INDEX IF NOT EXISTS ac_centro_custo_id_idx ON acao_campos (centro_custo_id);
        `);
    },

    down: async (database) => {
        await database.execAsync(`DROP TABLE IF EXISTS acao_campos;`);
    }
};
