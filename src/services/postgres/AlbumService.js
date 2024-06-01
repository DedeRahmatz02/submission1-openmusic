const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exception/InvariantError');
const NotFoundError = require('../../exception/NotFoundError');

class AlbumsService {
    constructor() {
        this._pool = new Pool();
    }

    async addAlbum({ name, year }) {
        const id = `album-${nanoid(16)}`;
        const query = {
            text: 'INSERT INTO album VALUES($1, $2, $3) RETURNING id',
            values: [id, name, year],
        };

        const result = await this._pool.query(query);

        if(!result.rows[0].id) {
            throw new InvariantError('Album gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getAlbums() {
        const query = {
            text: 'SELECT * FROM album',
            values: [],
        };
        const result = await this._pool.query(query);

        if(!result.rows.length) {
            throw new NotFoundError('Belum ada album yang ditambahkan');
        }

        return result.rows;
    }

    async getAlbumById(id) {
        const query = {
            text: 'SELECT album.id AS album_id, album.name AS album_name, album.year AS album_year, songs.id AS songs_id, songs.title AS songs_title, songs.performer AS songs_performer FROM album LEFT JOIN songs ON album.id = songs."albumId" WHERE album.id = $1',
            values: [id],
        };

        const result = await this._pool.query(query);

        if(!result.rows.length) {
            throw new NotFoundError('Album tidak ditemukan');
        }

        const album = {
            id: result.rows[0].album_id,
            name: result.rows[0].album_name,
            year: result.rows[0].album_year,
            songs: result.rows.filter(row => row.songs_id !== null).map(row => ({
                id: row.songs_id,
                title: row.songs_title,
                performer: row.songs_performer,
            }))
        };

        return album;
    }

    async editAlbumById(id, { name, year }) {
        const query = {
            text: 'UPDATE album SET name = $1, year = $2 WHERE id = $3 RETURNING id',
            values: [name, year, id],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
        }
    }

    async deleteAlbumById(id) {
        const query = {
            text: 'DELETE FROM album WHERE id = $1 RETURNING id',
            values: [id],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
        }
    }
}

module.exports = AlbumsService;