import { User } from "./user";
import { createUser, updateUser } from "./mongoClient";
import { UserAction } from "../state/userReducer";


/**
 * Initialize a new user in the database
 */
export async function initUser(auth0_user: Partial<User>) {
    let new_user_obj = {
        ...auth0_user,
        name: auth0_user.name || auth0_user.given_name,
        nickname: auth0_user.nickname || auth0_user.name || auth0_user.given_name,
        pods: [],
        email: auth0_user.email,
        email_verified: auth0_user.email_verified || false,
        picture: auth0_user.picture,
        created_at: new Date().toISOString(),
        articles: [],
      } as Partial<User>;
      let new_user = await createUser(new_user_obj)
      if (new_user) {
        return new_user;
    } else {
        throw new Error('Error creating new user');
      }
}

export async function userStateCheck(mongo_user: User, auth0_user: Partial<User>, dispatch: React.Dispatch<UserAction>) {
    const fieldsToCheck: (keyof User)[] = ['name', 'email', 'email_verified', 'picture', 'updated_at', 'given_name', 'family_name', 'nickname'];
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
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }
}