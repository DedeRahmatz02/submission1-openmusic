const Joi = require('joi');

const AlbumPayloadschema = Joi.object({
   name: Joi.string().required(),
   year: Joi.number().required(),
});

module.exports = { AlbumPayloadschema };