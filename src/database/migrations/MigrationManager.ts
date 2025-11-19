import { SQLiteDatabase } from 'expo-sqlite';
import { Migration, MigrationResult } from './types';

/**
 * MigrationManager handles database schema versioning and migrations
 *
 * Uses SQLite's built-in PRAGMA user_version for version tracking
 *
 * Features:
 * - Tracks database version using PRAGMA user_version
 * - Ensures migrations run in order
 * - Provides rollback capability
 * - Handles migration errors gracefully
 * - Supports both fresh installs and upgrades
 */
export class MigrationManager {
    private database: SQLiteDatabase;
    private migrations: Migration[];

    constructor(database: SQLiteDatabase, migrations: Migration[]) {
        this.database = database;
        this.migrations = this.validateAndSortMigrations(migrations);
    }

    /**
     * Validates that migrations are properly numbered and sorted
     */
    private validateAndSortMigrations(migrations: Migration[]): Migration[] {
        const sorted = [...migrations].sort((a, b) => a.version - b.version);

        // Validate sequential versions
        for (let i = 0; i < sorted.length; i++) {
            const expectedVersion = i + 1;
            if (sorted[i].version !== expectedVersion) {
                throw new Error(
                    `Invalid migration version sequence. Expected version ${expectedVersion}, got ${sorted[i].version}`
                );
            }
        }

        return sorted;
    }

    /**
     * Get the current database schema version using PRAGMA user_version
     */
    async getCurrentVersion(): Promise<number> {
        const result = await this.database.getFirstAsync<{ user_version: number }>(
            'PRAGMA user_version'
        );

        return result?.user_version ?? 0;
    }

    /**
     * Set the database version using PRAGMA user_version
     */
    private async setCurrentVersion(version: number): Promise<void> {
        await this.database.execAsync(`PRAGMA user_version = ${version}`);
    }

    /**
     * Get pending migrations that haven't been applied yet
     */
    async getPendingMigrations(): Promise<Migration[]> {
        const currentVersion = await this.getCurrentVersion();
        return this.migrations.filter(m => m.version > currentVersion);
    }

    /**
     * Check if database needs migration
     */
    async needsMigration(): Promise<boolean> {
        const currentVersion = await this.getCurrentVersion();
        const latestVersion = this.migrations[this.migrations.length - 1]?.version ?? 0;
        return currentVersion < latestVersion;
    }

    /**
     * Apply a single migration
     */
    private async applyMigration(migration: Migration): Promise<MigrationResult> {
        const startTime = performance.now();

        try {
            console.log(`Applying migration ${migration.version}: ${migration.description}`);

            // Run migration in a transaction for safety
            await this.database.withTransactionAsync(async () => {
                await migration.up(this.database);

                // Update version using PRAGMA
                await this.setCurrentVersion(migration.version);
            });

            const duration = performance.now() - startTime;
            console.log(`Migration ${migration.version} completed in ${Math.round(duration)}ms`);

            return {
                version: migration.version,
                description: migration.description,
                success: true,
                duration: Math.round(duration)
            };

        } catch (error) {
            const duration = performance.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            console.error(`Migration ${migration.version} failed:`, errorMessage);

            return {
                version: migration.version,
                description: migration.description,
                success: false,
                error: errorMessage,
                duration: Math.round(duration)
            };
        }
    }

    /**
     * Run all pending migrations
     * Returns results for each migration attempted
     */
    async migrate(): Promise<MigrationResult[]> {
        const pendingMigrations = await this.getPendingMigrations();

        if (pendingMigrations.length === 0) {
            console.log('Database is up to date, no migrations needed');
            return [];
        }

        console.log(`Running ${pendingMigrations.length} pending migration(s)...`);

        const results: MigrationResult[] = [];

        for (const migration of pendingMigrations) {
            const result = await this.applyMigration(migration);
            results.push(result);

            // Stop if migration failed
            if (!result.success) {
                console.error('Migration failed, stopping migration process');
                break;
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log(`Migration summary: ${successCount} succeeded, ${failCount} failed`);

        return results;
    }

    /**
     * Migrate to a specific version (useful for testing)
     * @param targetVersion Version to migrate to
     */
    async migrateToVersion(targetVersion: number): Promise<MigrationResult[]> {
        const currentVersion = await this.getCurrentVersion();

        if (targetVersion === currentVersion) {
            console.log(`Already at version ${targetVersion}`);
            return [];
        }

        if (targetVersion < currentVersion) {
            throw new Error('Downgrading is not supported in production. Use rollback for testing.');
        }

        const migrationsToRun = this.migrations.filter(
            m => m.version > currentVersion && m.version <= targetVersion
        );

        const results: MigrationResult[] = [];

        for (const migration of migrationsToRun) {
            const result = await this.applyMigration(migration);
            results.push(result);

            if (!result.success) {
                break;
            }
        }

        return results;
    }

    /**
     * Rollback the last migration (for development/testing only)
     * WARNING: This can cause data loss!
     */
    async rollback(): Promise<void> {
        if (!__DEV__) {
            throw new Error('Rollback is only available in development mode');
        }

        const currentVersion = await this.getCurrentVersion();

        if (currentVersion === 0) {
            console.log('No migrations to rollback');
            return;
        }

        const migration = this.migrations.find(m => m.version === currentVersion);

        if (!migration) {
            throw new Error(`Migration for version ${currentVersion} not found`);
        }

        if (!migration.down) {
            throw new Error(`Migration ${currentVersion} does not have a rollback function`);
        }

        console.log(`Rolling back migration ${migration.version}: ${migration.description}`);

        await this.database.withTransactionAsync(async () => {
            await migration.down!(this.database);

            // Update version to previous version
            await this.setCurrentVersion(currentVersion - 1);
        });

        console.log(`Rolled back to version ${currentVersion - 1}`);
    }

    /**
     * Reset all migrations (for development/testing only)
     * WARNING: This drops all data!
     */
    async reset(): Promise<void> {
        if (!__DEV__) {
            throw new Error('Reset is only available in development mode');
        }

        console.log('Resetting all migrations...');

        // Drop all tables
        const tables = await this.database.getAllAsync<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );

        await this.database.withTransactionAsync(async () => {
            for (const table of tables) {
                await this.database.runAsync(`DROP TABLE IF EXISTS ${table.name}`);
            }

            // Reset version to 0
            await this.setCurrentVersion(0);
        });

        console.log('Database reset complete');
    }

    /**
     * Get migration info for display/debugging
     */
    async getInfo(): Promise<{
        currentVersion: number;
        latestVersion: number;
        pendingMigrations: Migration[];
        needsMigration: boolean;
    }> {
        const currentVersion = await this.getCurrentVersion();
        const latestVersion = this.migrations[this.migrations.length - 1]?.version ?? 0;
        const pendingMigrations = await this.getPendingMigrations();
        const needsMigration = await this.needsMigration();

        return {
            currentVersion,
            latestVersion,
            pendingMigrations,
            needsMigration
        };
    }
}
