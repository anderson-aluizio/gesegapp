import { Migration } from './types';

export const migration_007_create_checklist_realizado_acao_campos: Migration = {
    version: 7,
    description: 'Create checklist_realizado_acao_campos table',

    up: async (database) => {
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS checklist_realizado_acao_campos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                acao_campo_id INTEGER NOT NULL,
                checklist_realizado_id INTEGER NOT NULL,
                quantidade REAL NOT NULL DEFAULT 0,
                FOREIGN KEY (acao_campo_id) REFERENCES acao_campos(id),
                FOREIGN KEY (checklist_realizado_id) REFERENCES checklist_realizados(id)
            );
            CREATE INDEX IF NOT EXISTS crac_checklist_realizado_id_idx ON checklist_realizado_acao_campos (checklist_realizado_id);
            CREATE INDEX IF NOT EXISTS crac_acao_campo_id_idx ON checklist_realizado_acao_campos (acao_campo_id);
        `);
    },

    down: async (database) => {
        await database.execAsync(`DROP TABLE IF EXISTS checklist_realizado_acao_campos;`);
    }
};
