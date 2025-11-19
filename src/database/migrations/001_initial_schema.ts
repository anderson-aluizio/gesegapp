import { Migration } from './types';

/**
 * Migration 001: Initial Database Schema
 *
 * Creates all base tables for the application:
 * - Centro de custo (cost centers)
 * - Checklist structures and items
 * - Checklists realizados (completed checklists)
 * - Equipes (teams) and turnos (shifts)
 * - Funcionários (employees)
 * - Localidades (locations)
 * - Veículos (vehicles)
 */
export const migration_001_initial_schema: Migration = {
    version: 1,
    description: 'Create initial database schema with all base tables',

    up: async (database) => {
        await database.execAsync(`
            -- Centro de Custo (Cost Centers)
            CREATE TABLE IF NOT EXISTS centro_custos (
                id text PRIMARY KEY NOT NULL,
                nome text NOT NULL,
                synced_at text NULL
            );

            -- Centro de Custo Estruturas
            CREATE TABLE IF NOT EXISTS centro_custo_estruturas (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                nome text NOT NULL,
                centro_custo_id text NOT NULL,
                FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
            );
            CREATE INDEX IF NOT EXISTS cce_centro_custo_id_idx ON centro_custo_estruturas (centro_custo_id);

            -- Checklist Grupos
            CREATE TABLE IF NOT EXISTS checklist_grupos (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                nome text NOT NULL,
                nome_interno text
            );

            -- Checklist Estruturas
            CREATE TABLE IF NOT EXISTS checklist_estruturas (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                modelo text NOT NULL,
                checklist_grupo_id integer NOT NULL,
                centro_custo_id text NOT NULL,
                is_gera_nao_conformidade integer DEFAULT 0 NOT NULL,
                is_respostas_obrigatoria integer DEFAULT 0 NOT NULL,
                FOREIGN KEY (checklist_grupo_id) REFERENCES checklist_grupos(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
            );
            CREATE INDEX IF NOT EXISTS ce_centro_custo_id_idx ON checklist_estruturas (centro_custo_id);

            -- Checklist Estrutura Items
            CREATE TABLE IF NOT EXISTS checklist_estrutura_items (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                checklist_estrutura_id integer NOT NULL,
                checklist_grupo_id integer NOT NULL,
                checklist_sub_grupo text NULL,
                checklist_item_id integer NOT NULL,
                checklist_item_nome text NOT NULL,
                checklist_alternativa_id integer,
                checklist_alternativas text,
                alternativa_inconformidades text,
                is_foto_obrigatoria integer DEFAULT 0 NOT NULL,
                is_desc_nconf_required integer DEFAULT 0 NOT NULL,
                num_ordem integer NULL,
                equipamento_id integer NULL
            );
            CREATE INDEX IF NOT EXISTS cei_checklist_estrutura_id_idx ON checklist_estrutura_items (checklist_estrutura_id);
            CREATE INDEX IF NOT EXISTS cei_checklist_grupo_id_idx ON checklist_estrutura_items (checklist_grupo_id);
            CREATE INDEX IF NOT EXISTS cei_checklist_item_id_idx ON checklist_estrutura_items (checklist_item_id);
            CREATE INDEX IF NOT EXISTS cei_checklist_sub_grupo_idx ON checklist_estrutura_items (checklist_sub_grupo);
            CREATE INDEX IF NOT EXISTS cei_checklist_alternativa_id_idx ON checklist_estrutura_items (checklist_alternativa_id);
            CREATE INDEX IF NOT EXISTS cei_equipamento_id_idx ON checklist_estrutura_items (equipamento_id);
            CREATE INDEX IF NOT EXISTS cei_num_ordem_idx ON checklist_estrutura_items (num_ordem);

            -- Checklist Estrutura Riscos (APR - Análise Preliminar de Riscos)
            CREATE TABLE IF NOT EXISTS checklist_estrutura_riscos (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                checklist_estrutura_id integer NOT NULL,
                nome text NULL
            );
            CREATE INDEX IF NOT EXISTS cei_checklist_estrutura_id_idx ON checklist_estrutura_riscos (checklist_estrutura_id);

            -- Checklist Estrutura Controle de Riscos
            CREATE TABLE IF NOT EXISTS checklist_estrutura_controle_riscos (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                checklist_estrutura_id integer NOT NULL,
                checklist_estrutura_risco_id integer NOT NULL,
                nome text NULL
            );
            CREATE INDEX IF NOT EXISTS cei_checklist_estrutura_id_idx ON checklist_estrutura_controle_riscos (checklist_estrutura_id);
            CREATE INDEX IF NOT EXISTS cei_checklist_estrutura_risco_id_idx ON checklist_estrutura_controle_riscos (checklist_estrutura_risco_id);

            -- Funcionários (Employees)
            CREATE TABLE IF NOT EXISTS funcionarios (
                cpf text PRIMARY KEY NOT NULL,
                nome text NOT NULL,
                matricula text NOT NULL,
                cargo_nome text NOT NULL,
                centro_custo_id text NOT NULL,
                FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
            );

            -- Localidade Cidades
            CREATE TABLE IF NOT EXISTS localidade_cidades (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                nome text NOT NULL,
                centro_custo_id text NOT NULL,
                FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
            );
            CREATE INDEX IF NOT EXISTS lc_centro_custo_id_idx ON localidade_cidades (centro_custo_id);

            -- Equipes (Teams)
            CREATE TABLE IF NOT EXISTS equipes (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                nome text NOT NULL,
                centro_custo_id text NOT NULL,
                encarregado_cpf text,
                supervisor_cpf text,
                coordenador_cpf text,
                gerente_cpf text,
                FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
            );
            CREATE INDEX IF NOT EXISTS e_centro_custo_id_idx ON equipes (centro_custo_id);

            -- Veículos (Vehicles)
            CREATE TABLE IF NOT EXISTS veiculos (
                id text PRIMARY KEY NOT NULL,
                nome text NOT NULL,
                centro_custo_id text NOT NULL,
                FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
            );

            -- Equipe Turnos (Team Shifts)
            CREATE TABLE IF NOT EXISTS equipe_turnos (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                equipe_id integer NOT NULL,
                date text NOT NULL,
                veiculo_id text NOT NULL,
                created_at text NOT NULL,
                FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON UPDATE no action ON DELETE no action
            );
            CREATE INDEX IF NOT EXISTS et_equipe_id_idx ON equipe_turnos (equipe_id);
            CREATE INDEX IF NOT EXISTS et_date_idx ON equipe_turnos (date);
            CREATE INDEX IF NOT EXISTS et_veiculo_id_idx ON equipe_turnos (veiculo_id);

            -- Equipe Turno Funcionários
            CREATE TABLE IF NOT EXISTS equipe_turno_funcionarios (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                equipe_turno_id integer NOT NULL,
                funcionario_cpf text NOT NULL,
                is_lider integer DEFAULT 0 NOT NULL,
                FOREIGN KEY (equipe_turno_id) REFERENCES equipe_turnos(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (funcionario_cpf) REFERENCES funcionarios(cpf) ON UPDATE no action ON DELETE no action
            );
            CREATE INDEX IF NOT EXISTS etf_equipe_turno_id_idx ON equipe_turno_funcionarios (equipe_turno_id);
            CREATE INDEX IF NOT EXISTS etf_funcionario_cpf_idx ON equipe_turno_funcionarios (funcionario_cpf);

            -- Checklist Realizados (Completed Checklists)
            CREATE TABLE IF NOT EXISTS checklist_realizados (
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
            CREATE INDEX IF NOT EXISTS cr_checklist_grupo_id_idx ON checklist_realizados (checklist_grupo_id);
            CREATE INDEX IF NOT EXISTS cr_checklist_estrutura_id_idx ON checklist_realizados (checklist_estrutura_id);
            CREATE INDEX IF NOT EXISTS cr_centro_custo_id_idx ON checklist_realizados (centro_custo_id);
            CREATE INDEX IF NOT EXISTS cr_localidade_cidade_id_idx ON checklist_realizados (localidade_cidade_id);
            CREATE INDEX IF NOT EXISTS cr_equipe_id_idx ON checklist_realizados (equipe_id);
            CREATE INDEX IF NOT EXISTS cr_veiculo_id_idx ON checklist_realizados (veiculo_id);
            CREATE INDEX IF NOT EXISTS cr_date_idx ON checklist_realizados (date);

            -- Checklist Realizado Funcionários
            CREATE TABLE IF NOT EXISTS checklist_realizado_funcionarios (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                checklist_realizado_id integer NOT NULL,
                funcionario_cpf text NOT NULL,
                assinatura text,
                FOREIGN KEY (checklist_realizado_id) REFERENCES checklist_realizados(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (funcionario_cpf) REFERENCES funcionarios(cpf) ON UPDATE no action ON DELETE no action
            );

            -- Checklist Realizado Items
            CREATE TABLE IF NOT EXISTS checklist_realizado_items (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                checklist_realizado_id integer NOT NULL,
                checklist_estrutura_item_id integer NOT NULL,
                checklist_item_id integer NOT NULL,
                resposta text,
                inconformidade_funcionarios text,
                descricao text,
                foto_path text,
                is_respondido integer DEFAULT 0 NOT NULL,
                is_inconforme integer DEFAULT 0 NOT NULL,
                FOREIGN KEY (checklist_realizado_id) REFERENCES checklist_realizados(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (checklist_item_id) REFERENCES checklist_estrutura_items(checklist_item_id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (checklist_estrutura_item_id) REFERENCES checklist_estrutura_items(id) ON UPDATE no action ON DELETE no action
            );
            CREATE INDEX IF NOT EXISTS cri_checklist_realizado_id_idx ON checklist_realizado_items (checklist_realizado_id);
            CREATE INDEX IF NOT EXISTS cri_checklist_item_id_idx ON checklist_realizado_items (checklist_item_id);
            CREATE INDEX IF NOT EXISTS cri_checklist_estrutura_item_id_idx ON checklist_realizado_items (checklist_estrutura_item_id);

            -- Checklist Realizado APR Riscos
            CREATE TABLE IF NOT EXISTS checklist_realizado_apr_riscos (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                checklist_realizado_id integer NOT NULL,
                checklist_estrutura_risco_id integer NOT NULL,
                FOREIGN KEY (checklist_realizado_id) REFERENCES checklist_realizados(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (checklist_estrutura_risco_id) REFERENCES checklist_estrutura_riscos(id) ON UPDATE no action ON DELETE no action
            );
            CREATE INDEX IF NOT EXISTS crr_checklist_realizado_id_idx ON checklist_realizado_apr_riscos (checklist_realizado_id);
            CREATE INDEX IF NOT EXISTS crr_checklist_estrutura_risco_id_idx ON checklist_realizado_apr_riscos (checklist_estrutura_risco_id);

            -- Checklist Realizado APR Controle Riscos
            CREATE TABLE IF NOT EXISTS checklist_realizado_apr_controle_riscos (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                checklist_realizado_id integer NOT NULL,
                checklist_realizado_apr_risco_id integer NOT NULL,
                checklist_estrutura_controle_risco_id integer NOT NULL,
                FOREIGN KEY (checklist_realizado_id) REFERENCES checklist_realizados(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (checklist_realizado_apr_risco_id) REFERENCES checklist_realizado_apr_riscos(id) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (checklist_estrutura_controle_risco_id) REFERENCES checklist_estrutura_controle_riscos(id) ON UPDATE no action ON DELETE no action
            );
            CREATE INDEX IF NOT EXISTS crr_checklist_realizado_id_idx ON checklist_realizado_apr_controle_riscos (checklist_realizado_id);
            CREATE INDEX IF NOT EXISTS crr_checklist_realizado_apr_risco_id_idx ON checklist_realizado_apr_controle_riscos (checklist_realizado_apr_risco_id);
            CREATE INDEX IF NOT EXISTS crr_checklist_estrutura_controle_risco_id_idx ON checklist_realizado_apr_controle_riscos (checklist_estrutura_controle_risco_id);
        `);
    },

    down: async (database) => {
        // Rollback: Drop all tables in reverse order (respecting foreign keys)
        await database.execAsync(`
            DROP TABLE IF EXISTS equipe_turno_funcionarios;
            DROP TABLE IF EXISTS equipe_turnos;
            DROP TABLE IF EXISTS checklist_realizado_apr_controle_riscos;
            DROP TABLE IF EXISTS checklist_realizado_apr_riscos;
            DROP TABLE IF EXISTS checklist_realizado_items;
            DROP TABLE IF EXISTS checklist_realizado_funcionarios;
            DROP TABLE IF EXISTS checklist_realizados;
            DROP TABLE IF EXISTS checklist_estrutura_controle_riscos;
            DROP TABLE IF EXISTS checklist_estrutura_riscos;
            DROP TABLE IF EXISTS checklist_estrutura_items;
            DROP TABLE IF EXISTS checklist_estruturas;
            DROP TABLE IF EXISTS checklist_grupos;
            DROP TABLE IF EXISTS centro_custo_estruturas;
            DROP TABLE IF EXISTS veiculos;
            DROP TABLE IF EXISTS localidade_cidades;
            DROP TABLE IF EXISTS funcionarios;
            DROP TABLE IF EXISTS equipes;
            DROP TABLE IF EXISTS centro_custos;
        `);
    }
};
