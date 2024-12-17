import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { ActionSheetIOS } from 'react-native';
import { env } from '../config/env';
import {
  GDrive,
  MimeTypes
} from "@robinbobin/react-native-google-drive-api-wrapper";

GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
    iosClientId: env.GOOGLE_CLIENT_ID, // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
});
// const [driveFiles, setDriveFiles] = useState<any[]>([]);
// const [modalVisible, setModalVisible] = useState(false);
const gdrive = new GDrive();

const testAccessToken = async () => {
    try {
      await gdrive.files.list({ pageSize: 1 });
    } catch (error: any) {
      if (error.message.includes('Invalid Credentials')) {
        await AsyncStorage.removeItem('gdriveAccessToken');
        await GoogleSignin.signIn();
        gdrive.accessToken = (await GoogleSignin.getTokens()).accessToken;
        await AsyncStorage.setItem('gdriveAccessToken', gdrive.accessToken);
      }
    }
  }

  const gSignIn = async () => {
    // setIsLoading(true);
    try {
      let gdriveAccessToken = await AsyncStorage.getItem('gdriveAccessToken');
      if (gdriveAccessToken != null && gdriveAccessToken != '') {
        gdrive.accessToken = gdriveAccessToken;
        await testAccessToken();
      } else {
        await GoogleSignin.signIn();
        gdrive.accessToken = (await GoogleSignin.getTokens()).accessToken;
        await AsyncStorage.setItem('gdriveAccessToken', gdrive.accessToken);
      }

      const files = await gdrive.files.list({
        q: "mimeType='application/pdf' or mimeType='text/plain'",
        fields: 'files(id, name, mimeType)',
      })
      // console.log('files', files)

      if (files.files && files.files.length > 0) {
        // setDriveFiles(files.files);
        // setModalVisible(true);
      } else {
        console.log('No files found in Google Drive');
      }
    } catch (error) {
      console.error(error);
    } finally {
    //   setIsLoading(false);
    }
  }

  // open the action sheet -- on hold because we will just be doing IOS for now 
  const openActions = async () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Upload a file",
        options: ['Cancel', 'Google Drive', 'IOS File Manager'],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex === 1) {
          console.log("Google Drive")
          await gSignIn();
        } else if (buttonIndex === 2) {
          console.log("File Manager")
        //   await promptIOSPicker()
        }
      },
    );
  }

        {/* <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <DriveList
          files={driveFiles}
          onFilePress={(file) => {
            console.log('Selected file:', file);
            setModalVisible(false);
            setFile(file)
          }}
          onClose={() => {
            setModalVisible(false);
          }}
        />
      </Modal> */}