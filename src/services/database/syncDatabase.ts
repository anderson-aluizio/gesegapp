import { SQLiteDatabase } from 'expo-sqlite';
import type {
    Funcionario,
    ChecklistGrupo,
    CentroCustoEstrutura,
    ChecklistEstrutura,
    ChecklistEstruturaItem,
    ChecklistEstruturaRisco,
    LocalidadeCidade,
    Equipe,
    Veiculo,
} from '../api/syncService';
import { ChecklistEstruturaControleRisco } from '../api/entities';

export interface SyncProgress {
    step: string;
    percentage: number;
    totalSteps: number;
    currentStep: number;
}

export type ProgressCallback = (progress: SyncProgress) => void;

export class DatabaseSyncService {
    private database: SQLiteDatabase;

    constructor(database: SQLiteDatabase) {
        this.database = database;
    }

    private async insertFuncionarios(data: Funcionario[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO funcionarios (cpf, nome, matricula, cargo_nome, centro_custo_id) VALUES (?, ?, ?, ?, ?)`,
                [item.cpf, item.nome, item.matricula, item.cargo_nome, item.centro_custo_id]
            );
        }
    }

    async clearFuncionarios(centroCustoId: string) {
        await this.database.runAsync(
            `DELETE FROM funcionarios WHERE centro_custo_id = ?`,
            [centroCustoId]
        );
    }

    private async insertChecklistGrupos(data: ChecklistGrupo[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO checklist_grupos (id, nome, nome_interno) VALUES (?, ?, ?)`,
                [item.id, item.nome, item.nome_interno]
            );
        }
    }

    private async insertCentroCustoEstruturas(data: CentroCustoEstrutura[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO centro_custo_estruturas (id, nome, centro_custo_id) VALUES (?, ?, ?)`,
                [item.id, item.nome, item.centro_custo_id]
            );
        }
    }

    async clearCentroCustoEstruturas(centroCustoId: string) {
        await this.database.runAsync(
            `DELETE FROM centro_custo_estruturas WHERE centro_custo_id = ?`,
            [centroCustoId]
        );
    }

    private async insertChecklistEstruturas(data: ChecklistEstrutura[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO checklist_estruturas (id, modelo, checklist_grupo_id, centro_custo_id, is_respostas_obrigatoria, is_gera_nao_conformidade) VALUES (?, ?, ?, ?, ?, ?)`,
                [item.id, item.modelo, item.checklist_grupo_id, item.centro_custo_id, item.is_respostas_obrigatoria, item.is_gera_nao_conformidade]
            );
        }
    }

    async clearChecklistEstruturas(centroCustoId: string) {
        await this.database.runAsync(
            `DELETE FROM checklist_estruturas WHERE centro_custo_id = ?`,
            [centroCustoId]
        );
    }

    private async insertChecklistEstruturaItems(data: ChecklistEstruturaItem[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO checklist_estrutura_items (
                    id, checklist_estrutura_id, checklist_grupo_id, checklist_sub_grupo, checklist_item_id, checklist_item_nome,
                    checklist_alternativa_id, checklist_alternativas, alternativa_inconformidades, is_foto_obrigatoria,
                    is_desc_nconf_required, num_ordem, equipamento_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.id,
                    item.checklist_estrutura_id,
                    item.checklist_grupo_id,
                    item.checklist_sub_grupo,
                    item.checklist_item_id,
                    item.checklist_item_nome,
                    item.checklist_alternativa_id,
                    item.checklist_alternativas,
                    item.alternativa_inconformidades,
                    item.is_foto_obrigatoria,
                    item.is_desc_nconf_required,
                    item.num_ordem,
                    item.equipamento_id
                ]
            );
        }
    }

    async clearChecklistEstruturaItems(centroCustoId: string) {
        await this.database.runAsync(
            `DELETE FROM checklist_estrutura_items WHERE checklist_estrutura_id IN (SELECT id FROM checklist_estruturas WHERE centro_custo_id = ?)`,
            [centroCustoId]
        );
    }

    private async insertChecklistEstruturaRiscos(data: ChecklistEstruturaRisco[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO checklist_estrutura_riscos (
                    id, checklist_estrutura_id, nome
                ) VALUES (?, ?, ?)`,
                [
                    item.id,
                    item.checklist_estrutura_id,
                    item.nome
                ]
            );
        }
    }

    async clearChecklistEstruturaRiscos(centroCustoId: string) {
        await this.database.runAsync(
            `DELETE FROM checklist_estrutura_riscos WHERE checklist_estrutura_id IN (SELECT id FROM checklist_estruturas WHERE centro_custo_id = ?)`,
            [centroCustoId]
        );
    }

    private async insertChecklistEstruturaControleRiscos(data: ChecklistEstruturaControleRisco[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO checklist_estrutura_controle_riscos (
                    id, checklist_estrutura_id, checklist_estrutura_risco_id, nome
                ) VALUES (?, ?, ?, ?)`,
                [
                    item.id,
                    item.checklist_estrutura_id,
                    item.checklist_estrutura_risco_id,
                    item.nome
                ]
            );
        }
    }

    async clearChecklistEstruturaControleRiscos(centroCustoId: string) {
        await this.database.runAsync(
            `DELETE FROM checklist_estrutura_controle_riscos WHERE checklist_estrutura_id IN (SELECT id FROM checklist_estruturas WHERE centro_custo_id = ?)`,
            [centroCustoId]
        );
    }

    private async insertLocalidadeCidades(data: LocalidadeCidade[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO localidade_cidades (id, nome, centro_custo_id) VALUES (?, ?, ?)`,
                [item.id, item.nome, item.centro_custo_id]
            );
        }
    }

    async clearLocalidadeCidades(centroCustoId: string) {
        await this.database.runAsync(
            `DELETE FROM localidade_cidades WHERE centro_custo_id = ?`,
            [centroCustoId]
        );
    }

    private async insertEquipes(data: Equipe[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO equipes (id, nome, centro_custo_id, encarregado_cpf, supervisor_cpf, coordenador_cpf, gerente_cpf) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.id,
                    item.nome,
                    item.centro_custo_id,
                    item.encarregado_cpf,
                    item.supervisor_cpf,
                    item.coordenador_cpf,
                    item.gerente_cpf
                ]
            );
        }
    }

    async clearEquipes(centroCustoId: string) {
        await this.database.runAsync(
            `DELETE FROM equipes WHERE centro_custo_id = ?`,
            [centroCustoId]
        );
    }

    private async insertVeiculos(data: Veiculo[]) {
        for (const item of data) {
            await this.database.runAsync(
                `INSERT OR REPLACE INTO veiculos (id, nome, centro_custo_id) VALUES (?, ?, ?)`,
                [item.id, item.nome, item.centro_custo_id]
            );
        }
    }

    async clearVeiculos(centroCustoId: string) {
        await this.database.runAsync(
            `DELETE FROM veiculos WHERE centro_custo_id = ?`,
            [centroCustoId]
        );
    }

    async insertFuncionariosPage(data: Funcionario[]) {
        await this.insertFuncionarios(data);
    }

    async insertChecklistGruposPage(data: ChecklistGrupo[]) {
        await this.insertChecklistGrupos(data);
    }

    async insertCentroCustoEstruturasPage(data: CentroCustoEstrutura[]) {
        await this.insertCentroCustoEstruturas(data);
    }

    async insertChecklistEstruturasPage(data: ChecklistEstrutura[]) {
        await this.insertChecklistEstruturas(data);
    }

    async insertChecklistEstruturaItemsPage(data: ChecklistEstruturaItem[]) {
        await this.insertChecklistEstruturaItems(data);
    }

    async insertChecklistEstruturaRiscosPage(data: ChecklistEstruturaRisco[]) {
        await this.insertChecklistEstruturaRiscos(data);
    }

    async insertChecklistEstruturaControleRiscosPage(data: ChecklistEstruturaControleRisco[]) {
        await this.insertChecklistEstruturaControleRiscos(data);
    }

    async insertLocalidadeCidadesPage(data: LocalidadeCidade[]) {
        await this.insertLocalidadeCidades(data);
    }

    async insertEquipesPage(data: Equipe[]) {
        await this.insertEquipes(data);
    }

    async insertVeiculosPage(data: Veiculo[]) {
        await this.insertVeiculos(data);
    }

    private async updateCentroCustoSyncedAt(centroCustoId: string) {
        try {
            const query = `UPDATE centro_custos SET synced_at = datetime('now') WHERE id = ?`;
            await this.database.runAsync(query, [centroCustoId]);
        } catch (error) {
            console.error('Erro ao atualizar synced_at do centro de custo:', error);
            throw error;
        }
    }

    async syncAllDataStreaming(progressCallback: ProgressCallback, centroCustoId: string): Promise<void> {
        try {
            const { syncService } = await import('../api/syncService');
            console.log('Iniciando sincronização streaming...');

            const syncSteps = [
                { name: 'Colaboradores', fn: () => syncService.syncFuncionarios(this, centroCustoId) },
                { name: 'Grupos', fn: () => syncService.syncChecklistGrupos(this) },
                { name: 'Estruturas do Centro de Custo', fn: () => syncService.syncCentroCustoEstruturas(this, centroCustoId) },
                { name: 'Estruturas do Checklist', fn: () => syncService.syncChecklistEstruturas(this, centroCustoId) },
                { name: 'Itens da Estrutura', fn: () => syncService.syncChecklistEstruturaItems(this, centroCustoId) },
                { name: 'Riscos ou Perigos', fn: () => syncService.syncChecklistEstruturaRiscos(this, centroCustoId) },
                { name: 'Controle de Riscos/Perigos', fn: () => syncService.syncChecklistEstruturaControleRiscos(this, centroCustoId) },
                { name: 'Cidades', fn: () => syncService.syncLocalidadeCidades(this, centroCustoId) },
                { name: 'Equipes', fn: () => syncService.syncEquipes(this, centroCustoId) },
                { name: 'Veículos', fn: () => syncService.syncVeiculos(this, centroCustoId) },
            ];

            const totalSteps = syncSteps.length;

            for (let i = 0; i < syncSteps.length; i++) {
                const step = syncSteps[i];
                const currentStep = i + 1;
                const percentage = Math.round((currentStep / totalSteps) * 100);

                if (progressCallback) {
                    progressCallback({
                        step: step.name,
                        percentage: percentage,
                        totalSteps: totalSteps,
                        currentStep: currentStep
                    });
                }

                await step.fn();
            }

            await this.updateCentroCustoSyncedAt(centroCustoId);

            console.log('Sincronização concluída com sucesso!');

        } catch (error) {
            console.error('Erro durante a sincronização streaming:', error);
            throw error;
        }
    }
}

export const createDatabaseSyncService = (database: SQLiteDatabase) => {
    return new DatabaseSyncService(database);
};
