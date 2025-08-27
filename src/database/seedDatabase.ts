import { SQLiteDatabase } from "expo-sqlite";

export const seedDatabase = async (database: SQLiteDatabase) => {
    const centroCustosData = [
        { id: '1', nome: 'Bahia' },
        { id: '2', nome: 'Belém' },
    ];

    const centroCustoEstruturasData = [
        { id: 1, nome: 'Bahia - Observação Comportamental/STOPWORK', centro_custo_id: '1', is_respostas_obrigatoria: 1 },
        { id: 2, nome: 'Bahia - Checklist de Segurança', centro_custo_id: '2', is_respostas_obrigatoria: 0 },
    ];

    const localidadeCidadesData = [
        { id: 1, nome: 'Salvador', centro_custo_id: '1' },
        { id: 2, nome: 'Camaçari', centro_custo_id: '1' },
        { id: 3, nome: 'Candeias', centro_custo_id: '1' },
        { id: 4, nome: 'Lauro de Freitas', centro_custo_id: '1' },
        { id: 5, nome: 'Simões Filho', centro_custo_id: '1' },
        { id: 6, nome: 'Dias d\'Ávila', centro_custo_id: '1' },
        { id: 7, nome: 'São Sebastião do Passé', centro_custo_id: '1' },
        { id: 8, nome: 'Belém', centro_custo_id: '2' },
        { id: 9, nome: 'Ananindeua', centro_custo_id: '2' },
        { id: 10, nome: 'Marituba', centro_custo_id: '2' },
    ];

    const checklistGruposData = [
        { id: 1, nome: 'Observação Comportamental', nome_interno: 'checklist_observacao_comportamental_stop_work' },
        { id: 2, nome: 'Checklist Inspeção de EPI', nome_interno: 'checklist_inspecao_epi' },
    ];

    const checklistEstruturasData = [
        { id: 1, nome: 'Bahia - Observação Comportamental/STOPWORK', centro_custo_id: '1', is_respostas_obrigatoria: 0, is_gera_nao_conformidade: 1 },
        { id: 2, nome: 'Bahia - Checklist de Segurança', centro_custo_id: '2', is_respostas_obrigatoria: 1, is_gera_nao_conformidade: 1 },
    ];

    const checklistEstruturaItemsData = [
        {
            id: 1,
            checklist_estrutura_id: 1,
            checklist_grupo_id: 1,
            checklist_sub_grupo: 'Comportamento',
            checklist_item_id: 1,
            checklist_item_nome: 'Uso correto de EPI',
            checklist_alternativa_id: 1,
            checklist_alternativas: "Ausente ou não utilizado, Em condições inseguras/Improvisação, Impróprio para o serviço, Indisponíveis, Usado incorretamente",
            alternativa_inconformidades: "Ausente ou não utilizado, Em condições inseguras/Improvisação, Impróprio para o serviço, Indisponíveis, Usado incorretamente",
            is_foto_obrigatoria: 0,
            is_desc_nconf_required: 0,
            num_ordem: 1
        },
        {
            id: 2,
            checklist_estrutura_id: 1,
            checklist_grupo_id: 1,
            checklist_sub_grupo: 'Comportamento',
            checklist_item_id: 2,
            checklist_item_nome: 'Postura segura',
            checklist_alternativa_id: 2,
            checklist_alternativas: "Adequados - Não seguidos/Não entendidos, Inadequados, Indisponíveis /Desconhecido, Inexistentes",
            alternativa_inconformidades: "Adequados - Não seguidos/Não entendidos, Inadequados, Indisponíveis /Desconhecido, Inexistentes",
            is_foto_obrigatoria: 0,
            is_desc_nconf_required: 0,
            num_ordem: 2
        },
        {
            id: 3,
            checklist_estrutura_id: 1,
            checklist_grupo_id: 1,
            checklist_sub_grupo: 'Comportamento',
            checklist_item_id: 3,
            checklist_item_nome: 'Postura segura',
            checklist_alternativa_id: 3,
            checklist_alternativas: "Adequados - Não seguidos/Não entendidos, Inadequados, Indisponíveis /Desconhecido, Inexistentes",
            alternativa_inconformidades: "Adequados - Não seguidos/Não entendidos, Inadequados, Indisponíveis /Desconhecido, Inexistentes",
            is_foto_obrigatoria: 0,
            is_desc_nconf_required: 0,
            num_ordem: 3
        },
        {
            id: 4,
            checklist_estrutura_id: 1,
            checklist_grupo_id: 1,
            checklist_sub_grupo: 'Comportamento',
            checklist_item_id: 4,
            checklist_item_nome: 'Postura insegura',
            checklist_alternativa_id: 4,
            checklist_alternativas: "Adequados - Não seguidos/Não entendidos, Inadequados, Indisponíveis /Desconhecido, Inexistentes",
            alternativa_inconformidades: "Adequados - Não seguidos/Não entendidos, Inadequados, Indisponíveis /Desconhecido, Inexistentes",
            is_foto_obrigatoria: 0,
            is_desc_nconf_required: 0,
            num_ordem: 4
        },
        {
            id: 5,
            checklist_estrutura_id: 1,
            checklist_grupo_id: 1,
            checklist_sub_grupo: 'Comportamento',
            checklist_item_id: 5,
            checklist_item_nome: 'Envolvimento com a atividade',
            checklist_alternativa_id: null,
            checklist_alternativas: null,
            alternativa_inconformidades: null,
            is_foto_obrigatoria: 0,
            is_desc_nconf_required: 1,
            num_ordem: 5
        },
    ];

    const funcionariosData = [
        { cpf: '12345678901', nome: 'João Silva', matricula: '001', cargo_nome: 'Encarregado' },
        { cpf: '12345678902', nome: 'Maria Oliveira', matricula: '002', cargo_nome: 'Supervisor' },
        { cpf: '12345678903', nome: 'Carlos Souza', matricula: '003', cargo_nome: 'Coordenador' },
        { cpf: '12345678904', nome: 'Ana Santos', matricula: '004', cargo_nome: 'Gerente' },
    ];

    const equipesData = [
        {
            id: 1, nome: 'Equipe A',
            centro_custo_id: '1',
            encarregado_cpf: '12345678901',
            supervisor_cpf: '12345678902',
            coordenador_cpf: '12345678902',
            gerente_cpf: '12345678904'
        },
        {
            id: 2, nome: 'Equipe B',
            centro_custo_id: '2',
            encarregado_cpf: '12345678901',
            supervisor_cpf: '12345678902',
            coordenador_cpf: '12345678902',
            gerente_cpf: ''
        },
    ];

    const veiculosData = [
        { id: 'ABC123', nome: 'Veículo A', centro_custo_id: '1' },
        { id: 'DEF456', nome: 'Veículo B', centro_custo_id: '2' },
    ];

    const checklistRealizadosData = [
        {
            checklist_grupo_id: 1,
            checklist_estrutura_id: 1,
            centro_custo_id: '1',
            localidade_cidade_id: 1,
            equipe_id: 1,
            veiculo_id: 'ABC123',
            area: 'URBANA',
            date: new Date().toISOString(),
            date_fim: null,
            observacao: null,
            encarregado_cpf: '12345678901',
            supervisor_cpf: '12345678902',
            coordenador_cpf: '12345678903',
            gerente_cpf: '12345678904',
            is_finalizado: 0,
            is_user_declarou_conformidade: 0,
            created_at: new Date().toISOString(),
        },
        {
            checklist_grupo_id: 2,
            checklist_estrutura_id: 2,
            centro_custo_id: '2',
            localidade_cidade_id: 8,
            equipe_id: 2,
            veiculo_id: 'DEF456',
            area: 'RURAL',
            date: new Date().toISOString(),
            date_fim: null,
            observacao: null,
            encarregado_cpf: '12345678901',
            supervisor_cpf: '12345678902',
            coordenador_cpf: '12345678903',
            gerente_cpf: '12345678904',
            is_finalizado: 0,
            is_user_declarou_conformidade: 0,
            created_at: new Date().toISOString(),
        },
        {
            checklist_grupo_id: 1,
            checklist_estrutura_id: 1,
            centro_custo_id: '1',
            localidade_cidade_id: 2,
            equipe_id: 1,
            veiculo_id: 'ABC123',
            area: 'URBANA',
            date: new Date().toISOString(),
            date_fim: null,
            observacao: null,
            encarregado_cpf: '12345678901',
            supervisor_cpf: '12345678902',
            coordenador_cpf: '12345678903',
            gerente_cpf: '12345678904',
            is_finalizado: 0,
            is_user_declarou_conformidade: 0,
            created_at: new Date().toISOString(),
        },
        {
            checklist_grupo_id: 2,
            checklist_estrutura_id: 2,
            centro_custo_id: '2',
            localidade_cidade_id: 9,
            equipe_id: 2,
            veiculo_id: 'DEF456',
            area: 'RURAL',
            date: new Date().toISOString(),
            date_fim: null,
            observacao: null,
            encarregado_cpf: '12345678901',
            supervisor_cpf: '12345678902',
            coordenador_cpf: '12345678903',
            gerente_cpf: '12345678904',
            is_finalizado: 0,
            is_user_declarou_conformidade: 0,
            created_at: new Date().toISOString(),
        },
        {
            checklist_grupo_id: 1,
            checklist_estrutura_id: 1,
            centro_custo_id: '1',
            localidade_cidade_id: 3,
            equipe_id: 1,
            veiculo_id: 'ABC123',
            area: 'URBANA',
            date: new Date().toISOString(),
            date_fim: null,
            observacao: null,
            encarregado_cpf: '12345678901',
            supervisor_cpf: '12345678902',
            coordenador_cpf: '12345678903',
            gerente_cpf: '12345678904',
            is_finalizado: 0,
            is_user_declarou_conformidade: 0,
            created_at: new Date().toISOString(),
        }
    ];

    console.log('Iniciando seed do banco de dados...');
    try {
        for (const item of centroCustosData) {
            await database.runAsync(
                `INSERT INTO centro_custos (id, nome) VALUES (?, ?)`,
                [item.id, item.nome]
            );
        }
        console.log('Inseridos centro_custos');
    } catch (error) {
        console.error(error);
    }

    try {
        for (const item of funcionariosData) {
            await database.runAsync(
                `INSERT INTO funcionarios (cpf, nome, matricula, cargo_nome) VALUES (?, ?, ?, ?)`,
                [item.cpf, item.nome, item.matricula, item.cargo_nome]
            );
        }
        console.log('Inseridos funcionarios');
    } catch (error) {
        console.error(error);
    }

    try {
        for (const item of checklistGruposData) {
            await database.runAsync(
                `INSERT INTO checklist_grupos (id, nome, nome_interno) VALUES (?, ?, ?)`,
                [item.id, item.nome, item.nome_interno]
            );
        }
        console.log('Inseridos checklist_grupos');
    } catch (error) {
        console.error(error);
    }

    try {
        for (const item of centroCustoEstruturasData) {
            await database.runAsync(
                `INSERT INTO centro_custo_estruturas (id, nome, centro_custo_id) VALUES (?, ?, ?)`,
                [item.id, item.nome, item.centro_custo_id]
            );
        }
        console.log('Inseridos centro_custo_estruturas');
    } catch (error) {
        console.error(error);
    }

    try {
        for (const item of checklistEstruturasData) {
            await database.runAsync(
                `INSERT INTO checklist_estruturas (id, nome, centro_custo_id, is_respostas_obrigatoria, is_gera_nao_conformidade) VALUES (?, ?, ?, ?, ?)`,
                [item.id, item.nome, item.centro_custo_id, item.is_respostas_obrigatoria, item.is_gera_nao_conformidade]
            );
        }
        console.log('Inseridos checklist_estruturas');
    } catch (error) {
        console.error(error);
    }

    try {
        for (const item of checklistEstruturaItemsData) {
            await database.runAsync(
                `INSERT INTO checklist_estrutura_items (
                    id, checklist_estrutura_id, checklist_grupo_id, checklist_sub_grupo, checklist_item_id, checklist_item_nome,
                    checklist_alternativa_id, checklist_alternativas, alternativa_inconformidades, is_foto_obrigatoria,
                    is_desc_nconf_required, num_ordem
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    item.num_ordem
                ]
            );
        }
        console.log('Inseridos checklist_estrutura_items');
    } catch (error) {
        console.error(error);
    }

    try {
        for (const item of localidadeCidadesData) {
            await database.runAsync(
                `INSERT INTO localidade_cidades (id, nome, centro_custo_id) VALUES (?, ?, ?)`,
                [item.id, item.nome, item.centro_custo_id]
            );
        }
        console.log('Inseridos localidade_cidades');
    } catch (error) {
        console.error(error);
    }

    try {
        for (const item of equipesData) {
            await database.runAsync(
                `INSERT INTO equipes (id, nome, centro_custo_id, encarregado_cpf, supervisor_cpf, coordenador_cpf, gerente_cpf) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
        console.log('Inseridos equipes');
    } catch (error) {
        console.error(error);
    }

    try {
        for (const item of veiculosData) {
            await database.runAsync(
                `INSERT INTO veiculos (id, nome, centro_custo_id) VALUES (?, ?, ?)`,
                [item.id, item.nome, item.centro_custo_id]
            );
        }
        console.log('Inseridos veiculos');
    } catch (error) {
        console.error(error);
    }

    try {
        for (let index = 0; index < 4; index++) {
            for (const item of checklistRealizadosData) {
                const res = await database.runAsync(
                    `INSERT INTO checklist_realizados (
                        checklist_grupo_id, checklist_estrutura_id, centro_custo_id, localidade_cidade_id, equipe_id, veiculo_id, area, date, 
                        date_fim, observacao, encarregado_cpf, supervisor_cpf, coordenador_cpf, gerente_cpf, is_finalizado, is_user_declarou_conformidade, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.checklist_grupo_id,
                        item.checklist_estrutura_id,
                        item.centro_custo_id,
                        item.localidade_cidade_id,
                        item.equipe_id,
                        item.veiculo_id,
                        item.area,
                        item.date,
                        item.date_fim,
                        item.observacao,
                        item.encarregado_cpf,
                        item.supervisor_cpf,
                        item.coordenador_cpf,
                        item.gerente_cpf,
                        item.is_finalizado,
                        item.is_user_declarou_conformidade,
                        item.created_at
                    ]
                );
                const lastId = res.lastInsertRowId;
                await database.runAsync(
                    `INSERT INTO checklist_realizado_funcionarios (checklist_realizado_id, funcionario_cpf) VALUES (?, ?)`,
                    [lastId, item.encarregado_cpf]
                );
                for (const itemEstrutura of checklistEstruturaItemsData) {
                    await database.runAsync(
                        `INSERT INTO checklist_realizado_items (checklist_realizado_id, checklist_item_id) VALUES (?, ?)`,
                        [lastId, itemEstrutura.checklist_item_id]
                    );
                }
            }
        }
        console.log('Inseridos checklist_realizados');
    } catch (error) {
        console.error(error);
    }
}