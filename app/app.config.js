export default {
  expo: {
    name: "Audioloom",
    slug: "frontend",
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/images/audioloom_icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    ios: {
      buildNumber: "1",
      supportsTablet: false,
      bundleIdentifier: "com.audioloom.frontend",
      infoPlist: {
        UIBackgroundModes: ["audio"],
        UIDeviceFamily: [1],
        UIStatusBarStyle: "UIStatusBarStyleDarkContent",
        UIViewControllerBasedStatusBarAppearance: false
      },
      entitlements: {
        "com.apple.security.application-groups": [
          "group.com.audioloom.frontend.onesignal"
        ]
      }
    },
    splash: {
      backgroundColor: "#000000",
      image: "./assets/images/walk2.png",
      // resizeMode: "contain",
      // imageWidth: 200,
    },
    plugins: [
      [
        "onesignal-expo-plugin",
        {
          "mode": "development",
        }
      ],
      "expo-router",
      [
        "react-native-auth0",
        {
          domain: "dev-r0ex85m18bf4us41.us.auth0.com",
        },
      ],
      [
        "expo-font",
        {
          fonts: [
            "assets/fonts/futura/Futura_Heavy_font.ttf",
            "assets/fonts/futura/Futura_Book_font.ttf",
            "assets/fonts/futura/Futura_Light_font.ttf",
            "assets/fonts/futura/Futura_Bold_font.ttf",
            "assets/fonts/futura/Futura_Extra_Black_font.ttf",
            "assets/fonts/futura/Futura_Bold_Italic_font.ttf",
            "assets/fonts/futura/Futura_Book_Italic_font.ttf",
            "assets/fonts/futura/Futura_Heavy_Italic_font.ttf",
            "assets/fonts/futura/Futura_Light_Italic_font.ttf",
            "assets/fonts/futura/Futura_Medium_Italic_font.ttf",
            "assets/fonts/futura/futura_medium_bt.ttf",
          ],
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: "com.googleusercontent.apps.554636964216-v3fsfvau5939st9bjquk8to2fnt0m2f1",
        },
      ],
      [
        "expo-splash-screen",
        {
          backgroundColor: "#000000",
          image: "./assets/images/walk2.png",
          // resizeMode: "contain",
          // imageWidth: 200,
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "react-native",
          organization: "na-43x",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      oneSignalAppId: "08f4c935-8dbd-4960-a2b5-e89c005bdd6c",
      router: {
        origin: false,
      },
      eas: {
        projectId: "59fcd878-2c06-49d2-8f02-1cf4454c0364",
      },
    },
    android: {
      package: "com.audioloom.frontend",
    },
  },
};