import { BaseSyncService } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

export interface Funcionario {
    cpf: string;
    nome: string;
    matricula: string;
    cargo_nome: string;
    centro_custo_id: string;
}

export class FuncionarioSyncService extends BaseSyncService {
    async syncFuncionarios(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearFuncionarios(centroCustoId);
        return await this.fetchAndInsertPaginatedData<Funcionario>(
            API_ENDPOINTS.FUNCIONARIOS,
            (data) => dbService.insertFuncionariosPage(data),
            'Colaboradores',
            centroCustoId
        );
    }
}

export const funcionarioSyncService = new FuncionarioSyncService();
