import { getRecordById, createRecord, updateRecord, deleteRecord, getRecordsByCollection, getRecordByField, checkIfIdExists, checkIfSubExists } from './mongoHandle';
import { isValidPod } from './validateData';
import { User } from '@shared/user';
import { socket } from './socket';
import { ChangeStreamUpdate, DocumentCreated, MongoChangeStreamData } from '@shared/mongodb';
import { ObjectId } from 'bson';
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

export const createUser = async (data: Partial<User>) : Promise<DocumentCreated> => {
    // Add created_at timestamp
    data.created_at = new Date().toISOString();
    data.updated_at = data.created_at;
    console.log('data', data);
    let new_data = await createRecord('users', data).catch((error) => {
        console.error('Error creating user:', error);
        return false;
    });
    return new_data as DocumentCreated;
}
/**
 * 0 means create new user
 * -1 means error
 * user means user found
 */
export const getUserByIdForAuth = async (id: ObjectId) : Promise<boolean> => {
    const response = await checkIfIdExists('users', id);
    return response;
}

/**
 * 0 means create new user
 * -1 means error
 * user means user found
 */
export const getUserBySubForAuth = async (sub: string) : Promise<boolean> => {
    const response = await checkIfSubExists('users', sub);
    console.log('response', response);
    return response;
}

export const getUserById = async (id: ObjectId) => {
    if (id) {
        const user = await getRecordById('users', id).catch((error) => {
            console.error('Error getting user:', error);
            return false;
        });
        return user;
    } else {
        return false;
    }
}

export const getUserBySub = async (sub: string) => {
    if (sub) {
        const user = await getRecordByField('users', 'sub', sub);
        return user;
    } else {
        return false;
    }
}

export const updateUser = async (id: ObjectId, data: any) => {
    data.updated_at = new Date().toISOString();
    await updateRecord('users', id, data).catch((error) => {
        console.error('Error updating user:', error);
        return false;
    });
    return true;

}

export const deleteUser = async (id: ObjectId) => {
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

export const watchDocumentsPods = async (documentIds: ObjectId[], setPods: (stream_data: MongoChangeStreamData) => void) => {
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

export const getPod = async (id: ObjectId) => {
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

export const updatePod = async (id: ObjectId, data: any) => {
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

export const deletePod = async (id: ObjectId) => {
    if (id) {
        // Delete the pod
        await deleteRecord('pods', id).catch((error) => {
            console.error('Error deleting pod:', error);
            return false;
        });

        // Get all users who have this pod
        const users = await getRecordsByCollection('users');
        const usersWithPod = users.filter(user => user.pods?.includes(id));

        // Remove pod from each user's pods array
        await Promise.all(usersWithPod.map(async user => {
            const updatedPods = user.pods.filter((podId: ObjectId) => podId !== id);
            await updateRecord('users', user._id, { pods: updatedPods }).catch((error) => {
                console.error('Error updating user pods:', error);
                return false;
            });
        }));

        return true;
    } else {
        console.error('Invalid pod id:', id);
        throw new Error('Invalid pod id');
    }
}
