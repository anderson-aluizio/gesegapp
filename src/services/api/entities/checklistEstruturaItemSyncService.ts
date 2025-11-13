import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface ChecklistEstruturaItem {
    id: number;
    checklist_estrutura_id: number;
    checklist_grupo_id: number;
    checklist_sub_grupo: string | null;
    checklist_item_id: number;
    checklist_item_nome: string;
    checklist_alternativa_id: number | null;
    checklist_alternativas: string | null;
    alternativa_inconformidades: string | null;
    is_foto_obrigatoria: number;
    is_desc_nconf_required: number;
    num_ordem: number;
    equipamento_id: number | null;
}

export class ChecklistEstruturaItemSyncService extends BaseSyncService {
    async syncChecklistEstruturaItems(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearChecklistEstruturaItems(centroCustoId);
        return await this.fetchAndInsertPaginatedData<ChecklistEstruturaItem>(
            API_ENDPOINTS.CHECKLIST_ESTRUTURA_ITEMS,
            (data) => dbService.insertChecklistEstruturaItemsPage(data),
            'Checklist Estrutura Items',
            centroCustoId
        );
    }
}

export const checklistEstruturaItemSyncService = new ChecklistEstruturaItemSyncService();
