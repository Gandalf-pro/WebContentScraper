const rp = require("request-promise");
const cheerio = require("cheerio");

const urlRoot = "https://eztv.io/";
const URL = urlRoot + "api/";

class EzTv {
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
     * @param {Number} limit - Number between 1 and 100
     * @param {Number} page - Requested page number starting from 1
     */
    async getTorrents(limit, page) {
        let url = URL + `get-torrents?limit=${limit}&page=${page}`;
        let resp = await rp(url);
        if (typeof resp === "string") {
            resp = JSON.parse(resp);
        }
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
}

module.exports = EzTv;
