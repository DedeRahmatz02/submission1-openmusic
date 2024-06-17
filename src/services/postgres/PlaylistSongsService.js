const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exception/InvariantError');
const NotFoundError = require('../../exception/NotFoundError');
const AuthorizationError = require('../../exception/AuthorizationError');

class PlaylistSongsService {
    constructor() {
        this._pool = new Pool();
    }

    async addPlaylist({ name, owner }) {
        const id = `playlist-${nanoid(16)}`;
        const query = {
            text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
            values: [id, name, owner],
        };

        const result = await this._pool.query(query);

        if (!result.rows[0].id) {
            throw new InvariantError('Playlist gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getPlaylists(owner) {
        const query = {
            text: `SELECT playlists.id, playlists.name, users.username FROM playlists
        JOIN users ON playlists.owner = users.id
        WHERE playlists.owner = $1`,
            values: [owner],
        };
        const result = await this._pool.query(query);
        return result.rows;
    }

    async deletePlaylistById(id) {
        const query = {
            text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
            values: [id],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError(
                'Playlist gagal dihapus. Id tidak ditemukan'
            );
        }
    }

    async addPlaylistSongs({ id, playlistId, songId, credentialId }) {
        const query = {
            text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
            values: [id, playlistId, songId],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new InvariantError('Playlist song gagal ditambahkan');
        }

        await this.addActivities(playlistId, songId, credentialId, 'add');

        return result.rows[0].id;
    }

    async addActivities(playlistId, songId, userId, action) {
        const id = `psa-${nanoid(16)}`;
        const timeNow = new Date().toISOString();
        const query = {
            text: 'INSERT INTO playlist_song_activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, $6)',
            values: [id, playlistId, songId, userId, action, timeNow],
        };

        const result = await this._pool.query(query);
        if (!result.rowCount > 0) {
            throw new InvariantError('Gagal menambahkan aktivitas');
        }
    }

    async getActivitiesPlaylistSongs(id) {
        const query = {
            text: `SELECT songs.title, users.username, playlist_song_activities.action, playlist_song_activities.time
                FROM playlist_song_activities
                JOIN playlists ON playlist_song_activities.playlist_id = playlists.id
                JOIN users ON playlists.owner = users.id
                JOIN playlist_songs ON playlists.id = playlist_songs.playlist_id
                JOIN songs ON playlist_song_activities.song_id = songs.id
                WHERE playlists.id = $1
                ORDER BY playlist_song_activities.time ASC;
                `,
            values: [id],
        };

        const result = await this._pool.query(query);
        return {
            playlistId: id,
            activities: result.rows,
        };
    }

    async getPlaylistSongs(playlistId) {
        const query = {
            text: `
            SELECT
                playlists.id AS playlist_id,
                playlists.name AS playlist_name,
                users.username,
                songs.id AS song_id,
                songs.title,
                songs.performer
            FROM playlists
            JOIN users ON playlists.owner = users.id
            JOIN playlist_songs ON playlists.id = playlist_songs.playlist_id
            JOIN songs ON playlist_songs.song_id = songs.id
            WHERE playlists.id = $1
        `,
            values: [playlistId],
        };

        const result = await this._pool.query(query);
        if (!result.rows.length) {
            throw new NotFoundError('Playlist tidak ditemukan');
        }

        return {
            id: result.rows[0].playlist_id,
            name: result.rows[0].playlist_name,
            username: result.rows[0].username,
            songs: result.rows.map((row) => ({
                id: row.song_id,
                title: row.title,
                performer: row.performer,
            })),
        };
    }

    async deletePlaylistSongsById(id, songId, credentialId) {
        const query = {
            text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
            values: [id, songId],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Song gagal dihapus. Id tidak ditemukan');
        }

        await this.addActivities(id, songId, credentialId, 'delete');
    }

    async verifySongs(id) {
        const query = {
            text: 'SELECT * FROM songs WHERE id = $1',
            values: [id],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Songs tidak ditemukan');
        }
    }

    async verifyPlaylistOwner(id, owner) {
        const query = {
            text: 'SELECT * FROM playlists WHERE id = $1',
            values: [id],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Playlist tidak ditemukan');
        }

        const playlist = result.rows[0];

        if (playlist.owner !== owner) {
            throw new AuthorizationError(
                'Anda tidak berhak mengakses resource ini'
            );
        }
    }

    async verifyPlaylistSongsAccess(playlistId, userId) {
        try {
            await this.verifyPlaylistOwner(playlistId, userId);
        } catch (error) {
            throw error;
            // untuk collaborations nanti diaktifkan saja
            //   if (error instanceof NotFoundError) {
            //     throw error;
            //   }

            //   try {
            //     await this._collaborationService.verifyCollaborator(playlistId, userId);
            //   } catch {
            //     throw error;
            //   }
        }
    }

    async verifyPlaylistSongsOwner(playlistId, owner) {
        const query = {
            text: 'SELECT * FROM playlists WHERE id=$1',
            values: [playlistId],
        };

        const result = await this._pool.query(query);
        if (!result.rows.length) {
            throw new NotFoundError('Playlists songs tidak ditemukan');
        }
        const playlist = result.rows[0];
        if (playlist.owner !== owner) {
            throw new AuthorizationError(
                'Anda tidak berhak menghapus resource ini'
            );
        }
    }
}

module.exports = PlaylistSongsService;
