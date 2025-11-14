import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface ChecklistEstruturaControleRisco {
    id: number;
    checklist_estrutura_id: number;
    checklist_estrutura_risco_id: number;
    nome: string;
}

export class ChecklistEstruturaControleRiscoSyncService extends BaseSyncService {
    async syncChecklistEstruturaControleRiscos(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearChecklistEstruturaControleRiscos(centroCustoId);
        return await this.fetchAndInsertPaginatedData<ChecklistEstruturaControleRisco>(
            API_ENDPOINTS.CHECKLIST_ESTRUTURA_CONTROLE_RISCOS,
            (data) => dbService.insertChecklistEstruturaControleRiscosPage(data),
            'Checklist Estrutura Riscos',
            centroCustoId
        );
    }
}

export const checklistEstruturaControleRiscoSyncService = new ChecklistEstruturaControleRiscoSyncService();
