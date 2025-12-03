import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Text,
    Linking,
    TouchableOpacity,
} from 'react-native';
import { Button, TextInput, Checkbox, Switch } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import ResetData from '@/components/admin/ResetData';
import { UpdateRequiredHandledError } from '@/services';
import { useDialog } from '@/hooks/useDialog';
import InfoDialog from '@/components/ui/dialogs/InfoDialog';

export default function LoginScreen() {
    const [email, setEmail] = useState<string>('');
    const [cpf, setCpf] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isOperacional, setIsOperacional] = useState<boolean>(false);
    const [remember, setRemember] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const { login } = useAuth();
    const { colors } = useTheme();
    const dialog = useDialog();

    const styles = useMemo(() => createStyles(colors), [colors]);

    const CREDENTIALS_KEY = '@geseg:credentials';

    useEffect(() => {
        const loadStoredCredentials = async () => {
            try {
                const json = await AsyncStorage.getItem(CREDENTIALS_KEY);
                if (json) {
                    const data = JSON.parse(json);
                    if (data?.isOperacional !== undefined) setIsOperacional(data.isOperacional);
                    if (data?.email) setEmail(data.email);
                    if (data?.cpf) setCpf(data.cpf);
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
        if (isOperacional) {
            if (!cpf || !password) {
                dialog.show('⚠️ Atenção', 'Preencha todos os campos');
                return;
            }

            const cpfNumbers = cpf.replace(/\D/g, '');
            if (cpfNumbers.length !== 11) {
                dialog.show('⚠️ Atenção', 'Por favor, informe um CPF válido com 11 dígitos');
                return;
            }
        } else {
            if (!email || !password) {
                dialog.show('⚠️ Atenção', 'Preencha todos os campos');
                return;
            }

            if (!email.includes('@dinamo.srv.br')) {
                dialog.show('⚠️ Atenção', 'Por favor, use um e-mail válido da Dinamo (ex: usuario@dinamo.srv.br)');
                return;
            }
        }

        if (password.length < 6) {
            dialog.show('⚠️ Atenção', 'A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { isSuccess, error } = await login(
                isOperacional ? cpf : email,
                password,
                isOperacional
            );

            if (isSuccess) {
                try {
                    if (remember) {
                        await AsyncStorage.setItem(
                            CREDENTIALS_KEY,
                            JSON.stringify({
                                email: isOperacional ? '' : email,
                                cpf: isOperacional ? cpf : '',
                                password,
                                isOperacional,
                                remember: true
                            })
                        );
                    } else {
                        await AsyncStorage.removeItem(CREDENTIALS_KEY);
                    }
                } catch (err) {
                    console.warn('Erro ao salvar/remover credenciais:', err);
                }

                router.replace('/(tabs)/home');
            } else {
                dialog.show('❌ Erro de Login', `${error}`);
            }
        } catch (error) {
            if (error instanceof UpdateRequiredHandledError) {
                console.warn('Update required - alert already shown to user');
                return;
            }

            console.error('Erro ao fazer login:', error);
            dialog.show('❌ Erro', 'Ocorreu um erro durante o login');
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
                    <Text style={styles.sectionTitle}>Tipo de Acesso</Text>
                    <View style={styles.operacionalToggle}>
                        <View style={styles.toggleLabelContainer}>
                            <Switch value={isOperacional} onValueChange={() => setIsOperacional(!isOperacional)} disabled={loading} />
                            <Text style={styles.toggleLabel} onPress={() => setIsOperacional(!isOperacional)}>
                                {isOperacional ? 'Acesso Operacional' : 'Acesso Administrativo'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.credentialsSection}>
                        <Text style={styles.sectionTitle}>Credenciais</Text>

                        {isOperacional ? (
                            <TextInput
                                label="CPF"
                                value={cpf}
                                onChangeText={setCpf}
                                keyboardType="numeric"
                                autoCapitalize="none"
                                left={<TextInput.Icon icon="account" />}
                                style={styles.input}
                                mode="outlined"
                                disabled={loading}
                                placeholder="000.000.000-00"
                                textColor={colors.text}
                                outlineColor={colors.border}
                                activeOutlineColor={colors.primary}
                            />
                        ) : (
                            <TextInput
                                label="E-mail Corporativo"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                left={<TextInput.Icon icon="email" />}
                                style={styles.input}
                                mode="outlined"
                                disabled={loading}
                                placeholder="usuario@dinamo.srv.br"
                                textColor={colors.text}
                                outlineColor={colors.border}
                                activeOutlineColor={colors.primary}
                            />
                        )}

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
                            textColor={colors.text}
                            outlineColor={colors.border}
                            activeOutlineColor={colors.primary}
                        />

                        <View style={styles.rememberRow}>
                            <View style={styles.rememberTextWrapper}>
                                <Text style={styles.rememberText} onPress={() => setRemember(!remember)}>Lembrar credenciais</Text>
                            </View>
                            <Checkbox
                                status={remember ? 'checked' : 'unchecked'}
                                onPress={() => setRemember(!remember)}
                                disabled={loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.forgotPasswordContainer}
                            onPress={() => Linking.openURL('https://geseg2.dinamo.srv.br/reset-password-operacional')}
                            disabled={loading}
                        >
                            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                        </TouchableOpacity>
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
                    <Text style={{ textAlign: 'center', marginTop: 8, color: colors.textTertiary }}>
                        Versão: {process.env.EXPO_PUBLIC_LOCAL_VERSION}
                    </Text>
                </View>
                <View style={styles.resetDataContainer}>
                    <ResetData />
                </View>
            </ScrollView>


            <InfoDialog
                visible={dialog.visible}
                description={dialog.description}
                title={dialog.title}
                onDismiss={dialog.hide}
            />
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundAlt,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    resetDataContainer: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    logo: {
        width: 320,
        height: 100,
        borderRadius: 8,
    },
    formContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 24,
        elevation: 4,
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textTertiary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    operacionalToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surfaceVariant,
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toggleLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    toggleLabel: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '500',
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 10,
    },
    credentialsSection: {
        marginBottom: 4,
    },
    input: {
        marginBottom: 16,
        backgroundColor: colors.inputBackground,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    rememberTextWrapper: {
        flex: 1,
    },
    rememberText: {
        fontSize: 15,
        color: colors.textSecondary,
    },
    forgotPasswordContainer: {
        marginTop: 12,
        alignItems: 'center',
    },
    forgotPasswordText: {
        fontSize: 14,
        color: colors.link,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    loginButton: {
        marginTop: 16,
        marginBottom: 8,
        backgroundColor: colors.buttonPrimary,
        borderRadius: 8,
    },
    loginButtonContent: {
        height: 50,
    },
});