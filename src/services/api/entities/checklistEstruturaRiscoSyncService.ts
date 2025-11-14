import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface ChecklistEstruturaRisco {
    id: number;
    checklist_estrutura_id: number;
    nome: string;
}

export class ChecklistEstruturaRiscoSyncService extends BaseSyncService {
    async syncChecklistEstruturaRiscos(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearChecklistEstruturaRiscos(centroCustoId);
        return await this.fetchAndInsertPaginatedData<ChecklistEstruturaRisco>(
            API_ENDPOINTS.CHECKLIST_ESTRUTURA_RISCOS,
            (data) => dbService.insertChecklistEstruturaRiscosPage(data),
            'Checklist Estrutura Riscos',
            centroCustoId
        );
    }
}

export const checklistEstruturaRiscoSyncService = new ChecklistEstruturaRiscoSyncService();
