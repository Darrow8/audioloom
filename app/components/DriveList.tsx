import React from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export interface DriveFile {
    id: string;
    kind: string;
    mimeType: string;
    name: string;
    resourceKey?: string;
}

export interface DriveFileList {
    files: DriveFile[];
    incompleteSearch: boolean;
    kind: string;
    nextPageToken?: string;
}

interface DriveListProps {
    files: DriveFile[];
    onFilePress: (file: DriveFile) => void;
    onClose: () => void;
}

const DriveList: React.FC<DriveListProps> = ({ files, onFilePress, onClose }) => {
    const renderItem = ({ item }: { item: DriveFile }) => (
        <TouchableOpacity onPress={() => onFilePress(item)}>
            <View style={styles.fileItem}>
                <Feather 
                    name={item.mimeType.includes('folder') ? 'folder' : 'file-text'} 
                    size={24} 
                    color={Colors.light.tint} 
                    style={styles.icon}
                />
                <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{item.name}</Text>
                    <Text style={styles.fileType}>{item.mimeType}</Text>
                </View>
                <Feather name="chevron-right" size={24} color={Colors.light.icon} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Google Drive Files</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Feather name="x" size={24} color={Colors.light.text} />
                </TouchableOpacity>
            </View>
            <FlatList
                data={files}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    closeButton: {
        padding: 4,
    },
    listContainer: {
        paddingVertical: 16,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.background,
        backgroundColor: Colors.light.background,
    },
    icon: {
        marginRight: 16,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    fileType: {
        fontSize: 12,
        color: Colors.light.icon,
        marginTop: 4,
    },
});

export default DriveList;