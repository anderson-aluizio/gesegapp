import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Represents a single database migration
 */
export interface Migration {
    /**
     * Unique version number for this migration
     * Must be sequential: 1, 2, 3, etc.
     */
    version: number;

    /**
     * Human-readable description of what this migration does
     * Example: "Add latitude/longitude to checklist_realizados"
     */
    description: string;

    /**
     * Function that applies the migration (forward)
     * This should be idempotent - safe to run multiple times
     */
    up: (database: SQLiteDatabase) => Promise<void>;

    /**
     * Optional function to rollback the migration (backward)
     * Used for development/testing, not typically in production
     */
    down?: (database: SQLiteDatabase) => Promise<void>;
}

/**
 * Migration execution result
 */
export interface MigrationResult {
    version: number;
    description: string;
    success: boolean;
    error?: string;
    duration: number;
}
