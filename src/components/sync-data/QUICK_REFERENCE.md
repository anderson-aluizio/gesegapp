# Sync Data Components - Quick Reference

## Import Examples

### Using Individual Components
```typescript
import { CentroCustoCard } from '@/components/sync-data';
import { SyncProgressDialog } from '@/components/sync-data';
import { CustomSnackbar } from '@/components/sync-data';
```

### Using All Components
```typescript
import {
    SyncHeader,
    CentroCustoList,
    CentroCustoCard,
    InfoDialog,
    SyncProgressDialog,
    CustomSnackbar,
} from '@/components/sync-data';
```

### Using Hooks
```typescript
import {
    useSnackbar,
    useDialog,
    useSyncProgress,
    useAnimations,
    useCentroCustoSync,
} from '@/hooks';
```

## Component APIs

### SyncHeader
```typescript
interface SyncHeaderProps {
    onBack: () => void;
}

// Usage
<SyncHeader onBack={() => router.back()} />
```

### CentroCustoCard
```typescript
interface CentroCustoCardProps {
    centroCusto: CentroCustoDatabase;
    onSync: (id: string) => void;
    disabled?: boolean;
    index: number;
    slideAnim: Animated.Value;
}

// Usage
<CentroCustoCard
    centroCusto={cc}
    onSync={handleSync}
    disabled={isSyncing}
    index={0}
    slideAnim={slideAnim}
/>
```

### CentroCustoList
```typescript
interface CentroCustoListProps {
    centroCustos: CentroCustoDatabase[];
    isLoading: boolean;
    isSyncing: boolean;
    onSync: (id: string) => void;
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
}

// Usage
<CentroCustoList
    centroCustos={centroCustos}
    isLoading={isLoading}
    isSyncing={isSyncing}
    onSync={handleSync}
    fadeAnim={fadeAnim}
    slideAnim={slideAnim}
/>
```

### InfoDialog
```typescript
interface InfoDialogProps {
    visible: boolean;
    description: string;
    onDismiss: () => void;
}

// Usage
<InfoDialog
    visible={dialog.visible}
    description={dialog.description}
    onDismiss={dialog.hide}
/>
```

### SyncProgressDialog
```typescript
interface SyncProgressDialogProps {
    visible: boolean;
    progress: string[];
    percentage: number;
    currentStep: string;
    fadeAnim: Animated.Value;
}

// Usage
<SyncProgressDialog
    visible={syncProgress.visible}
    progress={syncProgress.progress}
    percentage={syncProgress.percentage}
    currentStep={syncProgress.currentStep}
    fadeAnim={fadeAnim}
/>
```

### CustomSnackbar
```typescript
interface CustomSnackbarProps {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    onDismiss: () => void;
}

// Usage
<CustomSnackbar
    visible={snackbar.visible}
    message={snackbar.message}
    type={snackbar.type}
    onDismiss={snackbar.hide}
/>
```

## Hook APIs

### useSnackbar
```typescript
const snackbar = useSnackbar();

// Properties
snackbar.visible    // boolean
snackbar.message    // string
snackbar.type       // 'success' | 'error' | 'info'

// Methods
snackbar.show(message, type)  // Show snackbar
snackbar.hide()               // Hide snackbar

// Example
snackbar.show('Success!', 'success');
```

### useDialog
```typescript
const dialog = useDialog();

// Properties
dialog.visible      // boolean
dialog.description  // string

// Methods
dialog.show(description)  // Show dialog
dialog.hide()             // Hide dialog

// Example
dialog.show('Connection failed');
```

### useSyncProgress
```typescript
const syncProgress = useSyncProgress();

// Properties
syncProgress.visible      // boolean
syncProgress.progress     // string[]
syncProgress.percentage   // number
syncProgress.currentStep  // string

// Methods
syncProgress.show()                    // Show progress dialog
syncProgress.hide()                    // Hide progress dialog
syncProgress.addProgress(message)      // Add log message
syncProgress.updateProgress(step, %)   // Update progress

// Example
syncProgress.show();
syncProgress.addProgress('Starting...');
syncProgress.updateProgress('Loading', 50);
```

### useAnimations
```typescript
const { fadeAnim, slideAnim } = useAnimations();

// Returns
fadeAnim   // Animated.Value (0 to 1)
slideAnim  // Animated.Value (50 to 0)

// Usage
<Animated.View style={{ opacity: fadeAnim }}>
    {/* content */}
</Animated.View>
```

### useCentroCustoSync
```typescript
const {
    centroCustos,
    isLoading,
    isSyncing,
    syncCentroCusto,
    refreshCentroCustos,
} = useCentroCustoSync({
    onError: (message) => console.error(message),
    onSuccess: (message) => console.log(message),
    onProgressUpdate: (message) => console.log(message),
    onProgressChange: (step, percentage) => console.log(step, percentage),
});

// Properties
centroCustos         // CentroCustoDatabase[]
isLoading           // boolean
isSyncing           // boolean

// Methods
syncCentroCusto(id)        // Sync a centro custo
refreshCentroCustos()      // Reload data

// Example
await syncCentroCusto('123');
```

### checkNetworkConnection
```typescript
import { checkNetworkConnection } from '@/hooks';

// Returns Promise<NetworkInfo>
const networkInfo = await checkNetworkConnection();

// NetworkInfo interface
interface NetworkInfo {
    isConnected: boolean;
    connectionType?: string;
    connectionDetails?: string;
}

// Example
try {
    const info = await checkNetworkConnection();
    console.log(info.connectionType);
} catch (error) {
    console.error(error.message);
}
```

## Common Patterns

### Basic Setup
```typescript
export default function MyScreen() {
    const snackbar = useSnackbar();
    const syncProgress = useSyncProgress();
    const { fadeAnim, slideAnim } = useAnimations();

    const { centroCustos, isLoading, syncCentroCusto } = useCentroCustoSync({
        onError: (msg) => snackbar.show(msg, 'error'),
        onSuccess: (msg) => snackbar.show(msg, 'success'),
        onProgressUpdate: (msg) => syncProgress.addProgress(msg),
        onProgressChange: (step, pct) => syncProgress.updateProgress(step, pct),
    });

    // ... rest of component
}
```

### Handle Sync
```typescript
const handleSync = async (centroCustoId: string) => {
    syncProgress.show();
    await syncCentroCusto(centroCustoId);
    // Callbacks handle success/error
};
```

### Show Notifications
```typescript
// Success
snackbar.show('Operation completed!', 'success');

// Error
snackbar.show('Something went wrong', 'error');

// Info
snackbar.show('Please wait...', 'info');
```

### Handle Progress
```typescript
syncProgress.show();
syncProgress.addProgress('Step 1 starting...');
syncProgress.updateProgress('Step 1', 25);
syncProgress.addProgress('Step 1 complete');
syncProgress.updateProgress('Step 2', 50);
// ... continue
syncProgress.hide();
```

## Styling

### Customizing Components
Each component has its own StyleSheet. To customize:

1. Create a new component that wraps the original
2. Pass custom styles via props (if supported)
3. Create a theme file and import colors/spacing

### Example Theme
```typescript
// theme.ts
export const theme = {
    colors: {
        primary: '#667eea',
        success: '#4caf50',
        error: '#f44336',
        background: '#f8f9fa',
    },
    spacing: {
        small: 8,
        medium: 16,
        large: 24,
    },
};
```

## Testing

### Testing Hooks
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useSnackbar } from '@/hooks';

test('useSnackbar shows message', () => {
    const { result } = renderHook(() => useSnackbar());

    act(() => {
        result.current.show('Test message', 'success');
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.message).toBe('Test message');
    expect(result.current.type).toBe('success');
});
```

### Testing Components
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { CentroCustoCard } from '@/components/sync-data';

test('CentroCustoCard calls onSync', () => {
    const mockOnSync = jest.fn();
    const cc = { id: '1', nome: 'Test', synced_at: null };

    const { getByRole } = render(
        <CentroCustoCard
            centroCusto={cc}
            onSync={mockOnSync}
            index={0}
            slideAnim={new Animated.Value(0)}
        />
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnSync).toHaveBeenCalledWith('1');
});
```

## Troubleshooting

### Common Issues

**Issue**: "Cannot find module '@/components/sync-data'"
**Solution**: Ensure path alias is configured in tsconfig.json

**Issue**: "Property does not exist on type"
**Solution**: Check that you're importing the correct types

**Issue**: "Animated.Value is not assignable"
**Solution**: Ensure you're passing `Animated.Value` not plain numbers

**Issue**: Hook not updating component
**Solution**: Make sure you're calling the hook at component top level

## Best Practices

1. **Always use hooks at top level** - Don't call hooks inside loops or conditions
2. **Memoize callbacks** - Use `useCallback` for functions passed to children
3. **Clean up effects** - Return cleanup functions from useEffect
4. **Type everything** - Use TypeScript types for better DX
5. **Handle errors** - Always provide error handling callbacks
6. **Test components** - Write tests for critical functionality

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [React Native Paper](https://reactnativepaper.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro)
