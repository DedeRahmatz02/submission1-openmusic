const autoBind = require('auto-bind');
const { nanoid } = require('nanoid');

class PlaylistSongsHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;

        autoBind(this);
    }
    async postPlaylistHandler(request, h) {
        this._validator.validatePostPlaylistPayload(request.payload);
        const { name } = request.payload;
        const { id: credentialId } = request.auth.credentials;

        const playlistId = await this._service.addPlaylist({
            name,
            owner: credentialId,
        });

        const response = h.response({
            status: 'success',
            message: 'Playlist berhasil ditambahkan',
            data: {
                playlistId,
            },
        });
        response.code(201);
        return response;
    }
    async getPlaylistHandler(request, h) {
        const { id: credentialId } = request.auth.credentials;
        const playlists = await this._service.getPlaylists(credentialId);
        return {
            status: 'success',
            data: {
                playlists,
            },
        };
    }
    async deletePlaylistHandler(request, h) {
        const { id } = request.params;
        const { id: credentialId } = request.auth.credentials;

        await this._service.verifyPlaylistOwner(id, credentialId);
        await this._service.deletePlaylistById(id);
        return {
            status: 'success',
            message: 'Playlist berhasil dihapus',
        };
    }

    async postPlaylistSongsHandler(request, h) {
        this._validator.validatePostPlaylistSongsPayload(request.payload);
        const id = `playlist_songs-${nanoid(16)}`;
        const { songId } = request.payload;
        const { id: playlistId } = request.params;
        const { id: credentialId } = request.auth.credentials;

        await this._service.verifySongs(songId);
        await this._service.verifyPlaylistOwner(playlistId, credentialId);

        const playlistSongsId = await this._service.addPlaylistSongs({
            id,
            playlistId,
            songId,
            credentialId,
        });

        const response = h.response({
            status: 'success',
            message: playlistSongsId,
        });
        response.code(201);
        return response;
    }
    async getPlaylistSongsHandler(request, h) {
        const { id } = request.params;
        const { id: credentialId } = request.auth.credentials;

        await this._service.verifyPlaylistSongsAccess(id, credentialId);
        const playlist = await this._service.getPlaylistSongs(id);
        return {
            status: 'success',
            data: {
                playlist,
            },
        };
    }
    async deletePlaylistSongsHandler(request, h) {
        this._validator.validatePostPlaylistSongsPayload(request.payload);
        const { id } = request.params;
        const { id: credentialId } = request.auth.credentials;
        const { songId } = request.payload;

        // cek songs di playlist_songs
        await this._service.verifyPlaylistSongsOwner(id, credentialId);
        await this._service.deletePlaylistSongsById(id, songId, credentialId);
        return {
            status: 'success',
            message: 'Playlist berhasil dihapus',
        };
    }

    async getActivitiesPlaylistSongsHandler(request, h) {
        const { id } = request.params;
        const { id: credentialId } = request.auth.credentials;

        await this._service.verifyPlaylistOwner(id, credentialId);
        const activities = await this._service.getActivitiesPlaylistSongs(id);
        return {
            status: 'success',
            data: activities,
        };
    }
}

module.exports = PlaylistSongsHandler;
