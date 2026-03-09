import { BaseSyncService, PaginatedResponse } from './baseSyncService';
import { DatabaseSyncService } from '../../database/syncDatabase';
import { API_ENDPOINTS } from '../endpoints';

const JUPITER_BASE_URL = process.env.EXPO_PUBLIC_JUPITER_API_URL;
const JUPITER_AUTH_TOKEN = process.env.EXPO_PUBLIC_JUPITER_AUTH_TOKEN;

export interface AcaoCampo {
    id: number;
    grupo_caderno_preco_id: string;
    caderno_preco_id: string;
    centro_custo_id: string;
    processo_id: string;
    tipo_servico_id: number;
    tipo_acao: string;
    nome: string;
    valor: number;
    codigo_descricao: string;
    tipo_servico?: {
        nome: string;
    };
}

export class AcaoCampoSyncService extends BaseSyncService {
    private async fetchFromJupiter<T>(endpoint: string): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (JUPITER_AUTH_TOKEN) {
            headers['Authorization'] = `Bearer ${JUPITER_AUTH_TOKEN}`;
        }

        const fullUrl = `${JUPITER_BASE_URL}${endpoint}`;
        const response = await fetch(fullUrl, { method: 'GET', headers });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    }

    async syncAcaoCampos(dbService: DatabaseSyncService, centroCustoId: string): Promise<number> {
        await dbService.clearAcaoCampos(centroCustoId);

        let totalInserted = 0;
        let currentPage = 1;
        let hasNextPage = true;
        console.log('Starting sync for Ações de Campo...');

        while (hasNextPage) {
            try {
                const url = `${API_ENDPOINTS.ACAO_CAMPOS}?page=${currentPage}&filters[1][field]=centro_custo_id&filters[1][operator]=equal&filters[1][value]=${centroCustoId}`;

                const paginatedResponse = await this.fetchFromJupiter<PaginatedResponse<AcaoCampo>>(url);

                if (paginatedResponse.data.length > 0) {
                    await dbService.insertAcaoCamposPage(paginatedResponse.data);
                    totalInserted += paginatedResponse.data.length;
                }

                hasNextPage = paginatedResponse.next_page_url !== null;
                currentPage++;

                if (currentPage > 100) {
                    console.warn('Ações de Campo: Reached maximum page limit (100). Stopping pagination.');
                    break;
                }
            } catch (error) {
                console.error(`Error fetching/inserting Ações de Campo page ${currentPage}:`, error);
                throw error;
            }
        }

        console.log(`Ações de Campo sync completed. Total items: ${totalInserted}`);
        return totalInserted;
    }
}

export const acaoCampoSyncService = new AcaoCampoSyncService();
