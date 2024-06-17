const {
    PostPlaylistPayloadSchema,
    PostPlaylistSongsPayloadSchema,
} = require('./schema');

const InvariantError = require('../../exception/InvariantError');

const PlaylistSongsValidator = {
    validatePostPlaylistPayload: (payload) => {
        const validationResult = PostPlaylistPayloadSchema.validate(payload);
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message);
        }
    },
    validatePostPlaylistSongsPayload: (payload) => {
        const validationResult =
            PostPlaylistSongsPayloadSchema.validate(payload);
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message);
        }
    },
};

module.exports = PlaylistSongsValidator;
