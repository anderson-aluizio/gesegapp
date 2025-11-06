import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Text,
} from 'react-native';
import { Button, TextInput, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ResetData from '@/components/ResetData';
import { UpdateRequiredHandledError } from '@/services';
import { InfoDialog } from '@/components/sync-data';

export default function LoginScreen() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [remember, setRemember] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);
    const [dialogMessage, setDialogMessage] = useState<string>('');
    const { login } = useAuth();

    const CREDENTIALS_KEY = '@geseg:credentials';

    const showDialog = (message: string) => {
        setDialogMessage(message);
        setDialogVisible(true);
    };

    useEffect(() => {
        const loadStoredCredentials = async () => {
            try {
                const json = await AsyncStorage.getItem(CREDENTIALS_KEY);
                if (json) {
                    const data = JSON.parse(json);
                    if (data?.email) setEmail(data.email);
                    if (data?.password) setPassword(data.password);
                    if (data?.remember) setRemember(true);
                }
            } catch (err) {
                console.warn('Erro ao carregar credenciais salvas:', err);
            }
        };

        loadStoredCredentials();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            showDialog('⚠️ Atenção\n\nPreencha todos os campos');
            return;
        }

        if (!email.includes('@dinamo.srv.br')) {
            showDialog('⚠️ Atenção\n\nPor favor, use um e-mail válido da Dinamo (ex: usuario@dinamo.srv.br)');
            return;
        }

        if (password.length < 6) {
            showDialog('⚠️ Atenção\n\nA senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const success = await login(email, password);

            if (success) {
                try {
                    if (remember) {
                        await AsyncStorage.setItem(
                            CREDENTIALS_KEY,
                            JSON.stringify({ email, password, remember: true })
                        );
                    } else {
                        await AsyncStorage.removeItem(CREDENTIALS_KEY);
                    }
                } catch (err) {
                    console.warn('Erro ao salvar/remover credenciais:', err);
                }

                router.replace('/(tabs)/home');
            } else {
                showDialog('❌ Erro\n\nCredenciais inválidas. Por favor, tente novamente.');
            }
        } catch (error) {
            if (error instanceof UpdateRequiredHandledError) {
                console.log('Update required - alert already shown to user');
                return;
            }

            console.error('Erro ao fazer login:', error);
            showDialog('❌ Erro\n\nOcorreu um erro durante o login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/geseg-logo-nobg.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.formContainer}>
                    <TextInput
                        label="E-mail"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        left={<TextInput.Icon icon="email" />}
                        style={styles.input}
                        mode="outlined"
                        disabled={loading}
                    />

                    <TextInput
                        label="Senha"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        left={<TextInput.Icon icon="lock" />}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off' : 'eye'}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                        style={styles.input}
                        mode="outlined"
                        disabled={loading}
                    />

                    <View style={styles.rememberRow}>
                        <View style={styles.rememberTextWrapper}>
                            <Text style={styles.rememberText}>Lembrar credenciais</Text>
                        </View>
                        <Checkbox
                            status={remember ? 'checked' : 'unchecked'}
                            onPress={() => setRemember(!remember)}
                            disabled={loading}
                        />
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        style={styles.loginButton}
                        contentStyle={styles.loginButtonContent}
                    >
                        {loading ? 'Acessando...' : 'Acessar'}
                    </Button>
                </View>
            </ScrollView>

            <View style={styles.resetDataContainer}>
                <ResetData />
            </View>

            <InfoDialog
                visible={dialogVisible}
                description={dialogMessage}
                onDismiss={() => setDialogVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2980ef',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    resetDataContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 1,
    },
    logo: {
        width: 320,
        height: 100,
        borderRadius: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    input: {
        marginBottom: 16,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    rememberTextWrapper: {
        flex: 1,
    },
    rememberText: {
        fontSize: 16,
        color: '#333',
    },
    loginButton: {
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: '#2980ef',
    },
    loginButtonContent: {
        height: 50,
    },
    infoContainer: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
});