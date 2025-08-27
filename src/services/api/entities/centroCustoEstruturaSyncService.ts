import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface CentroCustoEstrutura {
    id: number;
    nome: string;
    centro_custo_id: string;
}

export class CentroCustoEstruturaSyncService extends BaseSyncService {
    async syncCentroCustoEstruturas(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearCentroCustoEstruturas(centroCustoId);
        return await this.fetchAndInsertPaginatedData<CentroCustoEstrutura>(
            API_ENDPOINTS.CENTRO_CUSTO_ESTRUTURAS,
            (data) => dbService.insertCentroCustoEstruturasPage(data),
            'Centro Custo Estruturas',
            centroCustoId
        );
    }
}

export const centroCustoEstruturaSyncService = new CentroCustoEstruturaSyncService();
