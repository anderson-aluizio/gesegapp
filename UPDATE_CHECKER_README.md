# Update Checker Implementation

## Overview

The update checker has been refactored to follow best practices by implementing an **interceptor pattern** that automatically checks the app version on every API request. This ensures that version checking happens consistently without requiring manual calls in every component.

## Architecture

### Key Components

1. **updateChecker.ts** - Core version checking logic
2. **apiClient.ts** - API client with built-in update interceptor
3. **UpdateModal.tsx** - UI component for forced update notification
4. **UpdateContext.tsx** - Context provider for managing update modal state
5. **apiErrorHandler.ts** - Global error handler for update-related errors

## How It Works

### Automatic Version Checking

Every time an API request is made through `apiClient`, the system:

1. Checks if an update is required (with 5-minute caching to avoid excessive checks)
2. Compares the local version with the remote version from the server
3. If a forced update is required, throws an `UpdateRequiredError`
4. The error is caught globally and shows the update modal to the user
5. The modal is non-dismissible, forcing the user to update

### Flow Diagram

```
User Action → API Request → Update Check (Interceptor)
                                ↓
                        Update Required?
                        ↓            ↓
                       No           Yes
                        ↓            ↓
                Continue Request   Throw UpdateRequiredError
                                    ↓
                            Show Update Modal
                                    ↓
                            User Downloads Update
```

## Implementation Details

### 1. Update Checker Service

Located at: `src/services/updateChecker.ts`

**Features:**
- Caching mechanism (checks every 5 minutes max)
- Returns structured result with update info
- Gracefully handles errors (doesn't block app if check fails)
- Exports utility functions for cache management

**Key Functions:**
- `checkForUpdate()` - Main version checking function
- `resetUpdateCheckCache()` - Force fresh check on next API call
- `getLocalVersion()` - Get current app version

### 2. API Client Interceptor

Located at: `src/services/api/apiClient.ts`

**Features:**
- Automatic update check before every GET/POST request
- Throws `UpdateRequiredError` when update is needed
- Can be disabled for specific scenarios via `setUpdateCheckEnabled()`

**Custom Error Type:**
```typescript
export class UpdateRequiredError extends Error {
    updateInfo?: UpdateInfo;
}
```

### 3. Update Modal Component

Located at: `src/components/UpdateModal.tsx`

**Features:**
- Non-dismissible modal (user must update)
- Displays update description and version info
- Opens app store/download URL when user clicks update
- Styled with react-native-paper for consistency

### 4. Global Update Context

Located at: `src/contexts/UpdateContext.tsx`

**Features:**
- Manages modal state globally
- Registered in app root layout
- Provides `useUpdate()` hook for manual control
- Auto-registers with error handler

### 5. Error Handler Utility

Located at: `src/utils/apiErrorHandler.ts`

**Features:**
- Global handler registration
- Automatically shows modal for `UpdateRequiredError`
- Provides HOC wrapper for component functions
- Type-safe error handling

## Usage

### Normal Usage (Automatic)

No code changes needed! The update checker works automatically on all API requests:

```typescript
// This automatically checks for updates
const data = await apiClient.get('/endpoint');

// This also automatically checks for updates
const result = await apiClient.post('/endpoint', body);
```

### Manual Control (If Needed)

```typescript
import { useUpdate } from '@/contexts/UpdateContext';
import { checkForUpdate } from '@/services/updateChecker';

function MyComponent() {
    const { showUpdateModal } = useUpdate();

    // Manually trigger update check
    const checkManually = async () => {
        const result = await checkForUpdate();
        if (result.updateRequired) {
            showUpdateModal(result.updateInfo);
        }
    };
}
```

### Disabling Update Check (Testing)

```typescript
import { apiClient } from '@/services/api/apiClient';

// Disable update checking temporarily
apiClient.setUpdateCheckEnabled(false);

// Make API calls without version check
await apiClient.get('/endpoint');

// Re-enable
apiClient.setUpdateCheckEnabled(true);
```

## Configuration

### Environment Variables

Required in `.env`:
```
EXPO_PUBLIC_API_URL=https://your-api.com
EXPO_PUBLIC_LOCAL_VERSION=1.0.0
```

### Server Response Format

The server endpoint `/mobile-actual-app-version` should return:

```json
{
    "versionName": "1.0.1",
    "forceUpdate": true,
    "description": "This update includes critical bug fixes and performance improvements.",
    "url": "https://play.google.com/store/apps/details?id=com.yourapp"
}
```

## Benefits of This Approach

1. **Automatic** - No need to manually call update check in components
2. **Centralized** - All update logic in one place
3. **Consistent** - Every API request checks for updates
4. **Performance** - Smart caching prevents excessive checks
5. **User-Friendly** - Clear modal with update information
6. **Maintainable** - Easy to modify behavior in one location
7. **Testable** - Can disable for testing purposes

## Migration from Old Implementation

### What Was Changed

**Before:**
- Manual `checkForUpdate()` calls in multiple components
- UI alerts shown from service layer
- Inconsistent update checking
- Easy to forget to add check in new features

**After:**
- Automatic checking via API interceptor
- Centralized modal management
- Consistent behavior across all API calls
- Impossible to forget (happens automatically)

### Components Updated

- `src/app/login.tsx` - Removed manual check
- `src/components/SendEquipeTurno.tsx` - Removed manual check
- `src/components/SendChecklistRealizado.tsx` - Removed manual check
- `src/app/(tabs)/sync-data.tsx` - Removed manual check

## Troubleshooting

### Update Modal Not Showing

1. Check that `UpdateProvider` is in the app root layout
2. Verify API endpoint is returning correct format
3. Check console logs for errors
4. Ensure `EXPO_PUBLIC_API_URL` is set correctly

### Too Many Update Checks

The system has built-in caching (5 minutes). If needed, adjust:
```typescript
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
```

### Need to Force Fresh Check

```typescript
import { resetUpdateCheckCache } from '@/services/updateChecker';

resetUpdateCheckCache();
// Next API call will do fresh check
```

## Testing

### Test Scenarios

1. **Normal Operation** - App version matches server
2. **Update Available** - Server has newer version with forceUpdate: true
3. **Network Error** - Server unreachable (should not block app)
4. **Invalid Response** - Server returns malformed data (should not block app)

### Manual Testing

1. Change `EXPO_PUBLIC_LOCAL_VERSION` to an old version
2. Make any API call (login, sync, send data)
3. Verify update modal appears
4. Verify modal cannot be dismissed
5. Verify clicking update opens correct URL

## Future Enhancements

Possible improvements:
- Optional (non-forced) update notifications
- Update progress tracking
- Automatic download for Android
- Update history/changelog display
- A/B testing for gradual rollouts

## Support

For issues or questions about the update checker:
1. Check this documentation
2. Review console logs for errors
3. Verify server endpoint response format
4. Check that all environment variables are set
