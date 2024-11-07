import { getRecordById, createRecord, updateRecord, deleteRecord, getRecordsByCollection, getRecordByField } from './mongoHandle';
import { isValidPod } from './validateData';
import { User } from './user';
import { socket } from './socket';
import { useStateContext } from '@/state/StateContext';
import { Pod } from '@shared/pods';
import { Dispatch } from 'react';
import { UserAction } from '@/state/userReducer';
import { UserState } from './user';
import { ChangeStreamUpdate, MongoChangeStreamData } from '@shared/mongodb';

// User endpoints
export const watchDocumentUser = async (documentId: string, setUser: (stream_data: MongoChangeStreamData) => void) => {
    socket.emit('watchDocumentUser', documentId);
    socket.on('userChange', (data: MongoChangeStreamData) => {
        setUser(data);
    });
    socket.on('userError', (error) => {
        console.error("Error watching user:", error);
    });
}


export const getAllUsers = async () => {
    const users = await getRecordsByCollection('users');
    return users;
}

export const createUser = async (data: Partial<User>) => {
    // Add created_at timestamp
    data.created_at = new Date().toISOString();
    data.updated_at = data.created_at;

    await createRecord('users', data).catch((error) => {
        console.error('Error creating user:', error);
        return undefined;
    });
    return data as User;
}

export const getUserById = async (id: string) => {
    if (id) {
        const user = await getRecordById('users', id.toString()).catch((error) => {
            console.error('Error getting user:', error);
            return false;
        });
        return user;
    } else {
        return false;
    }
}

export const getUserBySub = async (sub: string | undefined) => {
    if (sub) {
        const user = await getRecordByField('users', 'sub', sub);
        return user;
    } else {
        return false;
    }
}

export const updateUser = async (id: string, data: any) => {
    data.updated_at = new Date().toISOString();
    await updateRecord('users', id, data).catch((error) => {
        console.error('Error updating user:', error);
        return false;
    });
    return true;

}

export const deleteUser = async (id: string) => {
    if (id) {
        await deleteRecord('users', id).catch((error) => {
            console.error('Error deleting user:', error);
            return false;
        });
        return true;
    } else {
        console.error('Invalid user id:', id);
        throw new Error('Invalid user id');
    }
}

// Pod endpoints

export const watchDocumentsPods = async (documentIds: string[], setPods: (stream_data: MongoChangeStreamData) => void) => {
    socket.emit('watchDocumentsPods', documentIds);
    socket.on('podsChange', (data: MongoChangeStreamData) => {
        if (data.operationType === 'update') {
            // update user state
            setPods(data);
        }
    });
    socket.on('podsError', (error) => {
        console.error("Error watching pods:", error);
    });
}

export const getAllPods = async () => {
    const pods = await getRecordsByCollection('pods');
    return pods;
}

export const createPod = async (data: any) => {
    if (isValidPod(data)) {
        await createRecord('pods', data).catch((error) => {
            console.error('Error creating pod:', error);
            return false;
        });
        return true;
    } else {
        console.error('Invalid pod data:', data);
        throw new Error('Invalid pod data');
    }
}

export const getPod = async (id: string) => {
    if (id) {
        const pod = await getRecordById('pods', id).catch((error) => {
            console.error('Error getting pod:', error);
            return false;
        });
        return pod;
    } else {
        console.error('Invalid pod id:', id);
        throw new Error('Invalid pod id');
    }
}

export const updatePod = async (id: string, data: any) => {
    if (isValidPod(data) && id) {
        await updateRecord('pods', id, data).catch((error) => {
            console.error('Error updating pod:', error);
            return false;
        });
        return true;
    } else {
        console.error('Invalid pod data or id:', { id, data });
        throw new Error('Invalid pod data or id');
    }
}

export const deletePod = async (id: string) => {
    if (id) {
        await deleteRecord('pods', id).catch((error) => {
            console.error('Error deleting pod:', error);
            return false;
        });
        return true;
    } else {
        console.error('Invalid pod id:', id);
        throw new Error('Invalid pod id');
    }
}