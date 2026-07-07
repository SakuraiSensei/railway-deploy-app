const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'https://slack-spotify-bot-production.up.railway.app/callback';

// Store user tokens in memory (persists while Railway app is running)
const userTokens = {};

// Step 1: /spotify login — sends user to Spotify OAuth
app.post('/spotify', async (req, res) => {
  const { text, user_id } = req.body;
  const query = text?.trim();

  if (query === 'login') {
    const scope = 'user-modify-playback-state user-read-playback-state';
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${user_id}`;
    return res.json({
      response_type: 'ephemeral',
      text: `🔐 <${authUrl}|Click here to connect your Spotify account>`
    });
  }

  if (!query) {
    return res.json({ response_type: 'ephemeral', text: 'Usage: `/spotify [track name]` or `/spotify login`' });
  }

  // Search Spotify
  try {
    const tokenRes = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      { auth: { username: CLIENT_ID, password: CLIENT_SECRET } }
    );
    const appToken = tokenRes.data.access_token;

    const searchRes = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${appToken}` },
      params: { q: query, type: 'track', limit: 1 }
    });

    const track = searchRes.data.tracks.items[0];
    if (!track) return res.json({ response_type: 'ephemeral', text: `No results found for "${query}"` });

    const trackUri = track.uri;
    const trackName = track.name;
    const artist = track.artists[0].name;
    const trackUrl = track.external_urls.spotify;

    // Add to queue for all logged-in users
    const users = Object.keys(userTokens);
    let queued = 0;
    for (const uid of users) {
      try {
        await axios.post(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(trackUri)}`, {}, {
          headers: { Authorization: `Bearer ${userTokens[uid].access_token}` }
        });
        queued++;
      } catch (e) {}
    }

    return res.json({
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:musical_note: <@${user_id}> added *${trackName}* by *${artist}* to the queue for ${queued} listener(s)`
          }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `<${trackUrl}|Open on Spotify>` }
        }
      ]
    });
  } catch (err) {
    return res.json({ response_type: 'ephemeral', text: `Something went wrong: ${err.message}` });
  }
});

// Step 2: OAuth callback — saves user token
app.get('/callback', async (req, res) => {
  const { code, state: user_id } = req.query;
  try {
    const tokenRes = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      }),
      { auth: { username: CLIENT_ID, password: CLIENT_SECRET } }
    );
    userTokens[user_id] = tokenRes.data;
    res.send('✅ Spotify connected! You can close this tab and head back to Slack.');
  } catch (err) {
    res.send('❌ Something went wrong. Please try /spotify login again.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
