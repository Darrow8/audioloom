import { User } from "./user";
import { createUser, updateUser } from "./mongoClient";
import { UserAction } from "../state/userReducer";

/**
 * Initialize a new user in the database
 */
export async function initUser(userId:string, auth0_user: Partial<User>) {
    if(!is24CharHexString(userId)) {
        console.error('Invalid user ID:', userId);
        return;
    }
    let new_user_obj = {
        _id: userId,
        name: auth0_user.name || auth0_user.given_name || '',
        username: auth0_user.nickname || auth0_user.name || auth0_user.given_name || '',
        pods: [],
        email: auth0_user.email || '',
        email_verified: auth0_user.email_verified || false,
        picture: auth0_user.picture || '',
        created_at: new Date().toISOString(),
      } as User;
      let new_user = await createUser(new_user_obj)
      if (new_user) {
        console.log('new_user', new_user);
        return new_user;
    } else {
        throw new Error('Error creating new user');
      }
}

export async function userStateCheck(mongo_user: User, auth0_user: Partial<User>, dispatch: React.Dispatch<UserAction>) {
    const fieldsToCheck: (keyof User)[] = ['name', 'email', 'email_verified', 'picture', 'updated_at'];
    let updates: Partial<User> = {};

    for (const field of fieldsToCheck) {
        if (auth0_user[field] !== undefined && auth0_user[field] !== mongo_user[field]) {
            updates[field] = auth0_user[field] as any;
        }
    }

    if (Object.keys(updates).length > 0) {
        try {
            await updateUser(mongo_user._id, updates);
            dispatch({ type: 'UPDATE_USER', payload: updates });
            console.log('User updated:', mongo_user._id);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }
}

function is24CharHexString(input: string): boolean {
    // Check if the input is a string
    if (typeof input !== 'string') {
      return false;
    }
  
    // Check if the length is exactly 24
    if (input.length !== 24) {
      return false;
    }
  
    // Use a regular expression to check if all characters are hexadecimal
    const hexRegex = /^[0-9A-Fa-f]{24}$/;
    return hexRegex.test(input);
  }