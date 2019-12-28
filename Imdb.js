const rp = require("request-promise");
const cheerio = require("cheerio");

class Imdb {
    constructor(params) {
        this.URL = "https://www.imdb.com/title/";
        this.client = params.client;
    }

    validURL(str) {
        var pattern = new RegExp(
            "^(https?:\\/\\/)?" + // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
                "(\\#[-a-z\\d_]*)?$",
            "i"
        ); // fragment locator
        return !!pattern.test(str);
    }

    /**
     *
     * @param {String} time
     * @returns {String} yyyy-mm-dd
     */
    convertTime(time) {
        time = time.replace(".", "");
        time = time.trim();
        if (time.length < 7) {
            return "1999-11-22";
        }
        let Dates = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];
        let pieces = time.split(" ");
        //year
        let year = pieces.pop();
        let month;
        let day;

        //month
        if (pieces.length == 2) {
            month =
                Dates.findIndex((val, i, obj) => {
                    if (val == pieces[1]) {
                        return true;
                    } else {
                        return false;
                    }
                }) + 1;
            pieces.pop();
        } else if (pieces.length == 1) {
            month =
                Dates.findIndex((val, i, obj) => {
                    if (val == pieces[0]) {
                        return true;
                    } else {
                        return false;
                    }
                }) + 1;
            //if month cant be found
            if (month == 0) {
                month = 1;
                day = pieces.pop();
            } else {
                pieces.pop();
            }
            
        } else if (pieces.length == 0) {
            month = 1;
        }

        //day
        if (pieces.length == 1) {
            day = pieces[0];
        } else if (pieces.length == 0) {
            if (!day) {
                day = 1;
            }
        }

        let actual = `${year}-${month}-${day}`;
        return actual;
    }

    /**
     *
     * @param {*} input -its a ordered json
     */
    turnToArray(input) {
        let ret = [];
        if (input.latestSeason == "Unknown") {
            input.latestSeason = -1;
        }
        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                const element = input[key];
                ret.push(element);
            }
        }

        return ret;
    }

    /**
     *
     * @param {String} imdbId
     * returns return object
     */
    async getShow(imdbId) {
        let info;
        try {
            let url = this.URL + imdbId;
            let reqPage = await rp(url);
            const page = cheerio.load(reqPage);
            info = page('script[type="application/ld+json"]').html();
            info = JSON.parse(info);

            let seasonCount = page(
                'div[class="seasons-and-year-nav"] a'
            ).html();
            let releaseYear;
            if (info.datePublished !== undefined) {
                releaseYear = info.datePublished.split("-")[0];
            } else {
                releaseYear = 666;
            }

            let rating;
            if (info.aggregateRating !== undefined) {
                rating = info.aggregateRating.ratingValue;
            } else {
                rating = 666.0;
            }
            const ret = {
                imdbId: imdbId,
                imdbRating: rating,
                title: info.name,
                posters: `{"${info.image}"}`,
                latestSeason: seasonCount,
                releaseYear: releaseYear,
                trailer: info.trailer,
                plot: info.description
            };
            return ret;
        } catch (error) {
            console.log(info);
            throw error;
        }
    }

    /**
     *
     * @param {String} imdbId
     * @param {String} season
     * @returns {String} return the number of episodes on a given season
     */
    async getSeason(imdbId, season) {
        try {
            let url = this.URL + imdbId + `/episodes?season=${season}`;
            let reqPage = await rp(url);
            let page = cheerio.load(reqPage);
            let episodeCount = page('meta[itemprop="numberofEpisodes"]').attr(
                "content"
            );

            let haha = page('div[class="list detail eplist"]').html();
            console.log(haha);

            return episodeCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     *
     * @param {String} imdbId
     * @param {Number} season
     * returns every episode on a season
     */
    async getAllEpisodesBySeason(imdbId, season) {
        try {
            let url = this.URL + imdbId + `/episodes?season=${season}`;
            let reqPage = await rp(url);
            let page = cheerio.load(reqPage);
            let episodes = page('div[class="list detail eplist"]')
                .children()
                .toArray();
            let returnArray = [];

            for (const weird of episodes) {
                let episode = cheerio.load(cheerio.html(weird));
                let date = episode('div[class="airdate"]').text();
                date = this.convertTime(date);
                let obj = {
                    imdbId: imdbId,
                    episode: episode('meta[itemprop="episodeNumber"]').attr(
                        "content"
                    ),
                    episodeImdbId: episode(
                        'div[class="wtw-option-standalone"]'
                    ).attr("data-tconst"),
                    summary: episode('div[itemprop="description"]')
                        .text()
                        .trim(),
                    rating: episode(
                        'div[class="ipl-rating-widget"] span[class="ipl-rating-star__rating"]'
                    ).html(),
                    season: season,
                    dateReleased: date,
                    name: episode('a[itemprop="name"]').attr("title"),
                    posters: `{"${episode('div[class="image"] img').attr(
                        "src"
                    )}"}`
                };
                //only push the episode if its valid
                // if (this.validURL(episode('div[class="image"] img').attr("src"))) {
                //     returnArray.push(obj);
                // }
                //only push the episode if its valid
                if (episode('div[class="ipl-rating-widget"]').length == 1) {
                    // console.log(`Episode:${obj.episode}  got it`);
                    returnArray.push(obj);
                }
            }
            // console.log(returnArray.length);
            return returnArray;
        } catch (error) {
            throw error;
        }
    }

    async getEpisode(episodeImdbId) {}
}

module.exports = Imdb;

// let a = new Imdb();
// a.getAllEpisodesBySeason("tt0436992", 12);
