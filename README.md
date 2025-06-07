To run locally:
`npm start`

In another tab:
`npx ngrok http 3000`

you'll need a twillio account with a phone number, set the message receive webhook to <your-ngrok-forwarding-url>.ngrok-free.app/sms

You'll need to set up a twitter api free account, create an app with an oauth2.0 client that redirects to localhost:3000/callback. Save the client id and client secret in .env.

To get the twitter refresh token, go to localhost:3000/auth, login in to your twitter account, and you'll see the refresh token there. Save the refresh token into .env.

Set MY_NUMBER to your own phone number. this is for security to prevent someone else from texting your tweet number.
