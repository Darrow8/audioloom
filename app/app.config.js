export default {
    expo: {
      name: "Audioloom",
      slug: "frontend",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/audioloom_icon.png",
      scheme: "myapp",
      userInterfaceStyle: "automatic",
      ios: {
        buildNumber: "5",
        supportsTablet: false,
        bundleIdentifier: "com.audioloom.frontend",
        infoPlist: {
          UIBackgroundModes: ["audio"],
          UIDeviceFamily: [1],
        },
      },
      splash: {
        backgroundColor: "#ffffff",
        image: "./assets/images/audioloom_icon.png",
        resizeMode: "contain",
      },
      plugins: [
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
            backgroundColor: "#ffffff",
            image: "./assets/images/audioloom_icon.png",
            resizeMode: "contain",
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