To run locally:
`npm start`

In another tab:
`npx ngrok http 3000`

you'll need a twillio account with a phone number, set the message receive webhook to <your-ngrok-forwarding-url>.ngrok-free.app/sms

You'll need to set up a twitter api free account, create an app with an oauth2.0 client that redirects to localhost:3000/callback. Save the client id and client secret in .env.

For Twitter authentication:

1. Visit localhost:3000/auth in your browser
2. Log in with your Twitter account
3. The refresh token will be saved

Set MY_NUMBER to your own phone number. this is for security to prevent someone else from texting your tweet number.

I host it on railway.
Deploy with `railway up`
Copy the .env file to railway
After authorizing on Twitter to localhost:3000/callback, you need to get the refresh token into prod.
View the current refresh token with ./view-token.sh, then seed it in prod with `railway run ./seed.sh <TOKEN>`
