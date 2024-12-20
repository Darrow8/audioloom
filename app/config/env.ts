export const env =  {
    RIVET_API_KEY: process.env.EXPO_PUBLIC_RIVET_API_KEY ?? '',
    INTRO_POD: process.env.EXPO_PUBLIC_INTRO_POD ?? '',
    MIXPANEL_TOKEN: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '',
    BASE_URL: process.env.EXPO_PUBLIC_BASE_URL ?? '',
    GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
    AUTH0_CLIENT_ID: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '',
    AUTH0_DOMAIN: process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '',
    AUTH0_AUDIENCE: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? '',
    ENV: process.env.EXPO_PUBLIC_ENV ?? '',
}

console.log('environment:', env.ENV);
