import { Migration } from './types';

/**
 * Migration 002: Add is_synced fields to equipe_turnos and checklist_realizados
 *
 * Adds is_synced column to track which records have been synchronized with the server.
 * This allows keeping records locally even after sync, preventing issues when
 * users continue creating checklists on the same day.
 *
 * Tables affected:
 * - equipe_turnos: Add is_synced column (default 0)
 * - checklist_realizados: Add is_synced column (default 0)
 */
export const migration_002_add_is_synced_fields: Migration = {
    version: 2,
    description: 'Add is_synced field to equipe_turnos and checklist_realizados tables',

    up: async (database) => {
        await database.execAsync(`
            -- Add is_synced to equipe_turnos
            ALTER TABLE equipe_turnos ADD COLUMN is_synced integer DEFAULT 0 NOT NULL;

            -- Add is_synced to checklist_realizados
            ALTER TABLE checklist_realizados ADD COLUMN is_synced integer DEFAULT 0 NOT NULL;

            -- Create indexes for faster queries on is_synced
            CREATE INDEX IF NOT EXISTS et_is_synced_idx ON equipe_turnos (is_synced);
            CREATE INDEX IF NOT EXISTS cr_is_synced_idx ON checklist_realizados (is_synced);
        `);
    },

    down: async (database) => {
        // Note: SQLite doesn't support DROP COLUMN directly
        // For rollback, we would need to recreate the tables without the column
        // This is only for development/testing purposes

        // Drop indexes first
        await database.execAsync(`
            DROP INDEX IF EXISTS et_is_synced_idx;
            DROP INDEX IF EXISTS cr_is_synced_idx;
        `);

        // Recreate equipe_turnos without is_synced
        await database.execAsync(`
            CREATE TABLE equipe_turnos_backup AS SELECT id, equipe_id, date, veiculo_id, created_at FROM equipe_turnos;
            DROP TABLE equipe_turnos;
            CREATE TABLE equipe_turnos (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                equipe_id integer NOT NULL,
                date text NOT NULL,
                veiculo_id text NOT NULL,
                created_at text NOT NULL,
                FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON UPDATE no action ON DELETE no action
            );
            INSERT INTO equipe_turnos (id, equipe_id, date, veiculo_id, created_at) SELECT id, equipe_id, date, veiculo_id, created_at FROM equipe_turnos_backup;
            DROP TABLE equipe_turnos_backup;
            CREATE INDEX IF NOT EXISTS et_equipe_id_idx ON equipe_turnos (equipe_id);
            CREATE INDEX IF NOT EXISTS et_date_idx ON equipe_turnos (date);
            CREATE INDEX IF NOT EXISTS et_veiculo_id_idx ON equipe_turnos (veiculo_id);
        `);

        // Recreate checklist_realizados without is_synced
        await database.execAsync(`
            CREATE TABLE checklist_realizados_backup AS
            SELECT id, checklist_grupo_id, checklist_estrutura_id, centro_custo_id, localidade_cidade_id,
                   equipe_id, veiculo_id, area, is_user_declarou_conformidade, date, date_fim, observacao,
                   encarregado_cpf, supervisor_cpf, coordenador_cpf, gerente_cpf, is_finalizado,
                   created_at, finalizado_at, finalizado_by, latitude, longitude
            FROM checklist_realizados;

            DROP TABLE checklist_realizados;

            CREATE TABLE checklist_realizados (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                checklist_grupo_id integer NOT NULL,
                checklist_estrutura_id integer NOT NULL,
                centro_custo_id text NOT NULL,
                localidade_cidade_id integer NOT NULL,
                equipe_id integer NOT NULL,
                veiculo_id text NOT NULL,
                area text NOT NULL,
                is_user_declarou_conformidade integer DEFAULT 0 NOT NULL,
                date text NOT NULL,
                date_fim text,
                observacao text,
                encarregado_cpf text,
                supervisor_cpf text,
                coordenador_cpf text,
                gerente_cpf text,
                is_finalizado integer DEFAULT 0 NOT NULL,
                created_at text NOT NULL,
                finalizado_at text,
                finalizado_by integer,
                latitude real,
                longitude real,
                FOREIGN KEY (checklist_grupo_id) REFERENCES checklist_grupos(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (checklist_estrutura_id) REFERENCES checklist_estruturas(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (localidade_cidade_id) REFERENCES localidade_cidades(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON UPDATE no action ON DELETE no action
            );

            INSERT INTO checklist_realizados
            SELECT * FROM checklist_realizados_backup;

            DROP TABLE checklist_realizados_backup;

            CREATE INDEX IF NOT EXISTS cr_checklist_grupo_id_idx ON checklist_realizados (checklist_grupo_id);
            CREATE INDEX IF NOT EXISTS cr_checklist_estrutura_id_idx ON checklist_realizados (checklist_estrutura_id);
            CREATE INDEX IF NOT EXISTS cr_centro_custo_id_idx ON checklist_realizados (centro_custo_id);
            CREATE INDEX IF NOT EXISTS cr_localidade_cidade_id_idx ON checklist_realizados (localidade_cidade_id);
            CREATE INDEX IF NOT EXISTS cr_equipe_id_idx ON checklist_realizados (equipe_id);
            CREATE INDEX IF NOT EXISTS cr_veiculo_id_idx ON checklist_realizados (veiculo_id);
            CREATE INDEX IF NOT EXISTS cr_date_idx ON checklist_realizados (date);
        `);
    }
};
