const CacheService = require("../../services/redis/CacheService");

class LikeAlbumHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this._cacheService = new CacheService();

    this.postLikeAlbumHandler = this.postLikeAlbumHandler.bind(this);
    this.deleteLikeAlbumHandler = this.deleteLikeAlbumHandler.bind(this);
    this.getLikeAlbumHandler = this.getLikeAlbumHandler.bind(this);
  }

  async postLikeAlbumHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;

    await this._service.likeAlbumById(credentialId, id);

    const response = h.response({
      status: "success",
      message: "Like berhasil ditambahkan",
    });
    response.code(201);
    return response;
  }

  async deleteLikeAlbumHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.dislikeAlbumById(id, credentialId);

    return {
      status: "success",
      message: "Like berhasil dihapus",
    };
  }

  async getLikeAlbumHandler(request, h) {
    const { id } = request.params;

    try {
      const cachedLikes = await this._cacheService.get(`likes:${id}`);
      if (cachedLikes !== null) {
        return h
          .response({
            status: "success",
            data: {
              likes: parseInt(cachedLikes, 10),
            },
          })
          .code(200)
          .header("X-Data-Source", "cache");
      }
    } catch {
      const likes = await this._service.getAlbumLikes(id);
      return h
        .response({
          status: "success",
          data: {
            likes: parseInt(likes, 10),
          },
        })
        .code(200);
    }
  }
}

module.exports = LikeAlbumHandler;
