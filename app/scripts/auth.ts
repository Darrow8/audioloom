import { User, UserMetadata } from "@shared/user";
import { createUser, getUserBySub, updateUser, watchDocumentUser } from "./mongoClient";
import { UserAction } from "../state/userReducer";
import { Credentials } from "react-native-auth0";
import * as SecureStore from 'expo-secure-store';
import { useStateContext } from "@/state/StateContext";
import { MongoChangeStreamData } from "@shared/mongodb";
import { Dispatch } from "react";
import * as config from "../auth0_config";

/**
 * Initialize a new user in the database
 */
export async function initUser(auth0_user: Partial<User>) : Promise<User | false> {
  let partial_user = {
    ...auth0_user,
    name: auth0_user.name,
    pods: [],
    email: auth0_user.email,
    email_verified: auth0_user.email_verified || false,
    picture: auth0_user.picture,
    created_at: new Date().toISOString(),
    articles: [],
  };
  let insertion_message = await createUser(partial_user)
  if (insertion_message) {
    let new_user = {
      ...partial_user,
      _id: insertion_message.insertedId
    } as User;
    return new_user;
  } else {
    return false;
  }
}


export async function checkLogin(auth0_user: Partial<User>, dispatch: Dispatch<UserAction>, credentials: Credentials) {
  try {
    if (auth0_user) {      
      if (credentials && credentials.accessToken && auth0_user.sub) {
        await SecureStore.setItemAsync('auth0AccessToken', credentials.accessToken);
        let logins_count = auth0_user.user_metadata?.logins_count;
        if(logins_count == undefined){
          logins_count = -1;
        }

        let signingUp = await SecureStore.getItemAsync('signingUp');
        if (signingUp == 'false' || logins_count > 1) {
          // watch user
          let mongo_user = await getUserBySub(auth0_user.sub);
          let mongo_id = mongo_user._id.toString();
          watchAndDeploy(mongo_id, mongo_user, dispatch);
          return true;
        }else if(signingUp == 'true' || logins_count == 1){
          if(logins_count == -1 || signingUp == undefined || signingUp == null){
            // this looks a bit strange, just to make sure try finding user
            // this may result in a console error but that is okay
            let mongo_user = await getUserBySub(auth0_user.sub);
            if(mongo_user){
              await SecureStore.setItemAsync('signingUp', 'false');
              return checkLogin(auth0_user, dispatch, credentials);
            }
          }
          if (auth0_user.email && auth0_user.name) {
            // make new user
            let new_user = await initUser(auth0_user);
            if (new_user) {
              // signing up is done
              await SecureStore.setItemAsync('signingUp', 'false');
              watchAndDeploy(new_user._id, new_user, dispatch);
              return true;
            }else{
              throw new Error('Error getting new user id');
            }
          }else{
            throw new Error('User email and name are required');
          }
        }else{
          throw new Error('User metadata initial login is undefined');
        }
      } else {
        throw new Error('Error getting credentials');
      }
    }
  } catch (error) {
    console.error("Error checking login status:", error);
    // full sign out
    await SecureStore.deleteItemAsync('auth0AccessToken');
    dispatch({ type: 'LOGOUT' });
    return false;
    // console.log("User logged out");
  } 
}

const localWatchUser = (mongo_id: string, dispatch: Dispatch<UserAction>) => {
    console.log("Watching user", mongo_id);

    watchDocumentUser(mongo_id, (data: MongoChangeStreamData) => {
      if (data.operationType === 'update') {
        if(data.fullDocument._id != undefined){
          // Convert _id to string and spread the rest of the document
          const updatedUser = {
          ...data.fullDocument,
            _id: data.fullDocument._id.toString()
          };
          dispatch({ type: 'UPDATE_USER', payload: updatedUser as Partial<User> });
        }
      }
    });
  }

  const watchAndDeploy = async (mongo_id: string, user: User, dispatch: Dispatch<UserAction>) => {
    localWatchUser(mongo_id, dispatch);
    dispatch({ type: 'LOGIN', payload: user });
  }
