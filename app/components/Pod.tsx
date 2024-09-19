import React, { useState, useRef } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, ActivityIndicator, Modal, PanResponder } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import PodPlayer from './PodPlayer';
import GestureRecognizer from 'react-native-swipe-gestures';

export interface Pod {
    id: string;
    title: string;
    artist: string;
    coverImage: string;
    status: Status;
}

export enum Status {
    READY = "check",
    PENDING = "loading",
    ERROR = "error",
}


const PodComponent: React.FC<{ pod: Pod }> = ({ pod }) => {
    const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                return gestureState.dy > 10;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 50) {
                    setIsPlayerModalVisible(false);
                }
            },
        })
    ).current;

    const openPlayerModal = () => {
        if (pod.status === Status.READY) {
            setIsPlayerModalVisible(true);
        }
    };

    return (
        <View style={styles.songItem}>
            <Image source={{ uri: pod.coverImage }} style={styles.songCover} />
            <View style={styles.songInfo}>  
                <Text style={styles.songTitle}>{pod.title}</Text>
                <Text style={styles.songArtist}>{pod.artist}</Text>
            </View>
            <TouchableOpacity style={styles.addToPlaylistButton} onPress={openPlayerModal}>
                {pod.status === Status.READY && (
                    <Entypo name="controller-play" size={24} color="#007AFF" />
                )}
                {pod.status === Status.PENDING && (
                    <ActivityIndicator size={24} color="#007AFF" />
                )}
                {pod.status === Status.ERROR && (
                    <MaterialIcons name="error-outline" size={24} color="#007AFF" />
                )}
            </TouchableOpacity>
            <GestureRecognizer
                style={{flex: 1}}
                onSwipeUp={ () => setIsPlayerModalVisible(true) }
                onSwipeDown={ () => setIsPlayerModalVisible(false) }
                >
            <Modal
                animationType="slide"
                transparent={true}
                visible={isPlayerModalVisible}
                // onRequestClose={() => setIsPlayerModalVisible(false)}
            >
                <View style={styles.modalContainer} {...panResponder.panHandlers}>
                    <View style={styles.modalContent}>
                        <View style={styles.dragIndicator} />
                        <PodPlayer pod={pod} />
                    </View>
                </View>
            </Modal>
            </GestureRecognizer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    songList: {
        padding: 16,
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    songCover: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    songInfo: {
        flex: 1,
    },
    songTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    songArtist: {
        fontSize: 14,
        color: '#666',
    },
    addToPlaylistButton: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
