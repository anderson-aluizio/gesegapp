/**
 * Migration Template
 *
 * Copy this file and rename it following the pattern: XXX_description.ts
 * Where XXX is the next sequential number (e.g., 002, 003, etc.)
 *
 * Example: 002_add_user_preferences.ts
 */

import { Migration } from './types';

/**
 * Migration XXX: [Brief description of what this migration does]
 *
 * Detailed description:
 * - What tables/columns are being added/modified
 * - Why this change is needed
 * - Any data transformations
 * - Performance considerations
 */
export const migration_XXX_description: Migration = {
    /**
     * Version number - MUST be sequential
     * Check existing migrations and use the next number
     */
    version: 999,  // CHANGE THIS

    /**
     * Description shown in logs and admin UI
     * Should be clear and concise
     */
    description: 'Brief description of migration',  // CHANGE THIS

    /**
     * Apply the migration (forward direction)
     *
     * This function should:
     * - Be idempotent (safe to run multiple times)
     * - Use IF NOT EXISTS / IF EXISTS clauses
     * - Create indexes for foreign keys
     * - Preserve existing data
     * - Complete quickly (< 10 seconds for most cases)
     *
     * @param database - SQLite database instance
     */
    up: async (database) => {
        // Example: Adding a new table
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS example_table (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                name text NOT NULL,
                description text,
                created_at text NOT NULL DEFAULT (datetime('now')),
                updated_at text
            );

            -- Add indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_example_table_name ON example_table (name);
        `);

        // Example: Adding a column to existing table
        // Note: SQLite has limited ALTER TABLE support
        // await database.execAsync(`
        //     ALTER TABLE existing_table
        //     ADD COLUMN new_column text;
        // `);

        // Example: Creating a foreign key relationship
        // await database.execAsync(`
        //     CREATE TABLE IF NOT EXISTS related_table (
        //         id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        //         example_id integer NOT NULL,
        //         data text,
        //         FOREIGN KEY (example_id) REFERENCES example_table(id) ON DELETE CASCADE
        //     );
        //     CREATE INDEX IF NOT EXISTS idx_related_table_example_id ON related_table (example_id);
        // `);

        // Example: Updating existing data
        // await database.execAsync(`
        //     UPDATE example_table
        //     SET updated_at = datetime('now')
        //     WHERE updated_at IS NULL;
        // `);
    },

    /**
     * Rollback the migration (backward direction)
     *
     * OPTIONAL - Only needed for development/testing
     * Will throw error in production mode
     *
     * This function should:
     * - Undo everything done in up()
     * - Drop tables in reverse order (respect foreign keys)
     * - Be careful about data loss
     *
     * @param database - SQLite database instance
     */
    down: async (database) => {
        // Example: Dropping tables in reverse order
        await database.execAsync(`
            -- Drop related tables first (foreign keys)
            -- DROP TABLE IF EXISTS related_table;

            -- Then drop main table
            DROP TABLE IF EXISTS example_table;
        `);

        // Note: Dropping columns is not supported in SQLite
        // You would need to recreate the table without the column
    }
};

/**
 * CHECKLIST BEFORE COMMITTING:
 *
 * [ ] Changed version number to next sequential number
 * [ ] Updated migration name and export
 * [ ] Wrote clear description
 * [ ] Added IF NOT EXISTS / IF EXISTS clauses
 * [ ] Created indexes for foreign keys
 * [ ] Tested on fresh database
 * [ ] Tested on existing database (upgrade scenario)
 * [ ] Tested rollback (if provided)
 * [ ] Added to allMigrations array in index.ts
 * [ ] Verified migration completes in reasonable time
 * [ ] Added comments explaining complex logic
 * [ ] Considered backward compatibility
 * [ ] Reviewed by another developer
 */

/**
 * TESTING EXAMPLE:
 *
 * import { testMigration, logMigrationStatus } from './migrationUtils';
 *
 * // Check current status
 * await logMigrationStatus(database);
 *
 * // Test this migration
 * const result = await testMigration(database, XXX);
 * console.log('Migration test:', result.success ? 'PASSED' : 'FAILED');
 *
 * // Verify schema
 * const tables = await database.getAllAsync(
 *     "SELECT name FROM sqlite_master WHERE type='table'"
 * );
 * console.log('Tables:', tables);
 */
