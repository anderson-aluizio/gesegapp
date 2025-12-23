import { Migration } from './types';

/**
 * Migration 004: Add ordem_servico field to checklist_realizados
 *
 * Adds ordem_servico column to checklist_realizados table to allow
 * users to input a service order number when creating/editing checklists.
 *
 * Tables affected:
 * - checklist_realizados: Add ordem_servico column
 */
export const migration_004_add_ordem_servico_to_checklist_realizados: Migration = {
    version: 4,
    description: 'Add ordem_servico field to checklist_realizados table',

    up: async (database) => {
        await database.execAsync(`
            ALTER TABLE checklist_realizados ADD COLUMN ordem_servico text;
        `);
    },

    down: async (database) => {
        // Note: SQLite doesn't support DROP COLUMN directly
        // For rollback, we would need to recreate the table without the column
        // This is only for development/testing purposes

        await database.execAsync(`
            CREATE TABLE checklist_realizados_backup AS
            SELECT id, checklist_grupo_id, checklist_estrutura_id, centro_custo_id,
                   localidade_cidade_id, equipe_id, veiculo_id, area,
                   is_user_declarou_conformidade, date, date_fim, observacao,
                   encarregado_cpf, supervisor_cpf, coordenador_cpf, gerente_cpf,
                   is_finalizado, created_at, finalizado_at, finalizado_by,
                   latitude, longitude, is_synced
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
                is_synced integer DEFAULT 0 NOT NULL,
                FOREIGN KEY (checklist_grupo_id) REFERENCES checklist_grupos(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (checklist_estrutura_id) REFERENCES checklist_estruturas(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (localidade_cidade_id) REFERENCES localidade_cidades(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON UPDATE no action ON DELETE no action
            );

            INSERT INTO checklist_realizados (id, checklist_grupo_id, checklist_estrutura_id, centro_custo_id,
                   localidade_cidade_id, equipe_id, veiculo_id, area,
                   is_user_declarou_conformidade, date, date_fim, observacao,
                   encarregado_cpf, supervisor_cpf, coordenador_cpf, gerente_cpf,
                   is_finalizado, created_at, finalizado_at, finalizado_by,
                   latitude, longitude, is_synced)
            SELECT id, checklist_grupo_id, checklist_estrutura_id, centro_custo_id,
                   localidade_cidade_id, equipe_id, veiculo_id, area,
                   is_user_declarou_conformidade, date, date_fim, observacao,
                   encarregado_cpf, supervisor_cpf, coordenador_cpf, gerente_cpf,
                   is_finalizado, created_at, finalizado_at, finalizado_by,
                   latitude, longitude, is_synced
            FROM checklist_realizados_backup;

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
