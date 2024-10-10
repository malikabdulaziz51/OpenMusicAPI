const { Pool } = require("pg");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const CacheService = require("../redis/CacheService");
const AlbumsService = require("./AlbumsService");
const { nanoid } = require("nanoid");

class LikeAlbum {
  constructor() {
    this._pool = new Pool();
    this._cacheService = new CacheService();
    this._albumService = new AlbumsService();
  }

  async likeAlbumById(credentialId, albumId) {
    //check if album exist
    await this._albumService.getAlbumById(albumId);
    //check if user already like the album
    const checkQuery = {
      text: "SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2",
      values: [albumId, credentialId],
    };

    const checkResult = await this._pool.query(checkQuery);
    if (checkResult.rowCount) {
      throw new InvariantError("Album sudah dilike");
    }

    //insert like
    const id = nanoid(16);
    const likeQuery = {
      text: "INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id",
      values: [id, albumId, credentialId],
    };

    const result = await this._pool.query(likeQuery);

    if (!result.rows[0].id) {
      throw new InvariantError("Album gagal dilike");
    }

    await this._cacheService.delete(`likes:${albumId}`);

    return result.rows[0].id;
  }

  async dislikeAlbumById(id, credentialId) {
    //delete like
    const query = {
      text: "DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id",
      values: [id, credentialId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Album gagal diunlike");
    }

    await this._cacheService.delete(`likes:${id}`);

    return result.rows[0].id;
  }

  async getAlbumLikes(albumId) {
    // try {
    //   const result = await this._cacheService.get(`likes:${albumId}`);
    //   return JSON.parse(result);
    // } catch (error) {
    const query = {
      text: "SELECT COUNT(*) FROM user_album_likes WHERE album_id = $1",
      values: [albumId],
    };
    console.log("kesini");
    const result = await this._pool.query(query);
    await this._cacheService.set(`likes:${albumId}`, result.rows[0].count);
    return result.rows[0].count;
    // }
  }
}

module.exports = LikeAlbum;
