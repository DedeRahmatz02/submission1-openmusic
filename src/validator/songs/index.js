const InvariantError = require('../../exception/InvariantError');
const { SongPayloadschema } = require("./schema");

const SongsValidator = {
    validateSongPayload: (payload) => {
        const validatonResult = SongPayloadschema.validate(payload);
        if (validatonResult.error) {
            throw new InvariantError(validatonResult.error.message);
        }
    },
};

module.exports = SongsValidator;