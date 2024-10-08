const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const InvariantError = require("../../exceptions/InvariantError");
const { mapDBToModel, mapDetailAlbumDBToModel } = require("../../utils");
const NotFoundError = require("../../exceptions/NotFoundError");

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const query = {
      text: "INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id",
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError("Album gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query("SELECT * FROM albums");
    return result.rows.map(mapDBToModel);
  }

  async getAlbumById(id) {
    const query = {
      text: `SELECT 
      a.id,
      a.name,
      a.year,
      a.cover as "coverUrl",
      COALESCE(
        json_agg(
          json_build_object('id', s.id, 'title', s.title, 'performer', s.performer)
        ) FILTER (WHERE s.id IS NOT NULL), 
        '[]'
      ) as songs
      FROM albums a LEFT JOIN songs s ON a.id = s."albumId" WHERE a.id = $1 GROUP BY a.id`,
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError("Album tidak ditemukan");
    }

    return result.rows?.map(mapDetailAlbumDBToModel)[0];
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: "UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id",
      values: [name, year, updatedAt, id],
    };

    return await this._pool.query(query).then((result) => {
      if (!result.rowCount) {
        throw new NotFoundError("Gagal memperbarui Album. Id tidak ditemukan");
      }
    });
  }

  async deleteAlbumById(id) {
    const query = {
      text: "DELETE FROM albums WHERE id = $1 RETURNING id",
      values: [id],
    };

    return await this._pool.query(query).then((result) => {
      if (!result.rowCount) {
        throw new NotFoundError("Album gagal dihapus. Id tidak ditemukan");
      }
    });
  }

  async updateAlbumCoverById(data, url) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: "UPDATE albums SET cover = $1, updated_at = $2 WHERE id = $3 RETURNING id",
      values: [url, updatedAt, data.id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError(
        "Gagal memperbarui cover album. Id tidak ditemukan"
      );
    }

    return result.rows[0].id;
  }
}

module.exports = AlbumsService;
