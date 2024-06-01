const InvariantError = require('../../exception/InvariantError');
const { AlbumPayloadschema } = require("./schema");

const AlbumsValidator = {
    validateAlbumPayload: (payload) => {
        const validatonResult = AlbumPayloadschema.validate(payload);
        if (validatonResult.error) {
            throw new InvariantError(validatonResult.error.message);
        }
    },
};

module.exports = AlbumsValidator;