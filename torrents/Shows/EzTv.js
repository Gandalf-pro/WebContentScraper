const rp = require("request-promise");
const cheerio = require("cheerio");

const urlRoot = "https://eztv.io/";
const URL = urlRoot + "api/";

class EzTv {


    constructor(params) {
        this.client = params.client;
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
    async getTorrents(page, limit) {
        if (!limit) {
            limit = 100;
        }
        let url = URL + `get-torrents?limit=${limit}&page=${page}`;
        let resp = await rp(url);
        if (typeof resp === "string") {
            resp = JSON.parse(resp);
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
        torrents.map((val, i, arr) => {
            ids.push(val.imdb_id);
        });
        //sorting the ids
        ids.sort();
        //removing id 0
        for (let i = 0; i < ids.length; i++) {
            if (ids[i] == 0) {
                ids.splice(i, 1);
                i--;
            } else {
                break;
            }
        }

        //removing same ids
        for (let i = 0; i < ids.length; i++){
            for (let j = i + 1; j < ids.length; j++){
                if (ids[j] == ids[i]) {
                    ids.splice(j, 1);
                    j--;
                } else {
                    break;
                }
            }
        }
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
            let query = `select exists(select 1 from public."Shows" where imdb_id=${id})`
            let res = await this.client.query(query);
            res = res.rows[0].exists;
            if (!res) {
                notExist.push(id);
            }
        }
        return notExist;
    }


}

module.exports = EzTv;

async function hpo() {
    
    
}

hpo();
