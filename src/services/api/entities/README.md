# Sync Services Architecture

This directory contains the refactored sync services organized by entity type for better maintainability and separation of concerns.

## Structure

### Base Service
- `baseSyncService.ts`: Contains the base class with common pagination and data fetching logic

### Entity Services
Each entity has its own service file containing:
- Interface definition for the entity
- Sync service class extending BaseSyncService
- Exported service instance

#### Available Services:
- `centroCustoSyncService.ts` - Centro de Custo synchronization
- `funcionarioSyncService.ts` - Funcionários synchronization
- `checklistGrupoSyncService.ts` - Checklist Groups synchronization
- `centroCustoEstruturaSyncService.ts` - Centro Custo Estruturas synchronization
- `checklistEstruturaSyncService.ts` - Checklist Estruturas synchronization
- `checklistEstruturaItemSyncService.ts` - Checklist Estrutura Items synchronization
- `localidadeCidadeSyncService.ts` - Localidade Cidades synchronization
- `equipeSyncService.ts` - Equipes synchronization
- `veiculoSyncService.ts` - Veículos synchronization

## Usage

### Direct Usage
```typescript
import { centroCustoSyncService } from './entities/centroCustoSyncService';

// Sync centro custos
await centroCustoSyncService.syncCentroCustos(dbService);
```

### Through Main Sync Service
```typescript
import { syncService } from './syncService';

// Sync all data with centro custo filter
await syncService.syncFuncionarios(dbService, centroCustoId);
```

## Benefits

1. **Separation of Concerns**: Each entity has its own service
2. **Maintainability**: Easier to modify individual sync logic
3. **Testability**: Each service can be tested independently
4. **Reusability**: Services can be used individually or together
5. **Type Safety**: Clear interfaces for each entity
6. **Scalability**: Easy to add new entities without modifying existing code

## Centro Custo ID Parameter

The following services support filtering by `centroCustoId`:
- Funcionários
- Centro Custo Estruturas
- Checklist Estruturas
- Checklist Estrutura Items
- Localidade Cidades
- Equipes
- Veículos

Services that don't require filtering:
- Centro Custos
- Checklist Grupos
