import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface ChecklistEstrutura {
    id: number;
    modelo: string;
    checklist_grupo_id: number;
    centro_custo_id: string;
    is_respostas_obrigatoria: number;
    is_gera_nao_conformidade: number;
}

export class ChecklistEstruturaSyncService extends BaseSyncService {
    async syncChecklistEstruturas(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearChecklistEstruturas(centroCustoId);
        return await this.fetchAndInsertPaginatedData<ChecklistEstrutura>(
            API_ENDPOINTS.CHECKLIST_ESTRUTURAS,
            (data) => dbService.insertChecklistEstruturasPage(data),
            'Checklist Estruturas',
            centroCustoId
        );
    }
}

export const checklistEstruturaSyncService = new ChecklistEstruturaSyncService();
