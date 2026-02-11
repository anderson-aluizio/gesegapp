import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface LocalidadeCidade {
    id: number;
    nome: string;
    centro_custo_id: string;
    localidade_estado_id?: number;
}

export class LocalidadeCidadeSyncService extends BaseSyncService {
    async syncLocalidadeCidades(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearLocalidadeCidades(centroCustoId);
        return await this.fetchAndInsertPaginatedData<LocalidadeCidade>(
            API_ENDPOINTS.LOCALIDADE_CIDADES,
            (data) => dbService.insertLocalidadeCidadesPage(data),
            'Localidade Cidades',
            centroCustoId
        );
    }
}

export const localidadeCidadeSyncService = new LocalidadeCidadeSyncService();
