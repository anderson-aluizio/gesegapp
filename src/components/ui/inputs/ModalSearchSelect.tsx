import React, { useCallback, useEffect, useState, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Portal, Modal } from 'react-native-paper';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { useSearchResolver, SearchSelectOption } from './useSearchResolver';

export type { SearchSelectOption } from './useSearchResolver';

export interface ModalSearchSelectRef {
    clear: () => void;
}

type ModalSearchSelectProps = {
    listName?: string;
    extraParam?: { centro_custo_id?: string; grupo_id?: string };
    initialSearch?: string;
    label: string;
    placeholder?: string;
    value?: string | null;
    disable?: boolean;
    returnObject?: boolean;
    isMultiple?: boolean;
    initialItems?: SearchSelectOption[];
    initialSelectedItems?: SearchSelectOption[];
    onValueChange: (value: string | object | null | (string | object)[]) => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const ModalSearchSelect = forwardRef<ModalSearchSelectRef, ModalSearchSelectProps>((props, ref) => {
    const {
        isMultiple,
        initialItems,
        onValueChange,
        listName,
        extraParam,
        placeholder,
        disable,
        returnObject,
        value,
        label,
        initialSearch,
        initialSelectedItems,
    } = props;

    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const searchResolver = useSearchResolver(listName, extraParam);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<TextInput>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SearchSelectOption | null>(null);
    const [selectedItems, setSelectedItems] = useState<SearchSelectOption[]>([]);
    const [suggestionsList, setSuggestionsList] = useState<SearchSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isPropsLoading, setIsPropsLoading] = useState(true);

    // Multi-select: temp selections inside the modal before confirming
    const [tempSelectedItems, setTempSelectedItems] = useState<SearchSelectOption[]>([]);

    const handleClear = useCallback(() => {
        if (isMultiple) {
            setSelectedItems([]);
            setSuggestionsList(initialItems || []);
            if (isInitialized) {
                onValueChange([]);
            }
        } else {
            setSelectedItem(null);
            setSuggestionsList([]);
            if (isInitialized) {
                onValueChange(null);
            }
        }
    }, [isMultiple, initialItems, isInitialized, onValueChange]);

    useImperativeHandle(ref, () => ({
        clear: handleClear,
    }), [handleClear]);

    // Initialize from props
    useEffect(() => {
        if (initialItems) {
            if (isMultiple) {
                const initialSelected = initialSelectedItems || [];
                setSelectedItems(initialSelected);
                const filteredSuggestions = initialItems.filter(
                    item => !initialSelected.some(selected => selected.id === item.id)
                );
                setSuggestionsList(filteredSuggestions);
            } else {
                setSuggestionsList(initialItems);
                if (value) {
                    const foundItem = initialItems.find(item => item.id === value);
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
    }, [value, initialItems, isMultiple, initialSelectedItems]);

    // Load initial search results (for DB items with pre-populated value)
    useEffect(() => {
        if (initialSearch && searchResolver && !selectedItem) {
            searchResolver(initialSearch).then(results => {
                if (results.length > 0) {
                    const foundItem = value
                        ? results.find(r => r.id === value) || results[0]
                        : results[0];
                    setSelectedItem(foundItem);
                }
            });
        }
    }, [initialSearch, searchResolver]);

    const getSuggestions = useCallback(async (q: string) => {
        const filterToken = q.toLowerCase();

        // Static items mode (no listName / no searchResolver)
        if (!searchResolver) {
            if (initialItems) {
                let filtered = filterToken.length < 2
                    ? initialItems
                    : initialItems.filter(item =>
                        item.title?.toLowerCase().includes(filterToken)
                    );

                if (isMultiple) {
                    filtered = filtered.filter(item =>
                        !tempSelectedItems.some(selected => selected.id === item.id)
                    );
                }

                setSuggestionsList(filtered);
            }
            return;
        }

        // DB search mode — require minimum 2 characters
        if (filterToken.length < 2) {
            setSuggestionsList([]);
            return;
        }

        setLoading(true);
        try {
            let results = await searchResolver(filterToken);

            if (isMultiple) {
                results = results.filter(item =>
                    !tempSelectedItems.some(selected => selected.id === item.id)
                );
            }

            setSuggestionsList(results);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestionsList([]);
        } finally {
            setLoading(false);
        }
    }, [searchResolver, initialItems, isMultiple, tempSelectedItems]);

    const handleSearchChange = useCallback((text: string) => {
        setSearchText(text);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            getSuggestions(text);
        }, 400);
    }, [getSuggestions]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const openModal = useCallback(() => {
        if (disable) return;
        setSearchText('');
        if (isMultiple) {
            setTempSelectedItems([...selectedItems]);
        }
        // Show initial items when opening
        if (!searchResolver && initialItems) {
            if (isMultiple) {
                const filtered = initialItems.filter(item =>
                    !selectedItems.some(selected => selected.id === item.id)
                );
                setSuggestionsList(filtered);
            } else {
                setSuggestionsList(initialItems);
            }
        } else {
            setSuggestionsList([]);
        }
        setModalVisible(true);
    }, [disable, isMultiple, selectedItems, searchResolver, initialItems]);

    const closeModal = useCallback(() => {
        setModalVisible(false);
        setSearchText('');
        setSuggestionsList([]);
    }, []);

    const handleSelectItem = useCallback((item: SearchSelectOption) => {
        if (!isInitialized) return;

        if (isMultiple) {
            const isAlreadySelected = tempSelectedItems.some(s => s.id === item.id);
            if (isAlreadySelected) {
                setTempSelectedItems(prev => prev.filter(s => s.id !== item.id));
            } else {
                setTempSelectedItems(prev => [...prev, item]);
            }
            // Refresh suggestions to hide/show selected items
            if (!searchResolver && initialItems) {
                const newTemp = isAlreadySelected
                    ? tempSelectedItems.filter(s => s.id !== item.id)
                    : [...tempSelectedItems, item];
                const filterToken = searchText.toLowerCase();
                let filtered = filterToken.length < 2
                    ? initialItems
                    : initialItems.filter(i => i.title?.toLowerCase().includes(filterToken));
                filtered = filtered.filter(i => !newTemp.some(s => s.id === i.id));
                setSuggestionsList(filtered);
            }
        } else {
            setSelectedItem(item);
            setModalVisible(false);
            setSearchText('');

            if (returnObject) {
                onValueChange(item);
            } else {
                onValueChange(item.id);
            }
        }
    }, [isInitialized, isMultiple, tempSelectedItems, searchResolver, initialItems, searchText, returnObject, onValueChange]);

    const handleConfirmMultiple = useCallback(() => {
        setSelectedItems(tempSelectedItems);
        setModalVisible(false);
        setSearchText('');

        if (returnObject) {
            onValueChange(tempSelectedItems);
        } else {
            onValueChange(tempSelectedItems.map(item => item.id));
        }
    }, [tempSelectedItems, returnObject, onValueChange]);

    const removeSelectedItem = useCallback((itemToRemove: SearchSelectOption) => {
        if (!isMultiple) return;

        const newSelectedItems = selectedItems.filter(item => item.id !== itemToRemove.id);
        setSelectedItems(newSelectedItems);

        if (returnObject) {
            onValueChange(newSelectedItems);
        } else {
            onValueChange(newSelectedItems.map(item => item.id));
        }
    }, [isMultiple, selectedItems, returnObject, onValueChange]);

    const triggerText = useMemo(() => {
        if (isMultiple) {
            return selectedItems.length > 0
                ? `${selectedItems.length} selecionado(s)`
                : placeholder || 'Selecione...';
        }
        return selectedItem?.title || placeholder || 'Selecione...';
    }, [isMultiple, selectedItems, selectedItem, placeholder]);

    const hasValue = isMultiple ? selectedItems.length > 0 : !!selectedItem;

    const renderSuggestionItem = useCallback(({ item }: { item: SearchSelectOption }) => {
        const isSelected = isMultiple && tempSelectedItems.some(s => s.id === item.id);
        return (
            <TouchableOpacity
                style={[styles.suggestionItem, isSelected && styles.suggestionItemSelected]}
                onPress={() => handleSelectItem(item)}
            >
                <Text style={styles.suggestionItemText} numberOfLines={1}>
                    {item.title}
                </Text>
                {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                )}
            </TouchableOpacity>
        );
    }, [isMultiple, tempSelectedItems, handleSelectItem, styles]);

    const renderEmptyList = useCallback(() => {
        if (loading) {
            return (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.emptyText}>Carregando...</Text>
                </View>
            );
        }

        if (searchResolver && searchText.length < 2) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Digite ao menos 2 caracteres para pesquisar</Text>
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
            </View>
        );
    }, [loading, searchResolver, searchText, colors.primary, styles]);

    return (
        <View style={styles.container}>
            <Text style={[styles.label, disable && styles.labelDisabled]}>
                {label}
            </Text>

            {isPropsLoading ? (
                <View style={styles.cardPropsLoading}>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>Carregando...</Text>
                </View>
            ) : disable ? (
                <View style={styles.disabledContainer}>
                    <Text style={styles.disabledText}>
                        {selectedItem?.title || placeholder || 'Campo desabilitado'}
                    </Text>
                </View>
            ) : (
                <>
                    <TouchableOpacity
                        style={styles.triggerField}
                        onPress={openModal}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.triggerText,
                                !hasValue && styles.triggerPlaceholder,
                            ]}
                            numberOfLines={1}
                        >
                            {triggerText}
                        </Text>
                        <View style={styles.triggerRight}>
                            {hasValue && (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleClear();
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={styles.clearButton}
                                >
                                    <Text style={styles.clearButtonText}>×</Text>
                                </TouchableOpacity>
                            )}
                            <Text style={styles.chevron}>▼</Text>
                        </View>
                    </TouchableOpacity>

                    {isMultiple && selectedItems.length > 0 && (
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
                </>
            )}

            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={closeModal}
                    contentContainerStyle={styles.modalContainer}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Text style={styles.modalCloseText}>Fechar</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalSearchContainer}>
                            <TextInput
                                ref={searchInputRef}
                                style={styles.modalSearchInput}
                                value={searchText}
                                onChangeText={handleSearchChange}
                                placeholder={placeholder || 'Digite para pesquisar...'}
                                placeholderTextColor={colors.textSecondary}
                                autoCorrect={false}
                                autoCapitalize="none"
                                autoFocus={true}
                            />
                            {loading && (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.primary}
                                    style={styles.searchLoading}
                                />
                            )}
                        </View>

                        <FlatList
                            data={suggestionsList}
                            keyExtractor={(item) => item.id}
                            renderItem={renderSuggestionItem}
                            ListEmptyComponent={renderEmptyList}
                            keyboardShouldPersistTaps="handled"
                            style={styles.modalList}
                        />

                        {isMultiple && (
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmMultiple}
                            >
                                <Text style={styles.confirmButtonText}>
                                    Confirmar ({tempSelectedItems.length})
                                </Text>
                            </TouchableOpacity>
                        )}
                    </KeyboardAvoidingView>
                </Modal>
            </Portal>
        </View>
    );
});

ModalSearchSelect.displayName = 'ModalSearchSelect';

export default ModalSearchSelect;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
    },
    cardPropsLoading: {
        padding: 12,
        backgroundColor: colors.cardBackground,
        borderRadius: 10,
        borderWidth: 1.2,
        borderColor: colors.cardBorder,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
    },
    disabledContainer: {
        padding: 12,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 10,
        borderWidth: 1.2,
        borderColor: colors.cardBorder,
        minHeight: 48,
        justifyContent: 'center',
    },
    disabledText: {
        fontSize: 14,
        color: colors.disabled,
        fontWeight: '500',
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 0,
        paddingHorizontal: 4,
    },
    labelDisabled: {
        color: colors.disabled,
    },
    triggerField: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 10,
        borderWidth: 1.2,
        borderColor: colors.cardBorder,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        paddingHorizontal: 12,
        minHeight: 48,
    },
    triggerText: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
        paddingVertical: 12,
    },
    triggerPlaceholder: {
        color: colors.textSecondary,
    },
    triggerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
        gap: 6,
    },
    clearButton: {
        padding: 2,
    },
    clearButtonText: {
        fontSize: 20,
        color: colors.textSecondary,
        fontWeight: 'bold',
        lineHeight: 22,
    },
    chevron: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    selectedItemsContainer: {
        marginTop: 12,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    selectedItemsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
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
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 4,
        minWidth: '100%',
    },
    selectedItemText: {
        fontSize: 12,
        color: colors.textOnPrimary,
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
        color: colors.textOnPrimary,
        fontWeight: 'bold',
        lineHeight: 12,
    },
    // Modal styles
    modalContainer: {
        backgroundColor: colors.surface,
        marginTop: SCREEN_HEIGHT * 0.15,
        flex: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    modalContent: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    modalCloseText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        backgroundColor: colors.cardBackground,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    searchLoading: {
        marginLeft: 10,
    },
    modalList: {
        flex: 1,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    suggestionItemSelected: {
        backgroundColor: colors.primary + '15',
    },
    suggestionItemText: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
    },
    checkmark: {
        fontSize: 18,
        color: colors.primary,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    confirmButton: {
        backgroundColor: colors.primary,
        margin: 16,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: colors.textOnPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
});
