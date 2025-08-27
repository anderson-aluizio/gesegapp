import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';
import { ChecklistRealizadoItemsDatabaseWithItem } from '@/database/Models/useChecklisRealizadoItemsDatabase';
import { ChecklistRealizadoFuncionarioDatabase } from '@/database/Models/useChecklistRealizadoFuncionarioDatabase';
import AutocompleteSearchDropdown from '@/components/AutocompleteSearchDropdown';

export interface ChecklistItemProps {
    item: ChecklistRealizadoItemsDatabaseWithItem;
    funcionarios: ChecklistRealizadoFuncionarioDatabase[];
    onAlternativaSelect: (itemId: number, resposta: string) => void;
    onFuncionarioSelection: (itemId: number, selectedFuncionarios: string[]) => void;
    onDescricaoInput: (itemId: number, value: string) => void;
    onClearResponse: (itemId: number) => void;
}

const ChecklistItem = memo(({
    item,
    funcionarios,
    onAlternativaSelect,
    onFuncionarioSelection,
    onDescricaoInput,
    onClearResponse
}: ChecklistItemProps) => {
    const isInconforme = useMemo(() =>
        Boolean(item.is_gera_nao_conformidade &&
            item.alternativa_inconformidades_array?.length &&
            item.alternativa_inconformidades_array.includes(item.resposta || '')),
        [item.is_gera_nao_conformidade, item.alternativa_inconformidades_array, item.resposta]
    );

    const funcionarioOptions = useMemo(() =>
        funcionarios.map(func => ({
            id: func.funcionario_cpf ? String(func.funcionario_cpf) : '',
            title: func.funcionario_nome ? String(func.funcionario_nome) : `Funcionário ${func.funcionario_cpf ? String(func.funcionario_cpf) : ''}`
        })),
        [funcionarios]
    );

    const selectedFuncionarios = useMemo(() => {
        if (!item.inconformidade_funcionarios_array || item.inconformidade_funcionarios_array.length === 0) {
            return [];
        }

        return funcionarios
            .filter(func => {
                const cpf = func.funcionario_cpf ? String(func.funcionario_cpf) : '';
                return cpf && item.inconformidade_funcionarios_array?.includes(cpf);
            })
            .map(func => ({
                id: String(func.funcionario_cpf || ''),
                title: func.funcionario_nome ? String(func.funcionario_nome) : `Funcionário ${String(func.funcionario_cpf || '')}`
            }));
    }, [item.inconformidade_funcionarios_array, funcionarios]);

    const handleAlternativaChange = useCallback((value: string) => {
        onAlternativaSelect(item.id, value);
    }, [item.id, onAlternativaSelect]);

    const handleFuncionarioChange = useCallback((selectedItems: string[]) => {
        onFuncionarioSelection(item.id, selectedItems);
    }, [item.id, onFuncionarioSelection]);

    const handleDescricaoChange = useCallback((value: string) => {
        onDescricaoInput(item.id, value);
    }, [item.id, onDescricaoInput]);

    const handleClear = useCallback(() => {
        onClearResponse(item.id);
    }, [item.id, onClearResponse]);

    return (
        <View style={[
            styles.questionCard,
            item.is_respondido && styles.questionCardCompleted
        ]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderTop}>
                    <Text variant="labelSmall" style={styles.subGrupoBadge}>
                        {item.checklist_sub_grupo}
                    </Text>
                    {item.is_respondido && (
                        <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>✓ Respondido</Text>
                        </View>
                    )}
                </View>
                <Text variant="labelLarge" style={[
                    styles.questionTitle,
                    item.is_respondido && styles.questionTitleCompleted
                ]}>
                    {item.checklist_item_nome}
                </Text>
            </View>
            {item.is_respondido && (
                <View style={styles.cardHeaderLeft}>
                    <Button
                        mode="text"
                        compact
                        onPress={handleClear}
                        textColor="#dc2626"
                        icon="close-circle-outline"
                    >
                        Limpar
                    </Button>
                </View>
            )}
            <View style={{ marginVertical: 8 }}>
                {(!item.checklist_alternativas_array || item.checklist_alternativas_array.length === 0) ? (
                    <TextInput
                        label="Digite uma resposta para este item"
                        value={item.resposta ? String(item.resposta) : ''}
                        onChangeText={handleAlternativaChange}
                        mode="outlined"
                        theme={{ roundness: 8 }}
                        outlineColor="#d1d5db"
                        activeOutlineColor="#0439c9"
                        placeholder="Resposta"
                    />
                ) : (
                    <RadioButton.Group
                        onValueChange={handleAlternativaChange}
                        value={item.resposta ? String(item.resposta) : ''}
                    >
                        {item.checklist_alternativas_array.map((alt: string) => (
                            <RadioButton.Item
                                key={alt.trim()}
                                label={String(alt).trim()}
                                value={String(alt).trim()}
                                mode="android"
                                style={styles.radioItem}
                                labelStyle={styles.radioLabel}
                            />
                        ))}
                    </RadioButton.Group>
                )}

                {isInconforme && (
                    <View style={styles.funcionarioSelection}>
                        <AutocompleteSearchDropdown
                            isMultiple={true}
                            label="Colaborador(es)"
                            placeholder="Selecione os colaboradores"
                            initialItems={funcionarioOptions}
                            initialSelectedItems={selectedFuncionarios}
                            onValueChange={(selectedItems) => {
                                const selectedValues = Array.isArray(selectedItems) ?
                                    selectedItems.map(item => String(item)) :
                                    [];
                                handleFuncionarioChange(selectedValues);
                            }}
                        />
                    </View>
                )}
                {item.is_desc_nconf_required &&
                    item.is_gera_nao_conformidade &&
                    item.inconformidade_funcionarios_array?.length && (
                        <TextInput
                            label="Descrição da não conformidade"
                            value={item.descricao || ''}
                            onChangeText={handleDescricaoChange}
                            mode="outlined"
                            theme={{ roundness: 8 }}
                            outlineColor="#d1d5db"
                            activeOutlineColor="#0439c9"
                            placeholder="Resposta"
                            multiline
                            numberOfLines={3}
                        />
                    )}
            </View>
        </View>
    );
});

ChecklistItem.displayName = 'ChecklistItem';

const styles = StyleSheet.create({
    questionCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    questionCardCompleted: {
        backgroundColor: '#f0f9f4',
        borderColor: '#10b981',
        shadowColor: '#10b981',
        shadowOpacity: 0.1,
    },
    cardHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    cardHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 8,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        flexShrink: 0,
    },
    questionTitle: {
        color: '#222',
        flex: 1,
        flexWrap: 'wrap',
        marginRight: 8,
    },
    questionTitleCompleted: {
        color: '#065f46',
        fontWeight: '600',
    },
    subGrupoBadge: {
        backgroundColor: '#0439c9',
        color: '#fff',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 2,
        alignSelf: 'flex-start',
    },
    completedBadge: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    completedBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    radioItem: {
        paddingVertical: 2,
        marginLeft: -8,
    },
    radioLabel: {
        fontSize: 16,
        color: '#444',
    },
    funcionarioSelection: {
        marginTop: 6,
        padding: 6,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
});

export default ChecklistItem;
