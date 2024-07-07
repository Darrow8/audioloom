import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserInfo {
    name?: string;
    email?: string;
}
interface UserState {
    user: UserInfo | null
    init: () => Promise<void>
    update: (newUserInfo: Partial<UserInfo>) => Promise<void>
  }


export const getLocalUser = async () => {
    const data = await AsyncStorage.getItem("@user");
    if (!data) return null;
    const _user = JSON.parse(data);
    useAuthStore.setState({user: _user});
    return _user;
  };

export const useAuthStore = create<UserState>((set)=> ({
    user: null,
    init: async ()=>{
        const res = getLocalUser();
        set((state)=>({ user : { ...state.user, ...res }}))
    },
    update: async (newUserInfo: Partial<UserInfo>)=>{

        set((state) => {
            if (state.user) {
                return { user: { ...state.user, ...newUserInfo } };
            } else {
                console.error("User not initialized.");
                return state;
            }
        })
    }
}))
  
export interface GoogleLoginButtonProps {
    setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
}

export interface AuthFullProps {
    userInfo: UserInfo | null;
    setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
}
