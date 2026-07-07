# Slack Spotify Bot

A tiny Express app that responds to a Slack slash command `/spotify` and returns a Spotify search link.

Repository: SakuraiSensei/railway-deploy-app

## Deploy Steps (Railway)

1. Go to https://railway.app and create a new project → "Deploy from GitHub" (or paste files).
2. Connect your GitHub account and select the repository: `SakuraiSensei/railway-deploy-app`.
3. Railway will detect the project. Build command: `npm install`.
4. Start command: `npm start`.
5. Railway provides a public URL like `https://your-app.railway.app`. Use that for the Slack request URL.

## Create the Slack App

1. Go to https://api.slack.com/apps → Create New App → "From scratch".
2. Name: `Spotify Bot`, choose your workspace.
3. Go to "Slash Commands" → Create New Command:
   - Command: `/spotify`
   - Request URL: `https://your-app.railway.app/spotify` (replace with your Railway URL)
   - Short description: Drop a Spotify link in the channel
   - Usage hint: `[song, artist, or playlist name]`
4. Go to "OAuth & Permissions" → add scope `chat:write` → Install to Workspace.

## Notes

- The app listens on `process.env.PORT` (Railway sets `PORT` automatically).
- The repository already includes `index.js` and `package.json`.
- The app currently does NOT verify Slack requests. For production, add request verification using Slack's signing secret (verify the `X-Slack-Signature` and `X-Slack-Request-Timestamp` headers).

## Local run

1. npm install
2. npm start
3. Use a tunneling tool (ngrok) to expose a local URL while developing and set the Slack command Request URL to the ngrok URL + `/spotify`.

## Next steps I can do for you

- Add Slack request verification code (recommended).
- Add a README with more detailed Slack app setup screenshots.
- Add CI checks or a Procfile if you prefer.
