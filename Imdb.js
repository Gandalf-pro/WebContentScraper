const rp = require("request-promise");
const cheerio = require("cheerio");

class Imdb {
    constructor(params) {
        this.URL = "https://www.imdb.com/title/";
    }

    //yyyy-mm-dd
    convertTime(time) {
        time = time.replace(".", "");
        time = time.trim();
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

    /**
     *
     * @param {String} imdbId
     * returns return object
     */
    async getShow(imdbId) {
        let url = this.URL + imdbId;
        let reqPage = await rp(url);
        const page = cheerio.load(reqPage);
        let info = page('script[type="application/ld+json"]').html();
        info = JSON.parse(info);

        let seasonCount = page('div[class="seasons-and-year-nav"] a').html();

        const ret = {
            imdbId: imdbId,
            imdbRating: info.aggregateRating.ratingValue,
            title: info.name,
            posters: info.image,
            latestSeason: seasonCount,
            releaseYear: info.datePublished,
            trailer: info.trailer,
            plot: info.description
        };
        return ret;
    }

    /**
     *
     * @param {String} imdbId
     * @param {String} season
     * @returns {String} return the number of episodes on a given season
     */
    async getSeason(imdbId, season) {
        let url = this.URL + imdbId + `/episodes?season=${season}`;
        let reqPage = await rp(url);
        let page = cheerio.load(reqPage);
        let episodeCount = page('meta[itemprop="numberofEpisodes"]').attr(
            "content"
        );

        let haha = page('div[class="list detail eplist"]').html();
        console.log(haha);

        return episodeCount;
    }

    /**
     * 
     * @param {String} imdbId 
     * @param {Number} season 
     * returns every episode on a season
     */
    async getAllEpisodesBySeason(imdbId, season) {
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
                    'div[class="hover-over-image zero-z-index "]'
                ).attr("data-const"),
                summary: episode('div[itemprop="description"]').text().trim(),
                rating: episode(
                    'div[class="ipl-rating-widget"] span[class="ipl-rating-star__rating"]'
                ).html(),
                season: season,
                dateReleased: date,
                name: episode('a[itemprop="name"]').attr("title"),
                posters: episode('div[class="image"] img').attr("src")
            };
            returnArray.push(obj);
        }

        return returnArray;
    }

    async getEpisode(episodeImdbId) {}
}

let a = new Imdb();
a.getAllEpisodesBySeason("tt0108778", 9);
