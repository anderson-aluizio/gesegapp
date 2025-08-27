import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface Veiculo {
    id: string;
    nome: string;
    centro_custo_id: string;
}

export class VeiculoSyncService extends BaseSyncService {
    async syncVeiculos(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearVeiculos(centroCustoId);
        return await this.fetchAndInsertPaginatedData<Veiculo>(
            API_ENDPOINTS.VEICULOS,
            (data) => dbService.insertVeiculosPage(data),
            'Veículos',
            centroCustoId
        );
    }
}

export const veiculoSyncService = new VeiculoSyncService();
