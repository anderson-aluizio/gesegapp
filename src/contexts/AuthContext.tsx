import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClientWrapper, UpdateRequiredHandledError } from '@/services';
import { useCentroCustoDatabase } from '@/database/Models/useCentroCustoDatabase';
import { useSQLiteContext } from 'expo-sqlite';
import { clearTables } from '@/database/databaseSchema';

export default interface UserInterface {
    id: number;
    cpf: string;
    email: string;
    name: string;
    token: string;
    centro_custos: { id: string; nome: string; }[];
    is_operacao: boolean;
}

export interface LoginResponse {
    user: UserInterface
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserInterface | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserInterface | null>(null);
    const [loading, setLoading] = useState(true);
    const centroCustoDb = useCentroCustoDatabase();
    const db = useSQLiteContext();

    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const userData = await AsyncStorage.getItem('userData');

            if (token && userData) {
                const parsedUserData = JSON.parse(userData);
                setIsAuthenticated(true);
                setUser(parsedUserData);
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const responseLogin = await apiClientWrapper.post<LoginResponse>('/auth-user', {
                email,
                password,
            });
            if (responseLogin && responseLogin.user.token) {
                await AsyncStorage.setItem('authToken', responseLogin.user.token);
                await AsyncStorage.setItem('userData', JSON.stringify({
                    id: responseLogin.user.id,
                    cpf: responseLogin.user.cpf,
                    name: responseLogin.user.name,
                    email: responseLogin.user.email,
                    centro_custos: responseLogin.user.centro_custos,
                    is_operacao: responseLogin.user.is_operacao || false
                }));

                setIsAuthenticated(true);
                setUser({
                    id: responseLogin.user.id,
                    cpf: responseLogin.user.cpf,
                    name: responseLogin.user.name,
                    email: responseLogin.user.email,
                    token: responseLogin.user.token,
                    centro_custos: responseLogin.user.centro_custos,
                    is_operacao: responseLogin.user.is_operacao || false
                });

                if (responseLogin.user.centro_custos) {
                    await centroCustoDb.deleteAndInsert(responseLogin.user.centro_custos);
                }

                router.replace('/(tabs)/home');
                return true;
            } else {
                console.error('Invalid login response:', responseLogin);
                return false;
            }
        } catch (error) {
            if (error instanceof UpdateRequiredHandledError) {
                throw error;
            }

            console.error('Login error:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await clearTables(db);
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');

            setIsAuthenticated(false);
            setUser(null);

            router.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
