import { User } from '@shared/user.js';
import { ObjectId } from 'mongodb';
import { createMongoData } from './mongo_methods.js';
import { assignAuth0Role } from './auth0_manager.js';

export async function createUser(user: User, mode: "dev" | "prod") {
    console.log('creating user', user);
    let pods = addPodsToUser(user);
    user.pods = pods;
    user._id = new ObjectId(user._id);
    let response = await createMongoData('users', user, mode);
    let role_id = mode == "prod" ? process.env.PROD_USER_ROLE_ID : process.env.DEV_USER_ROLE_ID;
    let auth0_response = await assignAuth0Role(user.sub, role_id);
    return {
        'mongo_response': response,
        'auth0_response': auth0_response
    };
}

/**
 * Temporary function to add pods to user
 * @param data 
 * @returns 
 */
export function addPodsToUser(data: User) {
    if (process.env.NODE_ENV == 'production') {
        console.log('creating user with additional pods');
        let intro_pod = new ObjectId('6727006b22da058cbd4d4665');
        let humanities_pod = new ObjectId('676f5ad4ecf2e78fe10012dc');
        let science_pod = new ObjectId('676f5880aa561fca5b4a5bd7');
        return [intro_pod, humanities_pod, science_pod];
    } else {
        console.log('not in production so no pods added.');
        let development_intro_pod = new ObjectId('6727006b22da058cbd4d4665');
        return [development_intro_pod];
    }
}