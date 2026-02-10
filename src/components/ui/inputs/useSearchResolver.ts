import { ChecklistEstruturaDatabase, useChecklistEstruturaDatabase } from '@/database/models/useChecklistEstruturaDatabase';
import { EquipeDatabase, useEquipeDatabase } from '@/database/models/useEquipeDatabase';
import { FuncionarioDatabase, useFuncionarioDatabase } from '@/database/models/useFuncionarioDatabase';
import { LocalidadeCidadeDatabase, useLocalidadeCidadeDatabase } from '@/database/models/useLocalidadeCidadeDatabase';
import { useVeiculoDatabase, VeiculoDatabase } from '@/database/models/useVeiculoDatabase';
import { useCallback } from 'react';

export type SearchSelectOption = {
    id: string;
    title?: string | null;
};

type ExtraParam = {
    centro_custo_id?: string;
    grupo_id?: string;
};

export function useSearchResolver(
    listName?: string,
    extraParam?: ExtraParam
): ((query: string) => Promise<SearchSelectOption[]>) | null {
    const localidadeCidadeDb = useLocalidadeCidadeDatabase();
    const funcionarioDb = useFuncionarioDatabase();
    const veiculoDb = useVeiculoDatabase();
    const equipeDb = useEquipeDatabase();
    const checklistEstruturaDb = useChecklistEstruturaDatabase();

    const search = useCallback(async (query: string): Promise<SearchSelectOption[]> => {
        switch (listName) {
            case 'cidades': {
                const res = await localidadeCidadeDb.getByParams({
                    centro_custo_id: extraParam?.centro_custo_id || '',
                    query,
                });
                if (!res || res.length === 0) return [];
                return res.map((item: LocalidadeCidadeDatabase) => ({
                    id: String(item.id),
                    title: item.nome || '',
                }));
            }
            case 'funcionarios': {
                const res = await funcionarioDb.getByParams(query);
                if (!res || res.length === 0) return [];
                return res.map((item: FuncionarioDatabase) => ({
                    id: String(item.cpf),
                    title: item.nome || '',
                }));
            }
            case 'veiculos': {
                const res = await veiculoDb.getByParams(query);
                if (!res || res.length === 0) return [];
                return res.map((item: VeiculoDatabase) => ({
                    id: String(item.id),
                    title: String(item.id) || '',
                }));
            }
            case 'equipes': {
                const res = await equipeDb.getByParams(
                    extraParam?.centro_custo_id || '',
                    query
                );
                if (!res || res.length === 0) return [];
                return res.map((item: EquipeDatabase) => ({
                    id: String(item.id),
                    title: String(item.nome) || '',
                }));
            }
            case 'estruturas': {
                const res = await checklistEstruturaDb.getByParams({
                    centro_custo_id: extraParam?.centro_custo_id || '',
                    grupo_id: Number(extraParam?.grupo_id) || 0,
                    query,
                });
                if (!res || res.length === 0) return [];
                return res.map((item: ChecklistEstruturaDatabase) => ({
                    id: String(item.id),
                    title: String(item.modelo) || '',
                }));
            }
            default:
                return [];
        }
    }, [listName, extraParam?.centro_custo_id, extraParam?.grupo_id]);

    if (!listName) return null;

    return search;
}
