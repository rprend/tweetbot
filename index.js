import express from "express";
import { TwitterApi } from "twitter-api-v2";
import "dotenv/config";

const app = express();
app.use(express.urlencoded({ extended: false }));

const {
  PORT = 3000,
  MY_NUMBER,
  CLIENT_ID,
  CLIENT_SECRET,
  CALLBACK_URL = "http://localhost:3000/callback",
} = process.env;

const twitter = new TwitterApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
});

// global temp vars (normally you'd persist them)
let codeVerifier;
let oauthClient;

// 1. start OAuth init flow
app.get("/auth", async (req, res) => {
  const auth = twitter.generateOAuth2AuthLink(CALLBACK_URL, {
    scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  });

  codeVerifier = auth.codeVerifier;
  oauthClient = twitter;
  res.redirect(auth.url);
});

// 2. handle OAuth callback
app.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  try {
    const {
      client: authedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await oauthClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: CALLBACK_URL,
    });

    console.log("✅ accessToken:", accessToken);
    console.log("🔄 refreshToken:", refreshToken);
    console.log("⏳ expires in:", expiresIn);

    // optionally tweet something immediately:
    await authedClient.v2.tweet("tweetbot activated via oauth2");

    res.send("✨ Auth complete! Check terminal for tokens.");
  } catch (err) {
    console.error("callback error:", err);
    res.status(500).send("auth failed");
  }
});

// 3. text → tweet endpoint
app.post("/sms", async (req, res) => {
  const { From: from, Body: body } = req.body;

  if (from !== MY_NUMBER) {
    return res.status(403).send("unauthorized");
  }

  try {
    const { client: authedClient } = await twitter.refreshOAuth2Token(
      process.env.REFRESH_TOKEN
    );

    await authedClient.v2.tweet(body);
    res.send("<Response></Response>");
  } catch (err) {
    console.error("tweet failed:", err);
    res.status(500).send("error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 tweetbot running on http://localhost:${PORT}`);
  console.log(`→ to begin OAuth, visit: http://localhost:${PORT}/auth`);
});
