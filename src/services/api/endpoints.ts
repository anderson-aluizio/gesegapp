export const API_ENDPOINTS = {
    CENTRO_CUSTOS: '/centro-custos',
    FUNCIONARIOS: '/funcionarios',
    CHECKLIST_GRUPOS: '/checklist-grupos',
    CENTRO_CUSTO_ESTRUTURAS: '/centro-custo-estruturas',
    CHECKLIST_ESTRUTURAS: '/checklist-estruturas',
    CHECKLIST_ESTRUTURA_ITEMS: '/checklist-estrutura-items',
    CHECKLIST_ESTRUTURA_RISCOS: '/checklist-estrutura-riscos',
    CHECKLIST_ESTRUTURA_CONTROLE_RISCOS: '/checklist-estrutura-controle-riscos',
    LOCALIDADE_CIDADES: '/localidade-cidades',
    EQUIPES: '/equipes',
    VEICULOS: '/veiculos',
    CHECKLIST_REALIZADOS: '/checklist-realizados',
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
