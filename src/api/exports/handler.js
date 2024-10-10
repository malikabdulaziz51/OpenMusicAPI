const PlaylistsService = require("../../services/postgres/PlaylistsService");

class ExportHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this._playlistService = new PlaylistsService();

    this.postExportPlaylistHandler = this.postExportPlaylistHandler.bind(this);
  }

  async postExportPlaylistHandler(request, h) {
    this._validator.validateExportSongsFromPlaylistPayload(request.payload);
    await this._playlistService.verifyPlaylistOwner(request.params.playlistId, request.auth.credentials.id);
    await this._playlistService.verifyPlaylistById(request.params.playlistId);

    const message = {
      userId: request.auth.credentials.id,
      targetEmail: request.payload.targetEmail,
    };

    await this._service.sendMessage("export:playlist", JSON.stringify(message));

    const response = h.response({
      status: "success",
      message: "Permintaan Anda dalam antrean",
    });

    response.code(201);
    return response;
  }
}

module.exports = ExportHandler;
