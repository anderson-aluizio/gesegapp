import { Migration } from './types';

/**
 * Migration 003: Add liderança fields to equipe_turnos
 *
 * Adds leadership CPF fields to equipe_turnos table so that operacao users
 * only need to fill this data once when creating a turno, and it will be
 * automatically used when creating checklists.
 *
 * Tables affected:
 * - equipe_turnos: Add encarregado_cpf, supervisor_cpf, coordenador_cpf columns
 */
export const migration_003_add_lideranca_to_equipe_turnos: Migration = {
    version: 3,
    description: 'Add liderança fields (encarregado, supervisor, coordenador) to equipe_turnos table',

    up: async (database) => {
        await database.execAsync(`
            -- Add liderança fields to equipe_turnos
            ALTER TABLE equipe_turnos ADD COLUMN encarregado_cpf text;
            ALTER TABLE equipe_turnos ADD COLUMN supervisor_cpf text;
            ALTER TABLE equipe_turnos ADD COLUMN coordenador_cpf text;
        `);
    },

    down: async (database) => {
        // Note: SQLite doesn't support DROP COLUMN directly
        // For rollback, we would need to recreate the table without the columns
        // This is only for development/testing purposes

        await database.execAsync(`
            CREATE TABLE equipe_turnos_backup AS
            SELECT id, equipe_id, date, veiculo_id, created_at, is_synced
            FROM equipe_turnos;

            DROP TABLE equipe_turnos;

            CREATE TABLE equipe_turnos (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                equipe_id integer NOT NULL,
                date text NOT NULL,
                veiculo_id text NOT NULL,
                created_at text NOT NULL,
                is_synced integer DEFAULT 0 NOT NULL,
                FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON UPDATE no action ON DELETE no action
            );

            INSERT INTO equipe_turnos (id, equipe_id, date, veiculo_id, created_at, is_synced)
            SELECT id, equipe_id, date, veiculo_id, created_at, is_synced
            FROM equipe_turnos_backup;

            DROP TABLE equipe_turnos_backup;

            CREATE INDEX IF NOT EXISTS et_equipe_id_idx ON equipe_turnos (equipe_id);
            CREATE INDEX IF NOT EXISTS et_date_idx ON equipe_turnos (date);
            CREATE INDEX IF NOT EXISTS et_veiculo_id_idx ON equipe_turnos (veiculo_id);
            CREATE INDEX IF NOT EXISTS et_is_synced_idx ON equipe_turnos (is_synced);
        `);
    }
};
