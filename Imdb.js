const rp = require("request-promise");
const cheerio = require("cheerio");

class Imdb {
    constructor(params) {
        this.URL = "https://www.imdb.com/title/";
    }

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

    async getSeason(imdbId, season) {
        let url = this.URL + imdbId + `/episodes?season=${season}`;
    }

    async getEpisode(episodeImdbId) {

    }
}

let a = new Imdb();
a.getShow("tt0108778");
