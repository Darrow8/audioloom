# Frontend App Code

## Structure of Files

- `_layout.tsx` starts up the app
- `landing.tsx` is the first page the user sees, prompting them to login
- `loginButton.tsx` is the button that allows the user to login
- `/(tabs)/_layout.tsx` is the layout for the main page, which has three tabs: Home, Upload, and Podcasts
- `index.tsx` is the main page the user sees after login, where they can upload readings and create podcasts
- `upload.tsx` is the page where users can upload readings to be converted into podcasts
- `podcast.tsx` is the page where users can listen to their podcasts

## Startup Sequence

1. User opens the app, if login exists, user is directed to tabs page
2. If no login exists, user is directed to landing page
3. User clicks login, is redirected to Auth0 for login/signup
4. We get the user's information from Auth0 and then get it from mongodb
5. User is redirected to the main page
