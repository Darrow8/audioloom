import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export const ProgressBanner: React.FC<{time: number}> = ({
    time = 0,
}) => {
    return (
        <View style={styles.banner}>
            <ActivityIndicator size="small" color="white" style={styles.spinner} />
            <Text style={styles.bannerText}>Please Wait, Processing Your Files...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        backgroundColor: '#007AFF',
        padding: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    spinner: {
        marginRight: 4,
    },
});
