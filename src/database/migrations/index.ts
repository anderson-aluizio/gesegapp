/**
 * Database Migrations Index
 *
 * This file exports all migrations in order and provides the migration manager
 * Uses SQLite's PRAGMA user_version for simple version tracking
 */

import { Migration } from './types';
import { migration_001_initial_schema } from './001_initial_schema';
import { migration_002_add_is_synced_fields } from './002_add_is_synced_fields';
import { migration_003_add_lideranca_to_equipe_turnos } from './003_add_lideranca_to_equipe_turnos';
import { migration_004_add_ordem_servico_to_checklist_realizados } from './004_add_ordem_servico_to_checklist_realizados';
import { migration_005_add_localidade_estado_id } from './005_add_localidade_estado_id';

/**
 * All migrations in sequential order
 * IMPORTANT: Always add new migrations to the end of this array
 */
export const allMigrations: Migration[] = [
    migration_001_initial_schema,
    migration_002_add_is_synced_fields,
    migration_003_add_lideranca_to_equipe_turnos,
    migration_004_add_ordem_servico_to_checklist_realizados,
    migration_005_add_localidade_estado_id,
    // Add new migrations here
];

// Re-export types and manager
export { Migration, MigrationResult } from './types';
export { MigrationManager } from './MigrationManager';
