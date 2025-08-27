import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function RootRedirect() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
});
