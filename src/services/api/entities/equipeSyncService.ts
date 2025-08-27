import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface Equipe {
    id: number;
    nome: string;
    centro_custo_id: string;
    encarregado_cpf: string;
    supervisor_cpf: string;
    coordenador_cpf: string;
    gerente_cpf: string;
}

export class EquipeSyncService extends BaseSyncService {
    async syncEquipes(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearEquipes(centroCustoId);
        return await this.fetchAndInsertPaginatedData<Equipe>(
            API_ENDPOINTS.EQUIPES,
            (data) => dbService.insertEquipesPage(data),
            'Equipes',
            centroCustoId
        );
    }
}

export const equipeSyncService = new EquipeSyncService();
