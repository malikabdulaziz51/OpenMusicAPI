const process = require("process");
const AlbumsService = require("../../services/postgres/AlbumsService");
class UploadImageHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this._albumService = new AlbumsService();
    this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
  }

  async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    const albumId = request.params;
    this._validator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._service.writeFile(cover, cover.hapi);
    const fileUrl = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`

    await this._albumService.updateAlbumCoverById(albumId, fileUrl);

    const response = h.response({
      status: "success",
      message: "Cover berhasil diunggah",
      data: {
        fileLocation: fileUrl,
      },
    });
    response.code(201);
    return response;
  }
}

module.exports = UploadImageHandler;
