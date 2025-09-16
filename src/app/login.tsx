import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ResetData from '@/components/ResetData';
import { checkForUpdate } from '@/services/updateChecker';

export default function LoginScreen() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        const updateRequired = await checkForUpdate();
        if (updateRequired) {
            Alert.alert('Atenção', 'É necessário atualizar o aplicativo antes de continuar');
            return;
        }
        if (!email || !password) {
            Alert.alert('Atenção', 'Preencha todos os campos');
            return;
        }

        if (!email.includes('@dinamo.srv.br')) {
            Alert.alert('Atenção', 'Por favor, use um e-mail válido da Dinamo (ex: usuario@dinamo.srv.br)');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const success = await login(email, password);

            if (success) {
                router.replace('/(tabs)');
            } else {
                Alert.alert('Erro', 'Credenciais inválidas. Por favor, tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            Alert.alert('Erro', 'Ocorreu um erro durante o login');
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