import { useSQLiteContext } from "expo-sqlite"

export type AcaoCampoDatabase = {
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
    tipo_servico_nome?: string;
}

export const useAcaoCampoDatabase = () => {
    const database = useSQLiteContext();

    const getByCentroCustoId = async (centroCustoId: string) => {
        const query = `SELECT * FROM acao_campos WHERE centro_custo_id = ? ORDER BY nome`;
        const response = await database.getAllAsync<AcaoCampoDatabase>(query, [centroCustoId]);
        return response;
    }

    const getByCentroCustoIdAndTipoServico = async (centroCustoId: string, tipoServicoNome: string) => {
        const query = `SELECT * FROM acao_campos WHERE centro_custo_id = ? AND tipo_servico_nome = ? ORDER BY nome`;
        const response = await database.getAllAsync<AcaoCampoDatabase>(query, [centroCustoId, tipoServicoNome]);
        return response;
    }

    const getTipoServicosByCentroCustoId = async (centroCustoId: string) => {
        const query = `SELECT DISTINCT tipo_servico_nome FROM acao_campos WHERE centro_custo_id = ? AND tipo_servico_nome IS NOT NULL ORDER BY tipo_servico_nome`;
        const response = await database.getAllAsync<{ tipo_servico_nome: string }>(query, [centroCustoId]);
        return response.map(r => r.tipo_servico_nome);
    }

    const getAll = async () => {
        const query = `SELECT * FROM acao_campos ORDER BY nome`;
        const response = await database.getAllAsync<AcaoCampoDatabase>(query, []);
        return response;
    }

    const getOneRow = async () => {
        const query = `SELECT * FROM acao_campos LIMIT 1`;
        const response = await database.getFirstAsync<AcaoCampoDatabase>(query);
        return response;
    }

    return { getByCentroCustoId, getByCentroCustoIdAndTipoServico, getTipoServicosByCentroCustoId, getAll, getOneRow };
}
