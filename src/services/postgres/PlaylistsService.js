const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const NotFoundError = require("../../exceptions/NotFoundError");
const CollaborationsService = require("./CollaborationsService");
const InvariantError = require("../../exceptions/InvariantError");
const SongsService = require("./SongsService");
const PlaylistSongsActivities = require("./PlaylistSongsActivities");
const AuthorizationError = require("../../exceptions/AuthorizationError");

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
    this._collaborationsService = new CollaborationsService();
    this._songsService = new SongsService();
    this._playlistSongsActivities = new PlaylistSongsActivities();
  }

  async addPlaylist(name, credentialId) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO playlists VALUES($1, $2, $3) RETURNING id",
      values: [id, name, credentialId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError("Playlist gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getPlaylists(credentialId) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists 
            LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
            JOIN users ON users.id = playlists.owner
            WHERE playlists.owner = $1 OR collaborations.user_id = $1
            GROUP BY playlists.id, users.username`,
      values: [credentialId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylist(id) {
    const query = {
      text: "DELETE FROM playlists WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError("Playlist gagal dihapus. Id tidak ditemukan");
    }
  }

  //Add songs to playlist
  async addSongToPlaylist(playlistId, songId, credentialId) {
    const id = `playlist-song-${nanoid(16)}`;
    await this._songsService.verifySongId(songId);

    const query = {
      text: "INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id",
      values: [id, playlistId, songId],
    };

    const addSongToPlaylistActivities = {
      text: "INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
      values: [
        `playlist-song-activity-${nanoid(16)}`,
        playlistId,
        songId,
        credentialId,
        "add",
        new Date().toISOString(),
      ],
    };

    await this._pool.query(addSongToPlaylistActivities);

    return this._pool
      .query(query)
      .then((result) => result.rows[0].id)
      .catch(() => {
        throw new InvariantError("Lagu sudah ditambahkan ke playlist");
      });
  }

  //Get songs from playlist
  async getSongsFromPlaylist(playlistId) {
    const query = {
      text: `SELECT p.id as playlist_id, p.name as playlist_name, u.username, s.id as song_id, s.title as song_title, s.performer as song_performer 
               FROM playlists p
               JOIN playlist_songs ps ON p.id = ps.playlist_id
               JOIN songs s ON s.id = ps.song_id
               JOIN users u ON p.owner = u.id
               WHERE p.id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }

    const playlist = {
      id: result.rows[0].playlist_id,
      name: result.rows[0].playlist_name,
      username: result.rows[0].username,
      songs: result.rows.map((row) => ({
        id: row.song_id,
        title: row.song_title,
        performer: row.song_performer,
      })),
    };
    return playlist;
  }

  //Delete songs from playlist
  async deleteSongFromPlaylist(playlistId, songId, credentialId) {
    const query = {
      text: "DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id",
      values: [playlistId, songId],
    };

    const deleteFromPlaylistSongActivities = {
      text: "INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
      values: [
        `playlist-song-activity-${nanoid(16)}`,
        playlistId,
        songId,
        credentialId,
        "delete",
        new Date().toISOString(),
      ],
    };

    await this._pool.query(deleteFromPlaylistSongActivities);

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError("Lagu gagal dihapus dari playlist");
    }
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: "SELECT * FROM playlists WHERE id = $1",
      values: [playlistId],
    };

    return await this._pool.query(query).then((result) => {
      if (!result.rowCount) {
        throw new NotFoundError("Playlist tidak ditemukan");
      }

      const playlist = result.rows[0];

      if (playlist.owner !== owner) {
        throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
      }
    });
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw err;
      }

      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw err;
      }
    }
  }

  async verifyPlaylistById(playlistId) {
    const query = {
      text: "SELECT * FROM playlists WHERE id = $1",
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }
  }

  async getPlaylistActivities(playlistId) {
    const result = await this._playlistSongsActivities.getPlaylistActivities(
      playlistId
    );

    return result;
  }
}

module.exports = PlaylistsService;
