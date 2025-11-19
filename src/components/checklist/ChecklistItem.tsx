import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { RadioButton, Text, TextInput } from 'react-native-paper';
import { ChecklistRealizadoItemsDatabaseWithItem } from '@/database/models/useChecklisRealizadoItemsDatabase';
import { ChecklistRealizadoFuncionarioDatabase } from '@/database/models/useChecklistRealizadoFuncionarioDatabase';
import AutocompleteSearchDropdown from '@/components/ui/inputs/AutocompleteSearchDropdown';
import PhotoPicker from '@/components/ui/inputs/PhotoPicker';

export interface ChecklistItemProps {
    item: ChecklistRealizadoItemsDatabaseWithItem;
    funcionarios: ChecklistRealizadoFuncionarioDatabase[];
    onAlternativaSelect: (itemId: number, resposta: string) => void;
    onFuncionarioSelection: (itemId: number, selectedFuncionarios: string[]) => void;
    onDescricaoInput: (itemId: number, value: string) => void;
    onClearResponse: (itemId: number) => void;
    onPhotoSelect: (itemId: number, fotoPath: string) => void;
    onPhotoRemove: (itemId: number) => void;
}

const ChecklistItem = memo(({
    item,
    funcionarios,
    onAlternativaSelect,
    onFuncionarioSelection,
    onDescricaoInput,
    onClearResponse,
    onPhotoSelect,
    onPhotoRemove
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

    const handlePhotoSelect = useCallback((fotoPath: string) => {
        onPhotoSelect(item.id, fotoPath);
    }, [item.id, onPhotoSelect]);

    const handlePhotoRemove = useCallback(() => {
        onPhotoRemove(item.id);
    }, [item.id, onPhotoRemove]);

    return (
        <View style={[
            styles.questionCard,
            item.is_respondido && styles.questionCardCompleted
        ]}>
            <View style={styles.cardHeader}>
                {item.is_respondido && (
                    <View style={styles.cardHeaderTop}>
                        <Text variant="labelSmall" style={styles.respondidoBadge}>
                            ✓ Respondido
                        </Text>
                        <Text variant="labelSmall" style={styles.clearBadge} onPress={handleClear}>
                            × Limpar
                        </Text>
                    </View>
                )}
                <Text variant="labelSmall" style={styles.subGrupoBadge}>
                    {item.checklist_sub_grupo ?? 'N/A'}
                </Text>
                <Text variant="labelLarge" style={[
                    styles.questionTitle,
                    item.is_respondido && styles.questionTitleCompleted
                ]}>
                    {item.checklist_item_nome}
                </Text>
            </View>
            <View style={{ marginVertical: 8, gap: 12 }}>
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
                        <View>
                            <View style={styles.header}>
                                <Text variant="labelMedium" style={styles.label}>
                                    Descrição <Text style={styles.required}>*</Text>
                                </Text>
                            </View>
                            <TextInput
                                label="Informe detalhes da não conformidade"
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
                        </View>
                    )}
                <PhotoPicker
                    fotoPath={item.foto_path}
                    onPhotoSelect={handlePhotoSelect}
                    onPhotoRemove={handlePhotoRemove}
                    isFotoObrigatoria={item.is_foto_obrigatoria}
                />
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
        marginBottom: 6,
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
        fontSize: 11,
    },
    respondidoBadge: {
        backgroundColor: '#10b981',
        color: '#fff',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        fontSize: 11,
    },
    clearBadge: {
        backgroundColor: '#f02323ff',
        color: '#fff',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        fontSize: 11,
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
    container: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    header: {
        marginBottom: 8,
    },
    label: {
        color: '#444',
        fontWeight: '600',
    },
    required: {
        color: '#f02323',
    },
});

export default ChecklistItem;
