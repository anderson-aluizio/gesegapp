import { useCallback, useState, useMemo } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

export interface PhotoPickerProps {
    fotoPath?: string;
    onPhotoSelect: (uri: string) => void;
    onPhotoRemove: () => void;
    isFotoObrigatoria?: boolean;
}

const PhotoPicker = ({ fotoPath, onPhotoSelect, onPhotoRemove, isFotoObrigatoria }: PhotoPickerProps) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [isLoading, setIsLoading] = useState(false);

    const requestCameraPermissions = useCallback(async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permissão Necessária',
                'É necessário permitir o acesso à câmera para tirar fotos.'
            );
            return false;
        }
        return true;
    }, []);

    const requestMediaLibraryPermissions = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permissão Necessária',
                'É necessário permitir o acesso à galeria para selecionar fotos.'
            );
            return false;
        }
        return true;
    }, []);

    const handleTakePhoto = useCallback(async () => {
        const hasPermission = await requestCameraPermissions();
        if (!hasPermission) return;

        setIsLoading(true);
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                onPhotoSelect(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Erro ao tirar foto:', error);
            Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }, [requestCameraPermissions, onPhotoSelect]);

    const handlePickFromGallery = useCallback(async () => {
        const hasPermission = await requestMediaLibraryPermissions();
        if (!hasPermission) return;

        setIsLoading(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                onPhotoSelect(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Erro ao selecionar foto:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a foto. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    }, [requestMediaLibraryPermissions, onPhotoSelect]);

    const handleRemovePhoto = useCallback(() => {
        Alert.alert(
            'Remover Foto',
            'Deseja realmente remover esta foto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Remover', style: 'destructive', onPress: onPhotoRemove }
            ]
        );
    }, [onPhotoRemove]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="labelMedium" style={styles.label}>
                    Foto {isFotoObrigatoria && <Text style={styles.required}>*</Text>}
                </Text>
            </View>

            {fotoPath ? (
                <View style={styles.photoContainer}>
                    <Image source={{ uri: fotoPath }} style={styles.photoPreview} />
                    <IconButton
                        icon="close-circle"
                        size={28}
                        iconColor={colors.error}
                        style={styles.removeButton}
                        onPress={handleRemovePhoto}
                    />
                </View>
            ) : (
                <View style={styles.buttonContainer}>
                    <Button
                        mode="outlined"
                        icon="camera"
                        onPress={handleTakePhoto}
                        disabled={isLoading}
                        loading={isLoading}
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                    >
                        Tirar Foto
                    </Button>
                    <Button
                        mode="outlined"
                        icon="image"
                        onPress={handlePickFromGallery}
                        disabled={isLoading}
                        loading={isLoading}
                        style={styles.button}
                        labelStyle={styles.buttonLabel}
                    >
                        Galeria
                    </Button>
                </View>
            )}
        </View>
    );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        marginTop: 8,
        padding: 8,
        backgroundColor: colors.cardBackground,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    header: {
        marginBottom: 8,
    },
    label: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    required: {
        color: colors.error,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flex: 1,
        borderColor: colors.primary,
    },
    buttonLabel: {
        fontSize: 12,
    },
    photoContainer: {
        position: 'relative',
        alignItems: 'center',
    },
    photoPreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: colors.cardBackground,
        borderRadius: 14,
    },
});

export default PhotoPicker;
