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

export const loginOneSignal = async (user: User) => {
    
    OneSignal.login(user._id.toString());
    console.log("user.email", user.email);
    OneSignal.User.addEmail(user.email);

}

const checkNotificationPermission = async () => {
    try {
      // Get device state
      const permissionStatus = await OneSignal.Notifications.getPermissionAsync();
      const pushSubscription = await OneSignal.User.pushSubscription;
  
      const status = {
        hasPermission: permissionStatus,
        isSubscribed: pushSubscription.optIn,
        pushToken: await pushSubscription.getTokenAsync(),
        userId: await OneSignal.User.getExternalId()
      };
  
      console.log('Notification Permission:', status.hasPermission);
      console.log('Is Subscribed:', status.isSubscribed);
      console.log('User ID:', status.userId);
      console.log('Push Token:', status.pushToken);
  
      return status;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      throw error;
    }
  };