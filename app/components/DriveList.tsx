import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export interface DriveFile {
    id: string;
    kind: string;
    mimeType: string;
    name: string;
    resourceKey?: string;
    size: number;
    modifiedTime?: string;
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
    onLoadMore: () => void;
    isLoadingMore?: boolean;
}

const DriveList: React.FC<DriveListProps> = ({ files, onFilePress, onLoadMore, isLoadingMore = false }) => {
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
                    <View style={styles.fileMetaContainer}>
                        {item.modifiedTime && (
                            <Text style={styles.fileDate}>
                                {new Date(item.modifiedTime).toLocaleDateString()}
                            </Text>
                        )}
                        {/* <Text style={styles.fileType}> • {item.mimeType}</Text> */}
                    </View>
                </View>
                <Feather name="chevron-right" size={24} color={Colors.light.icon} />
            </View>
        </TouchableOpacity>
    );

    return (
            <View>
            <FlatList
                data={files}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={() => (
                    <Text style={styles.emptyText}>No files found</Text>
                )}
                ListFooterComponent={() => (
                    isLoadingMore ? (
                        <View style={styles.loadingFooter}>
                            <Text style={styles.loadingText}>Loading more files...</Text>
                        </View>
                    ) : null
                )}
            />
            </View>
    );
};

const styles = StyleSheet.create({
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
    fileMetaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    fileType: {
        fontSize: 12,
        color: Colors.light.icon,
    },
    fileDate: {
        fontSize: 12,
        color: Colors.light.icon,
        marginLeft: 4,
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: Colors.light.text,
    },
    loadingFooter: {
        padding: 16,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: Colors.light.icon,
    },
});

export default DriveList;