const rp = require('request-promise');

const URL = 'https://yts.lt/api/v2/';

class Yts {



    /**
     * @typedef {Object} Movs
     * @property {number} movie_count - How many movies match the quarry
     * @property {Object} movies - Movie objects
     */

    /**
     * @public
     * @param {Number} limit max 50
     * @param {Number} page 
     * @returns {Movs}
     */
    async getMovies(limit, page) {
        let url = URL + 'list_movies.json';
        url += `?limit=${limit}&page=${page}`;
        let resp = await rp(url);
        if (typeof resp === 'string') {
            try {
                resp = JSON.parse(resp);
            } catch (error) {
                console.log(error);
                console.log(resp);
            }
        }
        if (resp.status == 'ok') {
            return {
                'movie_count': resp.data.movie_count,
                'movies': resp.data.movies
            };
        }
        console.log(resp.status);
        return false;
    }

    /**
     * 
     * @param {Number} imdb_id
     * @param {String} url 
     * @param {String} hash 
     * @param {String} quality 
     * @param {String} type 
     * @param {Number} seeds 
     * @param {Number} peers 
     * @param {String} size 
     * @param {Number} size_bytes 
     * @param {String} date_uploaded 
     * @param {Number} date_uploaded_unix 
     * @returns {String}
     */
    getSingleTorrentString(imdb_id, url, hash, quality, type, seeds, peers, size, size_bytes, date_uploaded, date_uploaded_unix) {
        let text = `(${imdb_id},'${url}','${hash}','${quality}','${type}','${seeds}','${peers}','${size}','${size_bytes}','${date_uploaded}','${date_uploaded_unix}') `;

        return text;
    }

    /**
     * 
     * @param {Object} torrent
     * @param {Number} imdb_id
     */
    getTorrentString(torrent, imdb_id) {
        // let text = "array[('22','33548795','Telefone')]::movietorrent[]";
        if (!torrent) {
            return false;
        }

        // let text = "";
        // for (let i = 0; i < torrents.length; i++) {
        //     const element = torrents[i];
        //     text += this.getSingleTorrentString(element.url, element.hash, element.quality, element.type, element.seeds, element.peers, element.size, element.size_bytes, element.date_uploaded, element.date_uploaded_unix);
        //     if (torrents.length - i != 1) {
        //         text += ",";
        //     }
        // }
        // let textReel = "array[" + text + "]::movietorrent[]";
        // return textReel;

        let query = "INSERT INTO public.\"MovieTorrents\"";
        query += "(imdb_id, url, hash, quality, type, seeds, peers, size, size_bytes, date_uploaded, date_uploaded_unix)";
        query += "VALUES ";
        query += this.getSingleTorrentString(imdb_id, torrent.url, torrent.hash, torrent.quality, torrent.type, torrent.seeds, torrent.peers, torrent.size, torrent.size_bytes, torrent.date_uploaded, torrent.date_uploaded_unix);
        query += "ON CONFLICT DO NOTHING";
        return query;

    }



    /**
     * 
     * @param {Object} params - Movie object
     */
    getInsertString(params) {

        let query = "INSERT INTO public.\"Movies\"(";
        query += "yts_id, url, imdb_id, title, title_long, slug, year, rating, runtime, genres, summary, yt_trailer_code, language, mpa_rating, ";
        query += "background_image, background_image_original, small_cover_image, medium_cover_image, large_cover_image";
        if (params.date_uploaded || params.date_uploaded_unix) {
            query += ", date_uploaded, date_uploaded_unix)";
        } else {
            query += ")";
        }
        query += `VALUES (${params.id}, '${params.url}', ${params.imdb_code.replace("tt", "")}, '${params.title.replace(/\'/g, "\'\'")}', '${params.title_long.replace(/\'/g, "\'\'")}', '${params.slug.replace(/\'/g, "\'\'")}', ${params.year}, ${params.rating}, ${params.runtime}, '${params.genres}',`;
        query += ` '${params.summary.replace(/\'/g, "\'\'")}', '${params.yt_trailer_code}', '${params.language}', '${params.mpa_rating}', '${params.background_image}',`;
        query += ` '${params.background_image_original}', '${params.small_cover_image}', '${params.medium_cover_image}', '${params.large_cover_image}'`;
        if (params.date_uploaded || params.date_uploaded_unix) {
            query += `, '${params.date_uploaded}', ${params.date_uploaded_unix}) `;
        } else {
            query += ")";
        }
        query += "ON CONFLICT DO NOTHING;";
        return query;

    }


    async getMovieCount() {
        let url = URL + "list_movies.json?limit=1";
        let resp = await rp(url);
        if (typeof resp === 'string') {
            resp = JSON.parse(resp);
        }
        if (resp.status == 'ok') {
            return resp.data.movie_count;
        }
        console.log(resp.status);
        return false;
    }

}
module.exports = Yts;