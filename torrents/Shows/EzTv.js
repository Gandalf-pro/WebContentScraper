const rp = require("request-promise");
const cheerio = require("cheerio");
const fs = require("fs");

const urlRoot = "https://eztv.io/";
const URL = urlRoot + "api/";

class EzTv {
    constructor(params) {
        if (params) {
            this.client = params.client;
        }
    }

    getImdbIdFromUrl(url) {
        // let arr = url.split('/');
        // return arr[arr.length - 2];
        let find = url.match(/tt[0-9]\w+/);
        return find[0];
    }

    async getDetailsOfShow(show) {
        let reqUrl = urlRoot.slice(0, urlRoot.length - 1) + show.url;
        // console.log(show);
        // console.log(reqUrl);
        const results = await rp(reqUrl);
        const $ = cheerio.load(results);
        let idUrl = $('div[itemprop="aggregateRating"] a').attr("href");
        if (!idUrl) return false;
        let imdbId = this.getImdbIdFromUrl(idUrl);
        console.log(imdbId);
        return {
            imdbId: imdbId
        };
    }

    async getDetailsOfEveryShow(shows, file) {
        let returnArray = [];

        let start = 0;
        start = shows.findIndex((value, index, obj) => {
            if (value.id == 7052) return true;
            return false;
        });
        console.log(`Start is:${start}`);
        for (let i = start; i < shows.length; i++) {
            let show = shows[i];
            let details;
            try {
                details = await this.getDetailsOfShow(show);
            } catch (error) {
                console.error(`ERROR:${error} skipping to nest show`);
                // console.log(`ERROR:${error} skipping to next show`);
                continue;
            }
            let realUrl = urlRoot.slice(0, urlRoot.length - 1) + show.url;
            let obj;
            if (details != false) {
                obj = {
                    title: show.title,
                    id: show.id,
                    slug: show.slug,
                    ezTvUrl: realUrl,
                    status: show.status,
                    imdbId: details.imdbId
                };
            } else {
                obj = {
                    title: show.title,
                    id: show.id,
                    slug: show.slug,
                    ezTvUrl: realUrl,
                    status: show.status
                };
            }
            //write the show to file stream
            file.write(JSON.stringify(obj) + ",");
            returnArray.push(obj);
        }

        // for (const show of shows) {
        //     let details;
        //     try {
        //         details = await this.getDetailsOfShow(show);
        //     } catch (error) {
        //         console.error(`ERROR:${error} skipping to nest show`);
        //         // console.log(`ERROR:${error} skipping to next show`);
        //         continue;
        //     }
        //     let realUrl = urlRoot.slice(0, urlRoot.length - 1) + show.url;
        //     let obj;
        //     if (details != false) {
        //         obj = {
        //             title: show.title,
        //             id: show.id,
        //             slug: show.slug,
        //             ezTvUrl: realUrl,
        //             status: show.status,
        //             imdbId: details.imdbId
        //         };
        //     } else {
        //         obj = {
        //             title: show.title,
        //             id: show.id,
        //             slug: show.slug,
        //             ezTvUrl: realUrl,
        //             status: show.status
        //         };
        //     }
        //     //write the show to file stream
        //     file.write(JSON.stringify(obj) + ",");
        //     returnArray.push(obj);

        // }
        return returnArray;
    }

    async getAllShows() {
        try {
            const results = await rp(`${urlRoot}/showlist`);
            const $ = cheerio.load(results);
            const $elements = $("table.forum_header_border tr[name=hover]");

            const shows = $elements
                .map((i, e) => {
                    const url = $(e)
                        .find("td")
                        .eq(0)
                        .find("a")
                        .attr("href");
                    if (!url) {
                        throw new Error("Unable to find show url");
                    }
                    const regex = url.match(/\/shows\/(\d+)\/([^/]+)/);
                    if (!regex) {
                        throw new Error(`Unparsed show: ${url}`);
                    }
                    const id = Number(regex[1]);
                    const slug = regex[2];

                    const title = $(e)
                        .find("td")
                        .eq(0)
                        .text();
                    const status = $(e)
                        .find("td")
                        .eq(1)
                        .find("font")
                        .attr("class");

                    return {
                        title,
                        id,
                        slug,
                        url,
                        status
                    };
                })
                .get();

            return shows;
        } catch (error) {
            throw new Error(`Error getting shows: ${error}`);
        }
    }

    /**
     *
     * @param {Number} page - Requested page number starting from 1
     * @param {Number} limit - Number between 1 and 100 default is 100
     */
    async getTorrents(page, limit = 100) {
        let url = URL + `get-torrents?limit=${limit}&page=${page}`;
        let resp = await rp(url);
        if (typeof resp === "string") {
            resp = JSON.parse(resp);
        }

        //removing imdbId 0 shows
        for (let i = 0; i < resp.torrents.length; i++) {
            const torrent = resp.torrents[i];
            if (torrent.imdb_id == 0||torrent.imdb_id == '0') {
                resp.torrents.splice(i, 1);
                i--;
            }
        }
       
        

        // console.log(resp);
        return resp;
    }

    /**
     *
     * @param {String} id -it needs the id without tt in the beginning but it still works
     */
    async getByImdbId(id) {
        while (id.startsWith("t")) {
            id = id.slice(1);
        }
        let url = URL + "get-torrents?imdb_id=" + id;
        let resp = await rp(url);
        if (typeof resp === "string") {
            resp = JSON.parse(resp);
        }
    }

    /**
     *
     * @param {[]} torrents
     * @returns sorted array of ids
     */
    getIdsFromTorrents(torrents) {
        let ids = [];
        //geting the ids from the shows
        for (const torrent of torrents) {
            ids.push(torrent.imdb_id);
            // console.log(typeof torrent.imdb_id + ":" + torrent.imdb_id);            
        }
        
        //sorting the ids
        ids.sort();
        //removing id 0 note:already did
        // for (let i = 0; i < ids.length; i++) {
        //     if (ids[i] == 0||ids[i] == '0') {
        //         ids.splice(i, 1);
        //         i--;
        //     } else {
        //         break;
        //     }
        // }

        //removing same ids
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                if (ids[j] == ids[i]) {
                    ids.splice(j, 1);
                    j--;
                } else {
                    break;
                }
            }
        }

        //addind tt to the begginging
        for (let i = 0; i < ids.length; i++) {
            if (!ids[i].startsWith("tt")) {
                ids[i] = "tt" + ids[i];
            }
        }

        //put tt in the begining for the actual object
        for (const key in torrents) {
            if (torrents.hasOwnProperty(key)) {
                const torrent = torrents[key];
                if (!torrent.imdb_id.startsWith("tt")) {
                    torrent.imdb_id = "tt" + torrent.imdb_id;
                }
            }
        }
        console.log(`Diffrent typef of ids count:${ids.length}`);
        return ids;
    }

    /**
     *
     * @param {[]} ids
     * @returns array of non existant ids
     */
    async checkIfIdsExist(ids) {
        let notExist = [];
        for (const id of ids) {
            try {
                var query = `select exists(select 1 from public."Shows" where imdb_id='${id}')`;
                let res = await this.client.query(query);
                res = res.rows[0].exists;
                if (!res) {
                    notExist.push(id);
                }
            } catch (error) {
                console.log(query);
                throw error;
            }
        }
        return notExist;
    }
    

    async checkIfIdsExistSeason(torrents) {
        let non = [];
        let actual = [];

        for (const i of torrents) {
            actual.push(i);
        }

        //pop the same
        for (let i = 0; i < actual.length - 1; i++) {
            let torrent = actual[i];
            for (let j = i + 1; j < actual.length; j++) {
                if (
                    actual[i].imdb_id == actual[j].imdb_id &&
                    actual[i].season == actual[j].season
                ) {
                    actual.splice(j, 1);
                    j--;
                }
            }
        }

        for (const torrent of actual) {
            let query = `select exists(select 1 from public."Seasons" where imdb_id='${torrent.imdb_id}' and season=${torrent.season})`;
            let res = await this.client.query(query);
            res = res.rows[0].exists;
            if (!res) {
                non.push(torrent);
            }
        }

        console.log(`Non existant seasons count:${non.length}`);
        return non;
    }

    async checkIfIdsExistEpisode(torrents) {
        let non = [];
        let actual = [];

        for (const torrent of torrents) {
            if (torrent.episode == 0 || torrent.episode == '0') {
                continue;
            }
            actual.push(torrent);
        }


        //pop the same
        for (let i = 0; i < actual.length - 1; i++) {
            let torrent = actual[i];
            for (let j = i + 1; j < actual.length; j++) {
                if (
                    actual[i].imdb_id == actual[j].imdb_id &&
                    actual[i].season == actual[j].season &&
                    actual[i].episode == actual[j].episode
                ) {
                    actual.splice(j, 1);
                    j--;
                }
            }
        }

        for (const torrent of actual) {
            let query = `select exists(select 1 from public."Episodes" where imdb_id='${torrent.imdb_id}' and season=${torrent.season} and episode=${torrent.episode})`;
            let res = await this.client.query(query);
            res = res.rows[0].exists;
            if (!res) {
                non.push(torrent);
            }
        }

        return non;
    }
}

module.exports = EzTv;

// async function hpo() {
//     let ez = new EzTv();
//     ez.getDetailsOfShow();
// }

// hpo();
