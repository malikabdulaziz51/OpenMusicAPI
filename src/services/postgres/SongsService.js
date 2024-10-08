const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const InvariantError = require("../../exceptions/InvariantError");
const { mapSongDBToModel, mapDetailSongDBToModel } = require("../../utils");
const NotFoundError = require("../../exceptions/NotFoundError");

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({ title, year, genre, performer, duration, albumId }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: "INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
      values: [
        id,
        title,
        year,
        genre,
        performer,
        duration ? duration : null,
        albumId ? albumId : null,
        createdAt,
        updatedAt,
      ],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError("Lagu gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  //add search query to getSong title or performer
  async getSongs(title = null, performer = null) {
    let query;
    if (title && performer) {
      query = {
        text: `SELECT * FROM songs 
            WHERE LOWER(title) LIKE '%${title}%' 
            AND LOWER(performer) LIKE '%${performer}%'`,
      };
    } else if (title || performer) {
      query = {
        text: `SELECT * FROM songs 
            WHERE LOWER(title) LIKE '%${title || performer}%' 
            OR LOWER(performer) LIKE '%${title || performer}%'`,
      };
    } else {
      query = "SELECT * FROM songs";
    }

    const result = await this._pool.query(query);
    return result.rows.map(mapSongDBToModel);
  }

  async getSongById(id) {
    const query = {
      text: "SELECT * FROM songs WHERE id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("Lagu tidak ditemukan");
    }

    return result.rows.map(mapDetailSongDBToModel)[0];
  }

  async editSongById(
    id,
    { title, year, genre, performer, duration = null, albumId = null }
  ) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: `UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, "albumId" = $6, updated_at = $7 WHERE id = $8 RETURNING id`,
      values: [title, year, genre, performer, duration, albumId, updatedAt, id],
    };

    return await this._pool.query(query).then((result) => {
      if (!result.rowCount) {
        throw new NotFoundError("Gagal memperbarui Lagu. Id tidak ditemukan");
      }
    });
  }

  async deleteSongById(id) {
    const query = {
      text: "DELETE FROM songs WHERE id = $1 RETURNING id",
      values: [id],
    };

    return await this._pool.query(query).then((result) => {
      if (!result.rowCount) {
        throw new NotFoundError("Lagu gagal dihapus. Id tidak ditemukan");
      }
    });
  }

  async verifySongId(id) {
    const query = {
      text: "SELECT id FROM songs WHERE id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError("Lagu tidak ditemukan");
    }
  }
}

module.exports = SongsService;
