const { Pool } = require("pg");

class PlaylistSongsActivities {
  constructor() {
    this._pool = new Pool();
  }

  // Get history of playlist songs
  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT p.id as playlist_id, p.name as playlist_name, u.username, s.title as song_title, psa.action, psa.time
               from playlists p 
               join playlist_song_activities psa ON psa.playlist_id = p.id 
               join songs s on s.id = psa.song_id 
               join users u on psa.user_id = u.id 
               where p.id = $1
               ORDER BY psa.time ASC`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    const mappedResult = {
      playlistId: result.rows[0].playlist_id,
      activities: result.rows.map((row) => ({
        username: row.username,
        title: row.song_title,
        action: row.action,
        time: row.time,
      })),
    };

    return mappedResult;
  }
}

module.exports = PlaylistSongsActivities;
