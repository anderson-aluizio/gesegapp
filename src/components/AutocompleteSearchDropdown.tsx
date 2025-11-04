import { ChecklistEstruturaDatabase, useChecklistEstruturaDatabase } from '@/database/Models/useChecklistEstruturaDatabase';
import { EquipeDatabase, useEquipeDatabase } from '@/database/Models/useEquipeDatabase';
import { FuncionarioDatabase, useFuncionarioDatabase } from '@/database/Models/useFuncionarioDatabase';
import { LocalidadeCidadeDatabase, useLocalidadeCidadeDatabase } from '@/database/Models/useLocalidadeCidadeDatabase';
import { useVeiculoDatabase, VeiculoDatabase } from '@/database/Models/useVeiculoDatabase';
import React, { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { AutocompleteDropdown, type AutocompleteDropdownItem } from 'react-native-autocomplete-dropdown';

export type AutocompleteDropdownOption = AutocompleteDropdownItem;

export interface AutocompleteSearchDropdownRef {
    clear: () => void;
}

type AutocompleteSearchDropdownProps = {
    listName?: string;
    extraParam?: { centro_custo_id?: string, grupo_id?: string };
    initialSearch?: string;
    label: string;
    placeholder?: string;
    value?: string | null;
    disable?: boolean;
    returnObject?: boolean;
    isMultiple?: boolean;
    initialItems?: Array<AutocompleteDropdownOption>;
    initialSelectedItems?: Array<AutocompleteDropdownOption>;
    onValueChange: (value: string | object | null | Array<string | object>) => void;
}

const AutocompleteSearchDropdown = forwardRef<AutocompleteSearchDropdownRef, AutocompleteSearchDropdownProps>((props, ref) => {
    const localidadeCidadeDb = useLocalidadeCidadeDatabase();
    const funcionarioDb = useFuncionarioDatabase();
    const veiculoDb = useVeiculoDatabase();
    const equipeDb = useEquipeDatabase();
    const checklistEstruturaDb = useChecklistEstruturaDatabase();

    const autocompleteRef = useRef<any>(null);

    const [suggestionsList, setSuggestionsList] = useState<AutocompleteDropdownOption[]>(props.initialItems || []);
    const [selectedItem, setSelectedItem] = useState<AutocompleteDropdownOption | null>(null);
    const [selectedItems, setSelectedItems] = useState<AutocompleteDropdownOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPropsLoading, setIsPropsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    const handleClear = useCallback(() => {
        if (props.isMultiple) {
            setSelectedItems([]);
            setSuggestionsList(props.initialItems || []);
            if (isInitialized) {
                props.onValueChange([]);
            }
        } else {
            setSelectedItem(null);
            setSuggestionsList([]);
            if (isInitialized) {
                props.onValueChange(null);
            }
        }
        // Also clear the autocomplete input
        if (autocompleteRef.current?.clear) {
            autocompleteRef.current.clear();
        }
    }, [props.isMultiple, props.initialItems, isInitialized, props.onValueChange]);

    // Expose handleClear via ref
    useImperativeHandle(ref, () => ({
        clear: handleClear
    }), [handleClear]);

    useEffect(() => {
        if (props.initialItems) {
            if (props.isMultiple) {
                // For multiple selection, initialize with provided selected items or empty array
                const initialSelected = props.initialSelectedItems || [];
                setSelectedItems(initialSelected);

                // Filter out selected items from suggestions
                const filteredSuggestions = props.initialItems.filter(item =>
                    !initialSelected.some(selected => selected.id === item.id)
                );
                setSuggestionsList(filteredSuggestions);
            } else {
                setSuggestionsList(props.initialItems);
                if (props.value) {
                    const foundItem = props.initialItems.find(item => item.id === props.value);
                    if (foundItem) {
                        setSelectedItem(foundItem);
                    }
                }
            }

            setTimeout(() => {
                setIsPropsLoading(false);
            }, 1000);
        } else {
            setIsPropsLoading(false);
        }
        setTimeout(() => {
            setIsInitialized(true);
        }, 1200);
    }, [props.value, props.initialItems, props.isMultiple, props.initialSelectedItems]);

    const loadCidadesByParams = async (
        centroCustoId: string,
        query: string
    ): Promise<AutocompleteDropdownOption[]> => {
        const res = await localidadeCidadeDb.getByParams({
            centro_custo_id: centroCustoId,
            query: query,
        });
        if (!res || res.length === 0) {
            return [];
        }
        return res.map((item: LocalidadeCidadeDatabase) => ({
            id: String(item.id),
            title: item.nome || '',
        }));
    }

    const loadFuncionariosByParams = async (query: string): Promise<AutocompleteDropdownOption[]> => {
        const res = await funcionarioDb.getByParams(query);
        if (!res || res.length === 0) {
            return [];
        }
        return res.map((item: FuncionarioDatabase) => ({
            id: String(item.cpf),
            title: item.nome || '',
        }));
    }

    const loadVeiculosByParams = async (query: string): Promise<AutocompleteDropdownOption[]> => {
        const res = await veiculoDb.getByParams(query);
        if (!res || res.length === 0) {
            return [];
        }
        return res.map((item: VeiculoDatabase) => ({
            id: String(item.id),
            title: String(item.id) || '',
        }));
    }

    const loadEquipesByParams = async (centroCustoId: string, query: string): Promise<AutocompleteDropdownOption[]> => {
        const res = await equipeDb.getByParams(centroCustoId, query);
        if (!res || res.length === 0) {
            return [];
        }
        return res.map((item: EquipeDatabase) => ({
            id: String(item.id),
            title: String(item.nome) || '',
        }));
    }

    const loadChecklistEstruturasByParams = async (
        centroCustoId: string,
        grupoId: number,
        query: string
    ): Promise<AutocompleteDropdownOption[]> => {
        const res = await checklistEstruturaDb.getByParams({
            centro_custo_id: centroCustoId,
            grupo_id: grupoId,
            query: query,
        });
        if (!res || res.length === 0) {
            return [];
        }
        return res.map((item: ChecklistEstruturaDatabase) => ({
            id: String(item.id),
            title: String(item.modelo) || '',
        }));
    }

    const getSuggestions = useCallback(async (q: string) => {
        const filterToken = q.toLowerCase();

        if (filterToken.length < 2) {
            let initialSuggestions = props.initialItems || [];

            // Filter out selected items in multiple mode
            if (props.isMultiple) {
                initialSuggestions = initialSuggestions.filter(item =>
                    !selectedItems.some(selected => selected.id === item.id)
                );
            }

            setSuggestionsList(initialSuggestions);
            return;
        }

        if (!props.listName) {
            if (props.initialItems) {
                let filtered = props.initialItems.filter(item =>
                    item.title?.toLowerCase().includes(filterToken)
                );

                // Filter out selected items in multiple mode
                if (props.isMultiple) {
                    filtered = filtered.filter(item =>
                        !selectedItems.some(selected => selected.id === item.id)
                    );
                }

                setSuggestionsList(filtered);
            }
            return;
        }

        setLoading(true);

        try {
            let results: AutocompleteDropdownOption[] = [];

            switch (props.listName) {
                case 'cidades':
                    results = await loadCidadesByParams(props.extraParam?.centro_custo_id || '', filterToken);
                    break;
                case 'funcionarios':
                    results = await loadFuncionariosByParams(filterToken);
                    break;
                case 'veiculos':
                    results = await loadVeiculosByParams(filterToken);
                    break;
                case 'equipes':
                    results = await loadEquipesByParams(props.extraParam?.centro_custo_id || '', filterToken);
                    break;
                case 'estruturas':
                    results = await loadChecklistEstruturasByParams(
                        props.extraParam?.centro_custo_id || '',
                        Number(props.extraParam?.grupo_id) || 0,
                        filterToken
                    );
                    break;
                default:
                    results = [];
            }

            // Filter out selected items in multiple mode
            if (props.isMultiple) {
                results = results.filter(item =>
                    !selectedItems.some(selected => selected.id === item.id)
                );
            }

            setSuggestionsList(results);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestionsList([]);
        } finally {
            setLoading(false);
        }
    }, [props.listName, props.extraParam, props.initialItems, props.isMultiple, selectedItems]);

    const handleSelectItem = (item: AutocompleteDropdownItem | null) => {
        if (!isInitialized) {
            return;
        }

        if (props.isMultiple) {
            if (!item) return;

            const isAlreadySelected = selectedItems.some(selectedItem => selectedItem.id === item.id);

            let newSelectedItems: AutocompleteDropdownOption[];
            if (isAlreadySelected) {
                // Remove item if already selected
                newSelectedItems = selectedItems.filter(selectedItem => selectedItem.id !== item.id);
            } else {
                // Add item if not selected
                newSelectedItems = [...selectedItems, item];
            }

            setSelectedItems(newSelectedItems);

            // Update suggestions list to exclude selected items
            const updatedSuggestions = suggestionsList.filter(suggestion =>
                !newSelectedItems.some(selected => selected.id === suggestion.id)
            );
            setSuggestionsList(updatedSuggestions);

            // Return array of values based on returnObject prop
            if (props.returnObject) {
                props.onValueChange(newSelectedItems);
            } else {
                props.onValueChange(newSelectedItems.map(selectedItem => selectedItem.id));
            }

            // Clear the input after selection in multiple mode
            setSelectedItem(null);
            // Force clear the input text by calling clear method
            setTimeout(() => {
                if (autocompleteRef.current?.clear) {
                    autocompleteRef.current.clear();
                }
            }, 100);
        } else {
            // Single selection logic (existing behavior)
            setSelectedItem(item);

            if (!item) {
                props.onValueChange(null);
                return;
            }

            if (props.returnObject) {
                const fullItem = item ? (suggestionsList.find(suggestion => suggestion.id === item.id) || item) : null;
                props.onValueChange(fullItem);
            } else {
                props.onValueChange(item.id);
            }
        }
    };

    const removeSelectedItem = (itemToRemove: AutocompleteDropdownOption) => {
        if (!props.isMultiple) return; // Only allow removal in multiple mode

        const newSelectedItems = selectedItems.filter(item => item.id !== itemToRemove.id);
        setSelectedItems(newSelectedItems);

        // Add the removed item back to suggestions list if it's not already there
        const isInSuggestions = suggestionsList.some(suggestion => suggestion.id === itemToRemove.id);
        if (!isInSuggestions) {
            setSuggestionsList(prevSuggestions => [...prevSuggestions, itemToRemove]);
        }

        if (props.returnObject) {
            props.onValueChange(newSelectedItems);
        } else {
            props.onValueChange(newSelectedItems.map(item => item.id));
        }
    };

    return (
        <View style={[
            styles.container,
            props.disable && styles.containerDisabled
        ]}>
            <Text style={[
                styles.label,
                props.disable && styles.labelDisabled
            ]}>
                {props.label}
            </Text>

            {isPropsLoading ? (
                <View style={[styles.cardPropsLoading]}>
                    <Text style={{ fontSize: 14, color: '#666' }}>Carregando...</Text>
                </View>
            ) : (
                <AutocompleteDropdown
                    ref={autocompleteRef}
                    clearOnFocus={true}
                    closeOnBlur={true}
                    closeOnSubmit={props.isMultiple ? true : false}
                    initialValue={props.isMultiple ? '' : (selectedItem || undefined)}
                    onSelectItem={handleSelectItem}
                    dataSet={suggestionsList}
                    onChangeText={getSuggestions}
                    onClear={handleClear}
                    textInputProps={{
                        placeholder: props.placeholder || (props.isMultiple ? 'Digite para pesquisar e selecionar múltiplos itens...' : 'Digite para pesquisar...'),
                        autoCorrect: false,
                        autoCapitalize: 'none',
                        style: [
                            styles.textInput,
                            props.disable && styles.textInputDisabled
                        ],
                        editable: !props.disable,
                    }}
                    rightButtonsContainerStyle={styles.rightButtonsContainer}
                    inputContainerStyle={[
                        styles.inputContainer,
                        props.disable && styles.inputContainerDisabled
                    ]}
                    suggestionsListContainerStyle={styles.suggestionsList}
                    containerStyle={styles.autocompleteContainer}
                    loading={loading}
                    useFilter={false}
                    showChevron={false}
                    showClear={true}
                    debounce={600}
                    EmptyResultComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {loading ? 'Carregando...' : 'Nenhum resultado encontrado'}
                            </Text>
                        </View>
                    }
                />
            )}

            {props.isMultiple && selectedItems.length > 0 && (
                <View style={styles.selectedItemsContainer}>
                    <Text style={styles.selectedItemsTitle}>
                        Itens Selecionados ({selectedItems.length})
                    </Text>
                    <View style={styles.selectedItemsList}>
                        {selectedItems.map((item, index) => (
                            <View key={`${item.id}-${index}`} style={styles.selectedItemChip}>
                                <Text style={styles.selectedItemText} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeSelectedItem(item)}
                                >
                                    <Text style={styles.removeButtonText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
});

AutocompleteSearchDropdown.displayName = 'AutocompleteSearchDropdown';

export default AutocompleteSearchDropdown;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    cardPropsLoading: {
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1.2,
        borderColor: '#e0e7ef',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
    },
    containerDisabled: {
        opacity: 0.6,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
        marginBottom: 0,
        paddingHorizontal: 4,
    },
    labelDisabled: {
        color: '#b0b0b0',
    },
    autocompleteContainer: {
        flexGrow: 1,
        flexShrink: 1,
    },
    inputContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1.2,
        borderColor: '#e0e7ef',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
    },
    inputContainerDisabled: {
        backgroundColor: '#f0f1f3',
        borderColor: '#e0e7ef',
    },
    textInput: {
        fontSize: 14,
        color: '#222',
        fontWeight: '500',
        backgroundColor: 'transparent',
    },
    textInputDisabled: {
        color: '#b0b0b0',
    },
    rightButtonsContainer: {
        paddingRight: 12,
        paddingLeft: 8,
        alignItems: 'center',
    },
    suggestionsList: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        maxHeight: 250,
    },
    selectedItemsContainer: {
        marginTop: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    selectedItemsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 8,
    },
    selectedItemsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectedItemChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0439c9',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 4,
        minWidth: '100%',
    },
    selectedItemText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
        flex: 1,
        marginRight: 4,
    },
    removeButton: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    removeButtonText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
        lineHeight: 12,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
});
