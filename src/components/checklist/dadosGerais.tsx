import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { ChecklistRealizadoDatabase, useChecklisRealizadoDatabase } from '@/database/models/useChecklisRealizadoDatabase';
import { useEquipeDatabase } from '@/database/models/useEquipeDatabase';
import AutocompleteSearchDropdown, { AutocompleteDropdownOption } from '@/components/ui/inputs/AutocompleteSearchDropdown';

export default function DadosGeraisScreen(props: { checklistRealizado: ChecklistRealizadoDatabase; formUpdated: () => void; isUserOperacao: boolean }) {
    const [checklistRealizado, setChecklistRealizado] = useState<ChecklistRealizadoDatabase>(props.checklistRealizado);
    const checklistRealizadoDb = useChecklisRealizadoDatabase();
    const equipeDb = useEquipeDatabase();
    const isUserOperacao = props.isUserOperacao;

    useEffect(() => {
        setChecklistRealizado(props.checklistRealizado);
    }, [props.checklistRealizado]);

    const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
    const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>();
    const [selectedEquipe, setSelectedEquipe] = useState<string | null>();
    const [selectedVeiculo, setSelectedVeiculo] = useState<string | null>();
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [dialogDesc, setDialogDesc] = useState<string>('');

    const areas: AutocompleteDropdownOption[] = [
        { id: 'URBANA', title: 'URBANA' },
        { id: 'RURAL', title: 'RURAL' },
    ];
    useEffect(() => {
        setSelectedMunicipio(
            checklistRealizado?.localidade_cidade_id !== undefined
                ? String(checklistRealizado.localidade_cidade_id)
                : null
        );
        setSelectedEquipe(
            checklistRealizado?.equipe_id !== undefined
                ? String(checklistRealizado.equipe_id)
                : null
        );
        setSelectedVeiculo(
            checklistRealizado?.veiculo_id !== undefined
                ? String(checklistRealizado.veiculo_id)
                : null
        );
        setSelectedArea(
            checklistRealizado?.area !== undefined
                ? String(checklistRealizado.area)
                : null
        );
    }, [checklistRealizado]);

    const municipioInitialItem = checklistRealizado?.localidade_cidade_id ? [{
        id: String(checklistRealizado?.localidade_cidade_id),
        title: String(checklistRealizado?.localidade_cidade_nome)
    }] : [];
    const handleChangeMunicipio = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedMunicipio(value);
        } else {
            setSelectedMunicipio(String(value));
        }
        setIsFormDirty(true);
    }
    const equipeInitialItem = checklistRealizado?.equipe_id ? [{
        id: String(checklistRealizado.equipe_id),
        title: String(checklistRealizado.equipe_nome)
    }] : [];
    const handleChangeEquipe = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedEquipe(value);
        } else {
            setSelectedEquipe(String(value));
        }
        setIsFormDirty(true);
    }
    const veiculoInitialItem = checklistRealizado?.veiculo_id ? [{
        id: String(checklistRealizado.veiculo_id),
        title: checklistRealizado.veiculo_id
    }] : [];
    const handleChangeVeiculo = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedVeiculo(value);
        } else {
            setSelectedVeiculo(String(value));
        }
        setIsFormDirty(true);
    }
    const handleChangeArea = (value: string | object | null) => {
        if (typeof value === 'string' || value === null) {
            setSelectedArea(value);
        } else {
            setSelectedArea(String(value));
        }
        setIsFormDirty(true);
    };

    const handleUpdate = async () => {
        if (!selectedMunicipio || !selectedEquipe || !selectedVeiculo || !selectedArea) {
            setDialogDesc('Preencha todos os campos.');
            return;
        }
        const equipe = await equipeDb.show(Number(selectedEquipe));
        if (!equipe) {
            setDialogDesc('Equipe não encontrada.');
            return;
        }
        const updatedChecklist = {
            ...checklistRealizado,
            localidade_cidade_id: Number(selectedMunicipio),
            equipe_id: Number(selectedEquipe),
            veiculo_id: selectedVeiculo,
            area: selectedArea,
            encarregado_cpf: equipe.encarregado_cpf,
            supervisor_cpf: equipe.supervisor_cpf,
            coordenador_cpf: equipe.coordenador_cpf,
            gerente_cpf: equipe.gerente_cpf
        };
        await checklistRealizadoDb.updateDadosGerais(updatedChecklist);
        setChecklistRealizado(updatedChecklist);
        setDialogDesc('Registro atualizado com sucesso.');
        setIsFormDirty(false);
        props.formUpdated();
    }
    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.inner}>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Grupo</Text>
                                <Text style={styles.infoValue}>{checklistRealizado?.checklist_grupo_nome || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Centro de Custo</Text>
                                <Text style={styles.infoValue}>{checklistRealizado?.centro_custo_nome || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Estrutura Modelo</Text>
                                <Text style={styles.infoValue}>{checklistRealizado?.checklist_estrutura_nome || '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.lockNotice}>
                            <Text style={styles.lockNoticeText}>
                                Campos bloqueados para edição. Caso precise alterar, exclua o registro e crie um novo.
                            </Text>
                        </View>
                    </View>
                    <AutocompleteSearchDropdown
                        listName="cidades"
                        label="Município"
                        placeholder="Digite o nome do município"
                        extraParam={{ centro_custo_id: checklistRealizado.centro_custo_id }}
                        value={selectedMunicipio}
                        onValueChange={handleChangeMunicipio}
                        initialItems={municipioInitialItem} />
                    <AutocompleteSearchDropdown
                        listName="equipes"
                        label="Equipe"
                        placeholder={isUserOperacao ? "Equipe bloqueada (usuário operação)" : "Digite o nome da equipe"}
                        extraParam={{ centro_custo_id: checklistRealizado.centro_custo_id || '' }}
                        value={selectedEquipe}
                        onValueChange={handleChangeEquipe}
                        initialItems={equipeInitialItem}
                        disable={isUserOperacao} />
                    <AutocompleteSearchDropdown
                        listName="veiculos"
                        initialSearch={checklistRealizado?.veiculo_id || ''}
                        label="Veiculo"
                        placeholder={isUserOperacao ? "Veículo bloqueado (usuário operação)" : "Digite o ID do veículo"}
                        value={selectedVeiculo}
                        onValueChange={handleChangeVeiculo}
                        initialItems={veiculoInitialItem}
                        disable={isUserOperacao} />
                    <AutocompleteSearchDropdown
                        label="Area"
                        placeholder="Digite o nome do município"
                        value={selectedArea}
                        onValueChange={handleChangeArea}
                        initialItems={areas} />
                </View>
                <Portal>
                    <Dialog visible={Boolean(dialogDesc.length)} onDismiss={() => setDialogDesc('')}>
                        <Dialog.Title>Atenção</Dialog.Title>
                        <Dialog.Content>
                            <Text variant="bodyMedium">
                                {dialogDesc}
                            </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setDialogDesc('')}>Fechar</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </ScrollView>
            {isFormDirty ? (
                <Button mode="contained" onPress={handleUpdate} buttonColor="#0439c9" style={styles.btnNext}>
                    ATUALIZAR
                </Button>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        gap: 10,
        padding: 16,
    },
    infoCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#0439c9',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    infoRow: {
        marginBottom: 12,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6c757d',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#212529',
        lineHeight: 22,
    },
    lockNotice: {
        backgroundColor: '#fff3cd',
        borderRadius: 8,
        padding: 6,
        borderWidth: 1,
        borderColor: '#ffeaa7',
    },
    lockNoticeText: {
        fontSize: 13,
        color: '#856404',
        textAlign: 'center',
        fontWeight: '500',
    },
    btnNext: {
        margin: 16,
    }
});
