const InvariantError = require("../../exceptions/InvariantError");
const { ExportSongsFromPlaylistPayloadSchema } = require("./schema");

const ExportValidator = {
  validateExportSongsFromPlaylistPayload: (payload) => {
    const validationResult =
      ExportSongsFromPlaylistPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = ExportValidator;
