// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
// import { ActionSheetIOS } from 'react-native';
// import { env } from '../config/env';
// import {
//   GDrive,
//   MimeTypes
// } from "@robinbobin/react-native-google-drive-api-wrapper";



// export interface GoogleDriveFile {
//   id: string;
//   name: string;
//   mimeType: string;
//   size: number;
//   content?: any;
// }

// export interface GoogleDrivePickerProps {
//   onFilePick: (file: GoogleDriveFile) => void;
//   allowedMimeTypes?: string[];
//   maxFileSize?: number;
// }


// GoogleSignin.configure({
//   scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
//   iosClientId: env.GOOGLE_CLIENT_ID, // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
// });
// const gdrive = new GDrive();

// const testAccessToken = async () => {
//   try {
//     await gdrive.files.list({ pageSize: 1 });
//   } catch (error: any) {
//     if (error.message.includes('Invalid Credentials')) {
//       await AsyncStorage.removeItem('gdriveAccessToken');
//       await GoogleSignin.signIn();
//       gdrive.accessToken = (await GoogleSignin.getTokens()).accessToken;
//       await AsyncStorage.setItem('gdriveAccessToken', gdrive.accessToken);
//     }
//   }
// }

// const gSignIn = async () => {
//   try {
//     let gdriveAccessToken = await AsyncStorage.getItem('gdriveAccessToken');
//     if (gdriveAccessToken != null && gdriveAccessToken != '') {
//       gdrive.accessToken = gdriveAccessToken;
//       await testAccessToken();
//     } else {
//       await GoogleSignin.signIn();
//       gdrive.accessToken = (await GoogleSignin.getTokens()).accessToken;
//       await AsyncStorage.setItem('gdriveAccessToken', gdrive.accessToken);
//     }

//     const files = await gdrive.files.list({
//       q: "mimeType='application/pdf' or mimeType='text/plain'",
//       fields: 'files(id, name, mimeType)',
//     })
//     // console.log('files', files)

//     if (files.files && files.files.length > 0) {
//     } else {
//       console.log('No files found in Google Drive');
//     }
//   } catch (error) {
//     console.error(error);
//   } 
// }
