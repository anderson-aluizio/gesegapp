# Database Migrations

This directory contains all database schema migrations for the application.

## Directory Structure

```
migrations/
├── README.md                 # This file
├── types.ts                  # TypeScript types for migrations
├── MigrationManager.ts       # Core migration management logic
├── index.ts                  # Exports all migrations
├── 001_initial_schema.ts     # First migration (baseline schema)
└── XXX_description.ts        # Future migrations
```

## How Migrations Work

1. **Version Tracking**: Each migration has a unique sequential version number (1, 2, 3, etc.)
2. **Migration Table**: A `_migrations` table tracks which migrations have been applied
3. **Sequential Execution**: Migrations run in order from lowest to highest version
4. **Transactional**: Each migration runs in a transaction for safety
5. **Idempotent**: Migrations use `CREATE TABLE IF NOT EXISTS` patterns to be safe to re-run

## Creating a New Migration

### Step 1: Create the Migration File

Create a new file with the format: `XXX_description.ts`

- `XXX` = Next sequential number (e.g., `002`, `003`, etc.)
- `description` = Brief description in snake_case

Example: `002_add_user_preferences.ts`

### Step 2: Write the Migration

```typescript
import { Migration } from './types';

export const migration_002_add_user_preferences: Migration = {
    version: 2,
    description: 'Add user preferences table',

    up: async (database) => {
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                user_id text NOT NULL,
                preference_key text NOT NULL,
                preference_value text,
                created_at text NOT NULL DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS up_user_id_idx ON user_preferences (user_id);
        `);
    },

    down: async (database) => {
        // Optional: Only needed for development/testing
        await database.execAsync(`
            DROP TABLE IF EXISTS user_preferences;
        `);
    }
};
```

### Step 3: Register the Migration

Add your migration to `index.ts`:

```typescript
import { migration_002_add_user_preferences } from './002_add_user_preferences';

export const allMigrations: Migration[] = [
    migration_001_initial_schema,
    migration_002_add_user_preferences, // Add here
];
```

## Migration Best Practices

### DO ✅

1. **Use Transactions**: The MigrationManager wraps each migration in a transaction automatically
2. **Be Idempotent**: Use `IF NOT EXISTS` / `IF EXISTS` clauses
3. **Sequential Versions**: Version numbers must be sequential (1, 2, 3...)
4. **Clear Descriptions**: Write descriptive migration names and descriptions
5. **Test First**: Test migrations on development data before deploying
6. **Create Indexes**: Add indexes for foreign keys and frequently queried columns
7. **Add Comments**: Document complex migrations with SQL comments

### DON'T ❌

1. **Don't Modify Existing Migrations**: Once a migration is released, never change it
2. **Don't Skip Versions**: All users must run all migrations in order
3. **Don't Delete Data Without Backup**: Always have a backup strategy
4. **Don't Use Raw SQL Without Validation**: Ensure SQL is safe and tested
5. **Don't Make Breaking Changes**: Consider backward compatibility

## Common Migration Patterns

### Adding a Column

```typescript
up: async (database) => {
    await database.execAsync(`
        ALTER TABLE users ADD COLUMN email text;
    `);
}
```

### Adding a Table with Foreign Key

```typescript
up: async (database) => {
    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS user_sessions (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id text NOT NULL,
            token text NOT NULL,
            expires_at text NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS us_user_id_idx ON user_sessions (user_id);
    `);
}
```

### Renaming a Column (SQLite Limitation)

SQLite doesn't support column renaming directly in older versions. Use this pattern:

```typescript
up: async (database) => {
    await database.execAsync(`
        -- Create new table with updated schema
        CREATE TABLE users_new (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            full_name text NOT NULL,  -- Renamed from 'name'
            email text NOT NULL
        );

        -- Copy data
        INSERT INTO users_new (id, full_name, email)
        SELECT id, name, email FROM users;

        -- Drop old table
        DROP TABLE users;

        -- Rename new table
        ALTER TABLE users_new RENAME TO users;
    `);
}
```

### Adding Data

```typescript
up: async (database) => {
    await database.execAsync(`
        INSERT INTO user_roles (name, description) VALUES
        ('admin', 'Administrator with full access'),
        ('user', 'Standard user access');
    `);
}
```

## Testing Migrations

### In Development

Use the migration utilities to test:

```typescript
import { MigrationManager } from '@/database/migrations';
import { allMigrations } from '@/database/migrations';

// Get migration info
const manager = new MigrationManager(database, allMigrations);
const info = await manager.getInfo();
console.log('Current version:', info.currentVersion);
console.log('Needs migration:', info.needsMigration);

// Run migrations
const results = await manager.migrate();

// Rollback (DEV only)
await manager.rollback();
```

### Manual Testing Checklist

Before releasing a migration:

- [ ] Test on empty database (fresh install)
- [ ] Test on existing database (upgrade scenario)
- [ ] Verify all indexes are created
- [ ] Check foreign key constraints work
- [ ] Ensure data integrity is maintained
- [ ] Test rollback (if provided)
- [ ] Verify performance with realistic data volume

## Migration Lifecycle

### Fresh Install (New User)

1. Database opens for first time
2. MigrationManager runs all migrations sequentially
3. Database is at latest version

### App Update (Existing User)

1. App updates with new migrations
2. MigrationManager detects pending migrations
3. Only new migrations run
4. Database upgrades to latest version

### Development Workflow

1. Create migration file
2. Add to `allMigrations` array
3. Test locally
4. Commit migration to version control
5. Deploy with app update

## Troubleshooting

### Migration Failed

If a migration fails:
1. Check logs for error message
2. Migration is rolled back automatically (transaction)
3. Fix the migration code
4. Database remains at previous version
5. Re-deploy fixed migration

### Missing Version

If you skip a version number:
- MigrationManager will throw an error
- Fix by renumbering migrations
- Ensure all migrations are sequential

### Duplicate Version

If two migrations have same version:
- MigrationManager will throw an error
- Fix by renumbering one migration

## Example Scenarios

### Scenario 1: Adding a Feature

You need to add a "favorites" feature:

```typescript
// 002_add_favorites.ts
export const migration_002_add_favorites: Migration = {
    version: 2,
    description: 'Add favorites feature',
    up: async (database) => {
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS user_favorites (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                user_id text NOT NULL,
                item_type text NOT NULL,
                item_id text NOT NULL,
                created_at text NOT NULL DEFAULT (datetime('now')),
                UNIQUE(user_id, item_type, item_id)
            );
            CREATE INDEX IF NOT EXISTS uf_user_id_idx ON user_favorites (user_id);
        `);
    }
};
```

### Scenario 2: Modifying Existing Data

You need to normalize existing data:

```typescript
// 003_normalize_phone_numbers.ts
export const migration_003_normalize_phone_numbers: Migration = {
    version: 3,
    description: 'Normalize phone number format',
    up: async (database) => {
        // Add new column
        await database.execAsync(`
            ALTER TABLE users ADD COLUMN phone_normalized text;
        `);

        // Update data (using application logic if complex)
        // For simple cases, use SQL:
        await database.execAsync(`
            UPDATE users
            SET phone_normalized = REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', '')
            WHERE phone IS NOT NULL;
        `);
    }
};
```

## Resources

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Expo SQLite API](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/what-are-database-migrations)
