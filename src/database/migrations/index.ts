/**
 * Database Migrations Index
 *
 * This file exports all migrations in order and provides the migration manager
 * Uses SQLite's PRAGMA user_version for simple version tracking
 */

import { Migration } from './types';
import { migration_001_initial_schema } from './001_initial_schema';

/**
 * All migrations in sequential order
 * IMPORTANT: Always add new migrations to the end of this array
 */
export const allMigrations: Migration[] = [
    migration_001_initial_schema,
    // Add new migrations here
    // migration_002_add_some_feature,
    // migration_003_modify_table,
];

// Re-export types and manager
export { Migration, MigrationResult } from './types';
export { MigrationManager } from './MigrationManager';
