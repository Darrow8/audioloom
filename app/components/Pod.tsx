import React, { useState, useRef } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, ActivityIndicator, Modal, PanResponder } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pod, PodStatus } from '@shared/pods';



const PodComponent: React.FC<{ pod: Pod, onPodClick: () => void }> = ({ pod, onPodClick }) => {
    return (
        <View style={styles.podItem}>
            {/* <Image source={{ uri: pod.coverImage }} style={styles.podCover} /> */}
            <View style={styles.podInfo}>  
                <Text style={styles.podTitle}>{pod.title}</Text>
                <Text style={styles.podArtist}>{pod.author}</Text>
            </View>
            <View style={styles.podStatus}>
                <TouchableOpacity style={styles.playButton} onPress={onPodClick}>
                    {pod.status == PodStatus.READY && (
                    <Entypo name="controller-play" size={24} color="#007AFF" />
                )}
                {pod.status == PodStatus.PENDING && (
                    <ActivityIndicator size={24} color="#007AFF" />
                )}
                {pod.status == PodStatus.ERROR && (
                        <MaterialIcons name="error-outline" size={24} color="#007AFF" />
                    )}
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    podList: {
        padding: 16,
    },
    podItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    podCover: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    podInfo: {
        flex: 9,
    },
    podTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    podArtist: {
        fontSize: 14,
        color: '#666',
    },
    playButton: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        width: 40,
        height: 40,
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginLeft: 20,
    },
    podStatus: {
        flex: 2,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '90%',
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 10,
    },
});
export default PodComponent;
