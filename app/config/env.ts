export const env =  {
    RIVET_API_KEY: process.env.RIVET_API_KEY ?? '',
    INTRO_POD: process.env.INTRO_POD ?? '',
    MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN ?? '',
    BASE_URL: process.env.BASE_URL ?? '',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ?? '',
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN ?? '',
    ENV: process.env.ENV ?? '',
}
console.log('environment:', env.ENV);
console.log('environment:', env);