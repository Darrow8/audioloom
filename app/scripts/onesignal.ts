import { LogLevel, OneSignal } from 'react-native-onesignal';
import Constants from "expo-constants";
import { User } from '@shared/user';
export const initOneSignal = () => {
    let oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId;
    if (oneSignalAppId == null) {
        console.error('OneSignal app ID not found in expo config');
        return;
    }
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize(oneSignalAppId);
}

export const requestNotificationPermission = () => {
    OneSignal.Notifications.requestPermission(true);
}


export const logoutOneSignal = () => {
    OneSignal.logout();
}

export const loginOneSignal = (user: User) => {
    OneSignal.login(user._id.toString());
    console.log("user.email", user.email);
    OneSignal.User.addEmail(user.email);

}