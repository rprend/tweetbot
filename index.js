import fs from "fs";
import express from "express";
import { TwitterApi } from "twitter-api-v2";
import "dotenv/config";
import Database from "better-sqlite3";

const app = express();
app.use(express.urlencoded({ extended: false }));

const {
  PORT = 3000,
  MY_NUMBER,
  CLIENT_ID,
  CLIENT_SECRET,
  CALLBACK_URL = "http://localhost:3000/callback",
} = process.env;

// Initialize SQLite database
let db = null;

const getDb = () => {
  if (db) {
    db.close();
  }
  db = new Database("refresh.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  return db;
};

// Token storage functions
const loadTokens = () => {
  const database = getDb();
  const row = database
    .prepare("SELECT value FROM tokens WHERE key = ?")
    .get("refresh_token");
  return { refresh_token: row?.value || null };
};

const saveTokens = (tokens) => {
  const database = getDb();
  database
    .prepare("INSERT OR REPLACE INTO tokens (key, value) VALUES (?, ?)")
    .run("refresh_token", tokens.refresh_token);
};

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

    // Save tokens to SQLite
    saveTokens({ refresh_token: refreshToken });

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
    const { refresh_token } = loadTokens();

    console.log("refresh_token", refresh_token);
    const { client: authedClient, refreshToken: newRefreshToken } =
      await twitter.refreshOAuth2Token(refresh_token);

    // persist new refresh token
    saveTokens({ refresh_token: newRefreshToken });

    // Dont actually send the tweet, just log it
    console.log("sending tweet", body);
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
