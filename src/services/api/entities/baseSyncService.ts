import { apiClient } from '../apiClient';

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total?: number;
    last_page?: number;
}

export abstract class BaseSyncService {
    protected async fetchAndInsertPaginatedData<T>(
        endpoint: string,
        insertFunction: (data: T[]) => Promise<void>,
        entityName: string,
        centroCustoId?: string
    ): Promise<number> {
        let totalInserted = 0;
        let currentPage = 1;
        let hasNextPage = true;
        console.log(`Starting sync for ${entityName}...`);

        while (hasNextPage) {
            try {
                let url = `${endpoint}?page=${currentPage}`;
                if (centroCustoId) {
                    url += `&centro_custo_id=${centroCustoId}`;
                }

                const paginatedResponse = await apiClient.get<PaginatedResponse<T>>(url);

                if (paginatedResponse.data.length > 0) {
                    await insertFunction(paginatedResponse.data);
                    totalInserted += paginatedResponse.data.length;
                }

                hasNextPage = paginatedResponse.next_page_url !== null;
                currentPage++;

                if (currentPage > 100) {
                    console.warn(`${entityName}: Reached maximum page limit (100). Stopping pagination.`);
                    break;
                }

            } catch (error) {
                console.error(`Error fetching/inserting ${entityName} page ${currentPage}:`, error);
                throw error;
            }
        }

        console.log(`${entityName} sync completed. Total items: ${totalInserted}`);
        return totalInserted;
    }
}
