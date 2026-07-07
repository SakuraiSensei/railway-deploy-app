const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.post('/spotify', (req, res) => {
  const { text, channel_id, user_name } = req.body;

  const query = text?.trim() || 'top hits';
  const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;

  res.json({
    response_type: 'in_channel',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:spotify: *<@${req.body.user_id}>* queued up: *${query}*`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎵 Open in Spotify: <${searchUrl}|Search "${query}" on Spotify>`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_Use \`/spotify [song, artist, or playlist]\` to queue up music for the huddle_`
          }
        ]
      }
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Spotify bot running on port ${PORT}`));
