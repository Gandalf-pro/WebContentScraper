const EzTv = require("./torrents/Shows/EzTv");
const Omdb = require("./torrents/Omdb");
const Imdb = require("./Imdb");
const { Client } = require("pg");

class Shows {
    /**
     *
     * @param {{client:Client,ezTv:EzTv,omdb:Omdb,imdb:Imdb}} params
     */
    constructor(params) {
        if (params.client) this.client = params.client;
        if (params.ezTv) this.ezTv = params.ezTv;
        if (params.omdb) this.omdb = params.omdb;
        if (params.imdb) this.imdb = params.imdb;
    }

    /**
     *
     * @param {String} time
     * @returns {String} yyyy-mm-dd
     */
    convertTime(time) {
        let Dates = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let pieces = time.split(" ");
        //year
        let year = pieces[2];
        //month
        let month =
            Dates.findIndex((val, i, obj) => {
                if (val == pieces[1]) {
                    return true;
                } else {
                    return false;
                }
            }) + 1;
        //day
        let day = pieces[0];
        let actual = `${year}-${month}-${day}`;
        return actual;
    }

    async deleteShow(imdbId) {
        let query = `delete from public."Shows" where imdb_id=${imdbId}`;
        let res = await this.client.query(query);
    }

    async deleteSeason(imdbId, season) {
        let query = `delete from public."Seasons" where imdb_id=${imdbId} and season=${season}`;
        let res = await this.client.query(query);
    }

    async deleteEpisode(imdbId, season, episode) {
        let query = `delete from public."Episodes" where imdb_id=${imdbId}`;
        query += ` and season=${season} and episode=${episode}`;
        let res = await this.client.query(query);
    }

    async getTotalTorrentAmount() {
        let query = 'select count(*) from "ShowTorrents"';
        let res = await this.client.query(query);
        return res.rows[0].count;
    }

    async imdbPushShowToDatabase(show) {
        let query =
            'INSERT INTO public."Shows"(imdb_id, imdb_rating, title, posters, latest_season, release_year, trailer, plot)';
        query += "VALUES($1, $2, $3, $4, $5, $6, $7, $8)ON CONFLICT DO NOTHING;";
        let values = this.imdb.turnToArray(show);
        try {
            let res = await this.client.query(query, values);
            return res;
        } catch (error) {
            console.log(error);
            console.log(show);
            console.log(query);
            console.log(JSON.stringify(values));
            throw error;
        }
    }

    async imdbPushSeasonToDatabase(seasonValues) {
        let query = 'INSERT INTO public."Seasons"(imdb_id, season, episode_count)';
        query += "VALUES($1, $2, $3)ON CONFLICT DO NOTHING;";
        try {
            let res = await this.client.query(query, seasonValues);
            return res;
        } catch (error) {
            console.log(error);
            console.log(query);
            console.log(JSON.stringify(seasonValues));
            throw error;
        }
    }

    async imdbPushEpisodeToDatabase(episode) {
        let query =
            'INSERT INTO public."Episodes"(imdb_id, episode, episode_imdb_id, summary, rating, season, date_released, name, posters)';
        query += "VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)ON CONFLICT DO NOTHING;";
        let values = this.imdb.turnToArray(episode);
        try {
            let res = await this.client.query(query, values);
            return res;
        } catch (error) {
            console.log(error);
            console.log(query);
            console.log(JSON.stringify(values));
            throw error;
        }
    }

    async imdbPushShowEverythingWithId(id) {
        try {
            // let id = "tt0108778";
            //get the show
            let show = await this.imdb.getShow(id);
            await this.imdbPushShowToDatabase(show);
            //get every season
            for (let i = 1; i <= show.latestSeason; i++) {
                let episodes = await this.imdb.getAllEpisodesBySeason(id, i);
                //push season
                await this.imdbPushSeasonToDatabase([id, i, episodes.length]);
                //push every episode
                for (const episode of episodes) {
                    try {
                        await this.imdbPushEpisodeToDatabase(episode);
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async imdbPushSeasonEverythingToDatabase(torrent) {
        try {
            let episodes = await this.imdb.getAllEpisodesBySeason(torrent.imdb_id, torrent.season);

            let data = [torrent.imdb_id, torrent.season, episodes.length];

            await this.imdbPushSeasonToDatabase(data);
        } catch (error) {
            // console.log(error.error);

            // console.log(`\n\nTorrent:${JSON.stringify(torrent)}`);
            throw error;
        }
    }

    async pushTorrentToDatabase(torrent) {
        let query = 'INSERT INTO public."ShowTorrents"';
        let vals = [];
        let sizeGB = torrent.size_bytes / 1000000000;
        query +=
            "(imdb_id, torrent_url, magnet_url, hash, name, title, quality, seeds, peers, size_gb, size_bytes, date_released_unix, season, episode)";
        query += `VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)ON CONFLICT DO NOTHING;`;
        vals.push(torrent.imdb_id);
        vals.push(torrent.torrent_url);
        vals.push(torrent.magnet_url);
        vals.push(torrent.hash);
        vals.push(torrent.filename);
        vals.push(torrent.title);
        vals.push("good");
        vals.push(torrent.seeds);
        vals.push(torrent.peers);
        vals.push(sizeGB);
        vals.push(torrent.size_bytes);
        vals.push(torrent.date_released_unix);
        vals.push(torrent.season);
        vals.push(torrent.episode);

        try {
            let res = await this.client.query(query,vals);
            return res;
        } catch (error) {
            console.log(error);
            console.log(query);
            throw error;
        }
    }
}

module.exports = Shows;
