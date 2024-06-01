const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exception/InvariantError');
const NotFoundError = require('../../exception/NotFoundError');

class SongsService {
    constructor() {
        this._pool = new Pool();
    }

    async addSong({ title, year, performer, genre, duration, albumId = 'untitled' }) {
        const id = `song-${nanoid(16)}`;
        const query = {
            text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            values: [id, title, year, performer, genre, duration, albumId],
        };
        
        const result = await this._pool.query(query);

        if (!result.rows[0].id) {
            console.log('gagal');
            throw new InvariantError('Song gagal ditambahkan');
        }

        return result.rows[0].id;
    }

    async getSongs({ title, performer }) {

        let query;

        if (title !== undefined && performer !== undefined ) {
            query = {
                text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1 AND performer ILIKE $2',
                values: [`%${title}%`, `%${performer}%`],
            };
        } else if (title !== undefined) {
            query = {
                text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1',
                values: [`%${title}%`],
            };
        } else if (performer !== undefined) {
            query = {
                text: 'SELECT id, title, performer FROM songs WHERE performer ILIKE $1',
                values: [`%${performer}%`],
            };
        } else {
            query = {
                text: 'SELECT id, title, performer FROM songs',
                values: [],
            };
        }

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Belum ada song yang ditambahkan')
        }

        return result.rows;
    }

    async getSongById(id) {
        const query = {
            text: 'SELECT * FROM songs WHERE id = $1',
            values: [id],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Song tidak ditemukan');
        }

        return result.rows[0];

    }

    async editSongById(id, { title, year, performer, genre, duration }) {
        const query = {
            text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5 WHERE id = $6 RETURNING id',
            values: [title, year, performer, genre, duration, id],
        };

        const result = await this._pool.query(query);
        
        if (!result.rows.length) { 
            throw new NotFoundError('Gagal memperbarui song. Id tidak ditemukan');
        }
    }

    async deleteSongById(id) {
        const query = {
            text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
            values: [id],
        };

        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('Song gagal dihapus. Id tidak ditemukan');
        }
    }
}

module.exports = SongsService;