import { DatabaseSyncService } from '../database/syncDatabase';
import {
    funcionarioSyncService,
    checklistGrupoSyncService,
    centroCustoEstruturaSyncService,
    checklistEstruturaSyncService,
    checklistEstruturaItemSyncService,
    checklistEstruturaRiscoSyncService,
    checklistEstruturaControleRiscoSyncService,
    localidadeCidadeSyncService,
    equipeSyncService,
    veiculoSyncService,
} from './entities';

export type {
    Funcionario,
    ChecklistGrupo,
    CentroCustoEstrutura,
    ChecklistEstrutura,
    ChecklistEstruturaItem,
    ChecklistEstruturaRisco,
    ChecklistEstruturaControleRisco,
    LocalidadeCidade,
    Equipe,
    Veiculo,
    PaginatedResponse,
} from './entities';

export class SyncService {
    async syncFuncionarios(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        return await funcionarioSyncService.syncFuncionarios(dbService, centroCustoId);
    }

    async syncChecklistGrupos(dbService: DatabaseSyncService): Promise<number> {
        return await checklistGrupoSyncService.syncChecklistGrupos(dbService);
    }

    async syncCentroCustoEstruturas(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        return await centroCustoEstruturaSyncService.syncCentroCustoEstruturas(dbService, centroCustoId);
    }

    async syncChecklistEstruturas(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        return await checklistEstruturaSyncService.syncChecklistEstruturas(dbService, centroCustoId);
    }

    async syncChecklistEstruturaItems(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        return await checklistEstruturaItemSyncService.syncChecklistEstruturaItems(dbService, centroCustoId);
    }

    async syncChecklistEstruturaRiscos(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        return await checklistEstruturaRiscoSyncService.syncChecklistEstruturaRiscos(dbService, centroCustoId);
    }

    async syncChecklistEstruturaControleRiscos(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        return await checklistEstruturaControleRiscoSyncService.syncChecklistEstruturaControleRiscos(dbService, centroCustoId);
    }

    async syncLocalidadeCidades(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        return await localidadeCidadeSyncService.syncLocalidadeCidades(dbService, centroCustoId);
    }

    async syncEquipes(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        return await equipeSyncService.syncEquipes(dbService, centroCustoId);
    }

    async syncVeiculos(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        return await veiculoSyncService.syncVeiculos(dbService, centroCustoId);
    }
}

export const syncService = new SyncService();
