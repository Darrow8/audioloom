import { User, UserMetadata } from "@shared/user";
import { createUser, getUserById, getUserBySub, getUserBySubForAuth, updateUser, watchDocumentUser } from "./mongoClient";
import { UserAction } from "../state/userReducer";
import { Credentials } from "react-native-auth0";
import * as SecureStore from 'expo-secure-store';
import { useStateContext } from "@/state/StateContext";
import { MongoChangeStreamData } from "@shared/mongodb";
import { Dispatch } from "react";
import { ObjectId } from "bson";
import { User as Auth0User } from "react-native-auth0";
import { env } from '@/config/env';
import { identifyUser, resetUser, trackEvent } from './mixpanel';
import { getUserByIdForAuth } from "./mongoClient";
/**
 * Initialize a new user in the database
 */
export async function initUser(auth0_user: Auth0User): Promise<User | null> {

  let partial_user = {
    ...auth0_user,
    _id: new ObjectId(),
    name: auth0_user.name,
    pods: [],//[intro_pod, humanities_pod, science_pod],
    email: auth0_user.email,
    email_verified: auth0_user.email_verified,
    picture: auth0_user.picture,
    created_at: new Date().toISOString(),
    articles: [],
  } as Partial<User>;
  let status = await createUser(partial_user)
  console.log("status", status);
  if(status.acknowledged){
    return partial_user as User;
  } else {
    return null;
  }
}


export async function AttemptAuthentication(auth0_user: Auth0User, dispatch: Dispatch<UserAction>) {
  try {
    let credentials = await SecureStore.getItemAsync('auth0AccessToken');
    if (credentials == null) {
      throw new Error('No credentials found');
    }
    let sub = auth0_user.sub;
    if (sub) {
      console.log(sub);
      let response = await getUserBySubForAuth(sub);
      if(response){        
        // user found
        let user = await getUserBySub(sub);

        if(user == false){
          throw new Error('User not found');
        }

        watchAndDispatch(user._id.toString(), user, dispatch, false);
        return true;
      }else{
        // create new user
        let newUser = await initUser(auth0_user);
        if (newUser != null) {
          // Doing this because the user pods are not fully created yet
          let user = await getUserBySub(sub);
          if(user == false){
            throw new Error('User not found');
          }
          watchAndDispatch(user._id.toString(), user, dispatch, true);
          return true;
        }else {
          console.error("Error creating user");
          return false;
        }
      } 
    }
  } catch (error) {
    console.error("Error checking login status:", error);
    // full sign out
    await SecureStore.deleteItemAsync('auth0AccessToken');
    dispatch({ type: 'LOGOUT' });
    return false;
  }
}

const localWatchUser = (mongo_id: string, dispatch: Dispatch<UserAction>) => {
  console.log("Watching user", mongo_id);
  watchDocumentUser(mongo_id, (data: MongoChangeStreamData) => {
    if (data.operationType === 'update') {
      if (data.fullDocument._id != undefined) {
        // Convert _id to string and spread the rest of the document
        const updatedUser = {
          ...data.fullDocument,
          _id: data.fullDocument._id
        };
        dispatch({ type: 'UPDATE_USER', payload: updatedUser as Partial<User> });
      }
    }
  });
}

const watchAndDispatch = async (mongo_id: string, user: User, dispatch: Dispatch<UserAction>, isSignup: boolean = false) => {
  localWatchUser(mongo_id, dispatch);
  identifyUser(user._id.toString(), {
    email: user.email,
    name: user.name,
    account_type: user.user_metadata?.account_type,
    reference_channel: user.user_metadata?.reference_channel,
    created_at: user.created_at,
  });
  if (isSignup) {
    trackEvent('signup', {
      email: user.email,
      reference_channel: user.user_metadata?.reference_channel,
      account_type: user.user_metadata?.account_type,
    });
  }
  dispatch({ type: 'LOGIN', payload: user });
}

export async function fullLogout(dispatch: Dispatch<UserAction>, clearSession: () => Promise<void>) {
  try {
    await clearSession()
    await SecureStore.deleteItemAsync('auth0AccessToken');
    await SecureStore.deleteItemAsync('signingUp');
    resetUser();
    dispatch({ type: 'LOGOUT' });
  } catch (e) {
    console.log('Log out cancelled');
  }
}
