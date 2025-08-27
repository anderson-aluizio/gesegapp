import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface ChecklistGrupo {
    id: number;
    nome: string;
    nome_interno: string;
}

export class ChecklistGrupoSyncService extends BaseSyncService {
    async syncChecklistGrupos(dbService: DatabaseSyncService): Promise<number> {
        return await this.fetchAndInsertPaginatedData<ChecklistGrupo>(
            API_ENDPOINTS.CHECKLIST_GRUPOS,
            (data) => dbService.insertChecklistGruposPage(data),
            'Checklist Grupos'
        );
    }
}

export const checklistGrupoSyncService = new ChecklistGrupoSyncService();
