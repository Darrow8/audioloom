import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Linking, TouchableOpacity, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendEmail } from '@/scripts/mailing';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { fullLogout, deleteAccount } from '@/scripts/auth';
import { useStateContext } from '@/state/StateContext';
import { useAuth0 } from 'react-native-auth0';

const SettingsPage = () => {
    const { clearSession } = useAuth0();
    const { state, dispatch } = useStateContext();
    const { showActionSheetWithOptions } = useActionSheet();

    const openAccountSheet = () => {
        const options = ['Logout', 'Delete Account', 'Cancel'];
        const logoutIndex = 0;
        const deleteAccountIndex = 1;
        const cancelButtonIndex = 2;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
            destructiveButtonIndex: deleteAccountIndex
        }, async (selectedIndex: number | undefined) => {
            console.log("Selected index:", selectedIndex);
            if (selectedIndex === undefined) return;
            switch (selectedIndex) {
                case logoutIndex:
                    try {
                        console.log("Logging out");
                        await fullLogout(dispatch, clearSession);
                    } catch (error) {
                        console.error('Failed to logout:', error);
                    }
                    break;

                case deleteAccountIndex:
                    console.log("Deleting account");
                    try {
                        if (state.user) {
                            await deleteAccount(dispatch, clearSession, state.user);
                        } else {
                            console.error('User is undefined');
                        }
                    } catch (error) {
                        console.error('Failed to delete account:', error);
                    }
                    break;

                case cancelButtonIndex:
                    // Canceled
                    console.log("Canceled");
                    break;
            }
        });
    }
return (
    <ScrollView style={[styles.container, { marginTop: 40 }]}>

        <TouchableOpacity onPress={openAccountSheet} style={styles.settingItem}>
            <View style={styles.settingInfo}>
                <Ionicons name="person-outline" size={24} color="black" />
                <Text style={styles.settingText}>Account</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
            Linking.openURL('https://audioloom.io/privacy.html');
        }} style={styles.settingItem}>
            <View style={styles.settingInfo}>
                <Ionicons name="lock-closed-outline" size={24} color="black" />
                <Text style={styles.settingText}>Privacy</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
            sendEmail({
                to: 'darrowrh@audioloom.io',
                subject: 'Help & Support',
                body: 'I am sorry to hear you\'re having issues with the app. Please provide your issue or question here. And I will get back to you as soon as possible.',
            });
        }} style={styles.settingItem}>
            <View style={styles.settingInfo}>
                <Ionicons name="help-circle-outline" size={24} color="black" />
                <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="black" />
        </TouchableOpacity>
    </ScrollView>
);
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        marginLeft: 10,
        fontSize: 16,
    },
});

export default SettingsPage;