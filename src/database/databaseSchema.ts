import { type SQLiteDatabase } from "expo-sqlite"
import { MigrationManager, allMigrations } from "./migrations"

/**
 * Initialize database using migrations
 * This is the new preferred method that handles schema versioning
 */
export async function initializeDatabase(database: SQLiteDatabase) {
  const migrationManager = new MigrationManager(database, allMigrations);

  try {
    const info = await migrationManager.getInfo();
    console.log(info);

    if (info.needsMigration) {
      console.log(`Running ${info.pendingMigrations.length} pending migration(s)...`);
      const results = await migrationManager.migrate();

      const failed = results.find(r => !r.success);
      if (failed) {
        throw new Error(`Migration ${failed.version} failed: ${failed.error}`);
      }

      console.log('Database migrations completed successfully');
    }

  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Legacy initialization function (deprecated)
 * Kept for reference, but should not be used
 * @deprecated Use initializeDatabase() which uses migrations
 */
export async function initializeDatabaseLegacy(database: SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS centro_custo_estruturas (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      nome text NOT NULL,
      centro_custo_id text NOT NULL,
      FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
    );
    CREATE INDEX IF NOT EXISTS cce_centro_custo_id_idx ON centro_custo_estruturas (centro_custo_id);
    CREATE TABLE IF NOT EXISTS centro_custos (
      id text PRIMARY KEY NOT NULL,
      nome text NOT NULL,
      synced_at text NULL
    );
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
    CREATE TABLE IF NOT EXISTS checklist_estrutura_riscos (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      checklist_estrutura_id integer NOT NULL,
      nome text NULL
    );
    CREATE INDEX IF NOT EXISTS cei_checklist_estrutura_id_idx ON checklist_estrutura_riscos (checklist_estrutura_id);
    CREATE TABLE IF NOT EXISTS checklist_estrutura_controle_riscos (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      checklist_estrutura_id integer NOT NULL,
      checklist_estrutura_risco_id integer NOT NULL,
      nome text NULL
    );
    CREATE INDEX IF NOT EXISTS cei_checklist_estrutura_id_idx ON checklist_estrutura_controle_riscos (checklist_estrutura_id);
    CREATE INDEX IF NOT EXISTS cei_checklist_estrutura_risco_id_idx ON checklist_estrutura_controle_riscos (checklist_estrutura_risco_id);
    CREATE TABLE IF NOT EXISTS checklist_grupos (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      nome text NOT NULL,
      nome_interno text
    );
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
    CREATE TABLE IF NOT EXISTS checklist_realizado_funcionarios (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      checklist_realizado_id integer NOT NULL,
      funcionario_cpf text NOT NULL,
      assinatura text,
      FOREIGN KEY (checklist_realizado_id) REFERENCES checklist_realizados(id) ON UPDATE no action ON DELETE no action,
      FOREIGN KEY (funcionario_cpf) REFERENCES funcionarios(cpf) ON UPDATE no action ON DELETE no action
    );
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
    CREATE TABLE IF NOT EXISTS checklist_realizado_apr_riscos (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      checklist_realizado_id integer NOT NULL,
      checklist_estrutura_risco_id integer NOT NULL,
      FOREIGN KEY (checklist_realizado_id) REFERENCES checklist_realizados(id) ON UPDATE no action ON DELETE no action,
      FOREIGN KEY (checklist_estrutura_risco_id) REFERENCES checklist_estrutura_riscos(id) ON UPDATE no action ON DELETE no action
    );
    CREATE INDEX IF NOT EXISTS crr_checklist_realizado_id_idx ON checklist_realizado_apr_riscos (checklist_realizado_id);
    CREATE INDEX IF NOT EXISTS crr_checklist_estrutura_risco_id_idx ON checklist_realizado_apr_riscos (checklist_estrutura_risco_id);
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
    CREATE TABLE IF NOT EXISTS funcionarios (
      cpf text PRIMARY KEY NOT NULL,
      nome text NOT NULL,
      matricula text NOT NULL,
      cargo_nome text NOT NULL,
      centro_custo_id text NOT NULL,
      FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
    );
    CREATE TABLE IF NOT EXISTS localidade_cidades (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      nome text NOT NULL,
      centro_custo_id text NOT NULL,
      FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
    );
    CREATE INDEX IF NOT EXISTS lc_centro_custo_id_idx ON localidade_cidades (centro_custo_id);
    CREATE TABLE IF NOT EXISTS veiculos (
      id text PRIMARY KEY NOT NULL,
      nome text NOT NULL,
      centro_custo_id text NOT NULL,
      FOREIGN KEY (centro_custo_id) REFERENCES centro_custos(id) ON UPDATE no action ON DELETE no action
    );
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
  `)
}

export async function dropTables(database: SQLiteDatabase) {
  await database.execAsync(`
    DROP TABLE IF EXISTS equipe_turno_funcionarios;
    DROP TABLE IF EXISTS equipe_turnos;
    DROP TABLE IF EXISTS centro_custo_estruturas;
    DROP TABLE IF EXISTS centro_custos;
    DROP TABLE IF EXISTS checklist_estruturas;
    DROP TABLE IF EXISTS checklist_estrutura_items;
    DROP TABLE IF EXISTS checklist_estrutura_riscos;
    DROP TABLE IF EXISTS checklist_estrutura_controle_riscos;
    DROP TABLE IF EXISTS checklist_grupos;
    DROP TABLE IF EXISTS checklist_realizados;
    DROP TABLE IF EXISTS checklist_realizado_funcionarios;
    DROP TABLE IF EXISTS checklist_realizado_items;
    DROP TABLE IF EXISTS checklist_realizado_apr_riscos;
    DROP TABLE IF EXISTS checklist_realizado_apr_controle_riscos;
    DROP TABLE IF EXISTS equipes;
    DROP TABLE IF EXISTS funcionarios;
    DROP TABLE IF EXISTS localidade_cidades;
    DROP TABLE IF EXISTS veiculos;

    -- Reset the migration version to 0 so migrations will run again
    PRAGMA user_version = 0;
  `)
}
export async function clearTables(database: SQLiteDatabase) {
  await database.execAsync(`
    DELETE FROM equipe_turno_funcionarios;
    DELETE FROM equipe_turnos;
    DELETE FROM centro_custo_estruturas;
    DELETE FROM centro_custos;
    DELETE FROM checklist_estruturas;
    DELETE FROM checklist_estrutura_items;
    DELETE FROM checklist_estrutura_riscos;
    DELETE FROM checklist_estrutura_controle_riscos;
    DELETE FROM checklist_grupos;
    DELETE FROM checklist_realizados;
    DELETE FROM checklist_realizado_funcionarios;
    DELETE FROM checklist_realizado_items;
    DELETE FROM checklist_realizado_apr_riscos;
    DELETE FROM checklist_realizado_apr_controle_riscos;
    DELETE FROM equipes;
    DELETE FROM funcionarios;
    DELETE FROM localidade_cidades;
    DELETE FROM veiculos;
  `)
}

export async function resetDatabase(database: SQLiteDatabase) {
  await dropTables(database);
  await initializeDatabase(database);
}

/**
 * Safe database initialization with error recovery
 * This function handles migration failures gracefully
 */
export async function safeInitializeDatabase(database: SQLiteDatabase) {
  try {
    await initializeDatabase(database);
  } catch (error) {
    console.error('Database initialization failed:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if this is a schema/migration error
    const isSchemaError = errorMessage.includes('no such column') ||
      errorMessage.includes('no such table') ||
      errorMessage.includes('FOREIGN KEY constraint failed') ||
      errorMessage.includes('table') ||
      errorMessage.includes('column') ||
      errorMessage.includes('prepareAsync') ||
      errorMessage.includes('Call to function') ||
      errorMessage.includes('Migration') ||
      errorMessage.includes('rejected');

    if (isSchemaError) {
      console.error('Schema/migration error detected, attempting recovery...');

      // In development, we can reset
      if (__DEV__) {
        console.log('Development mode: resetting database...');
        await resetDatabase(database);
        await initializeDatabase(database);
        console.log('Database reset and reinitialized successfully');
      } else {
        // In production, log the error and let the app handle it
        console.error('Production mode: Database migration failed. Manual intervention may be required.');
        console.error('Error details:', errorMessage);

        // Try one more time with legacy init as fallback
        console.log('Attempting fallback initialization...');
        await initializeDatabaseLegacy(database);
        console.log('Fallback initialization completed');
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get database migration info
 * Useful for debugging and displaying in settings
 */
export async function getDatabaseInfo(database: SQLiteDatabase) {
  const migrationManager = new MigrationManager(database, allMigrations);
  return await migrationManager.getInfo();
}
