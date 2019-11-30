const rp = require("request-promise");

class Omdb {
    constructor(params) {
        const { omdbKey } = require("../config.json");
        this.apiKey = omdbKey;
        this.URL = `http://www.omdbapi.com/?apikey=${this.apiKey}`;
    }

    /**
     * imdbId:tt123123
     * type: movie, series, episode
     * plot: full, short
     * @param {{imdbId:String,title:String,season:Number,episode:Number,type:String,year:Number,plot:String}} params
     */
    async getByIdOrTitle(params) {
        let url = this.URL;
        if (!params.imdbId && !params.title) {
            throw "Can't request need id or title";
        }
        if (params.imdbId) {
            url += `&i=${params.imdbId}`;
        }
        if (params.title) {
            url += `&t=${params.title}`;
        }
        if (params.season) {
            url += `&Season=${params.season}`;
        }
        if (params.episode) {
            url += `&Episode=${params.episode}`;
        }
        if (params.type) {
            url += `&type=${params.type}`;
        }
        if (params.year) {
            url += `&y=${params.year}`;
        }
        if (!params.plot) {
            params.plot = "full";
        }
        url += `&plot=${params.plot}`;
        let resp = await rp(url);
        if (typeof resp === "string") {
            resp = JSON.parse(resp);
        }
        return resp;
    }

    /**
     *
     * @param {String} query - Star Wars
     * @param {String} type - movie, series, episode
     * @param {Number} year - 2019...
     */
    async getBySearch(query, type, year) {
        let url = this.URL;
        if (!query) {
            throw "Need a query to search";
        }
        url += `&s=${query}`;
        if (type) {
            url += `&type=${type}`;
        }
        if (year) {
            url += `&y=${year}`;
        }
        let resp = await rp(url);
        if (typeof resp === "string") {
            resp = JSON.parse(resp);
        }
        return resp;
    }
}
module.exports = Omdb;

// let a = new Omdb();
// a.getByIdOrTitle({ imdbId: "tt4052886", type: "series" });
