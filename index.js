// const rp = require('request-promise');
// const $ = require('cheerio');
const mongoose = require("mongoose");

// mongoose.connect('localhost');
const YTS = require("./torrents/Movies/Yts");
const EzTv = require("./torrents/Shows/EzTv");
const yts = new YTS();
const Omdb = require("./torrents/Omdb");
const omdb = new Omdb();
const Imdb = require("./Imdb");
const config = require("./config.json");
const fs = require("fs");
const Shows = require("./Shows");

const { Client } = require("pg");
const client = new Client(config.localDatabase);

var ezTv = new EzTv({ client: client });
const imdb = new Imdb({ client: client });
const shows = new Shows({ client: client, ezTv: ezTv, omdb: omdb, imdb: imdb });

async function setup() {
    await client.connect();
    console.log("connected");
}

async function start() {
    let movies = await yts.getMovies(50, 1);
    movies = movies.movies;
    for (const movie of movies) {
        //Insert the movie data
        let query = yts.getInsertString(movie);
        let res = await client.query(query);
        console.log(res);

        //Insert the torrent data
        for (const x of movie.torrents) {
            query = yts.getTorrentString(x, movie.imdb_code.replace("tt", ""));
            res = await client.query(query);
            console.log(res);
        }
    }
}

async function pushMoviePages(page) {
    // console.log(page);
    let movies = await yts.getMovies(50, page);
    let movieCount = movies.movie_count;
    movies = movies.movies;
    let insertedMovieCount = 0;
    for (const movie of movies) {
        //Insert the movie data
        let query = yts.getInsertString(movie);
        let res;
        try {
            res = await client.query(query);
        } catch (error) {
            console.log(query);
            console.log("\n\n" + error);
            process.exit(-2);
        }
        // console.log(res);

        //if row count is 1 then its inserted
        if (res.rowCount == 1) {
            //if its inserted the movie
            insertedMovieCount++;
            //Insert the torrent data
            if (movie.torrents) {
                for (const x of movie.torrents) {
                    query = yts.getTorrentString(
                        x,
                        movie.imdb_code.replace("tt", "")
                    );
                    res = await client.query(query);
                    // console.log(res);
                }
            }
        }
    }
    return {
        movieCount: movieCount,
        insertedMovieCount: insertedMovieCount
    };
}

async function pushAllMovies(sync) {
    let start = 1;
    let finish;
    let movieCount = await yts.getMovieCount();
    let pageTotal = Math.ceil(movieCount / 50);
    let totalInsertion = 0;
    console.log("Page Total:" + pageTotal + " Movie Count:" + movieCount);
    if (typeof finish === "number") {
        if (finish > pageTotal) {
            finish = pageTotal;
        }
    } else {
        finish = pageTotal;
    }
    console.log("finish page:" + finish);
    for (let i = start; i <= finish; i++) {
        let response = await pushMoviePages(i);
        totalInsertion += response.insertedMovieCount;
        let str = `Page:${i} Pages Left:${finish - i} Inserted:${
            response.insertedMovieCount
        } Total Inserted:${totalInsertion}`;
        console.log(str);
        // console.log("Page:" + i + " Pages Left:" + (finish - i) + "Inserted:" + response.insertedMovieCount + " Total Inserted:" + totalInsertion);
        if (sync && response.insertedMovieCount < 40) {
            return;
        }
    }
}

async function syncMovies() {
    await pushAllMovies(true);
}

async function run() {
    await setup();
    //sync movies and add to db
    // await syncMovies().catch(error => {
    //     console.log(error);
    // });

    // await ezz();
    let content = JSON.parse(fs.readFileSync("shows2.json"));

    let start = 10;
    start = content.findIndex((value, i, obj) => {
        if (value.imdbId == "tt7239256") {
            return true;
        }
    });
    if (start == -1) {
        start = 10;
    }
    console.log(`Start:${start} End:${content.length}`);
    let pushed = 0;
    for (let i = start; i < content.length; i++) {
        let mov = content[i];
        console.log(`${pushed+start} Show:${mov.title}  id:${mov.imdbId}`);
        try {
            if (mov.imdbId == undefined) {
                continue;
            }
            await shows.imdbPushShowEverythingWithId(mov.imdbId);
            //delete the index from json file
            content.splice(i, 1);
            i--;
            pushed++;
        } catch (error) {
            console.error(error);
        }
    }
    // await fs.writeFile("Done.json", JSON.stringify(content));

    // await pushMoviePages(1).catch(error => {
    //     console.log(error);
    // });
    await client.end();
}
run();

async function haja() {
    let ha = await ezTv.getAllShows();
    ha.forEach(element => {
        console.log(JSON.stringify(element));
    });
    console.log(ha.length);
}

//
//--------------------TV   STUFFF------------------------//
//

async function ezz() {
    let resp = await ezTv.getTorrents();
    let ids = ezTv.getIdsFromTorrents(resp.torrents);
    let neids = await ezTv.checkIfIdsExist(ids);
    for (const id of neids) {
        let realId = `tt${id}`;
        realId = "tt0108778";
        console.log(realId);

        //request show data
        let show = await omdb.getByIdOrTitle({
            imdbId: realId,
            type: "series"
        });
        //push show to database
        let ga = await pushShowToDatabase(show);

        //request every season
        const sesCount = show.totalSeasons;
        for (let i = 10; i <= sesCount; i++) {
            let season = await omdb.getByIdOrTitle({
                imdbId: realId,
                type: "series",
                season: i
            });
            //push season to database
            await pushSeasonToDatabase(season, show, i);
            //request every episode
            for (const episode of season.Episodes) {
                let reqEpisode = await omdb.getByIdOrTitle({
                    imdbId: realId,
                    type: "series",
                    season: i,
                    episode: episode.Episode
                });
                //push episode to database
                await pushEpisodeToDatabase(reqEpisode);
            }
        }
        return;
    }
}

async function pushShowToDatabase(show) {
    let id = show.imdbID;
    let Year = show.Year;
    let year = Year.split("–")[0];
    let title = client.escapeLiteral(show.Title);
    let plot = client.escapeLiteral(show.Plot);
    console.log(`id:${id}    year:${year}    Year:${Year}`);
    let query =
        'INSERT INTO public."Shows"(imdb_id, imdb_rating, title, posters, latest_season, release_year, plot)';
    query += `VALUES (${id}, ${show.imdbRating}, ${title}, '{"${show.Poster}"}', ${show.totalSeasons}, ${year}, ${plot})`;
    query += "ON CONFLICT DO NOTHING;";
    try {
        let res = await client.query(query);
        return res;
    } catch (error) {
        console.log(error);
        console.log(show);
        console.log(query);
        throw error;
    }
}

async function pushSeasonToDatabase(season, show, seasonNum) {
    let id = show.imdbID;
    let query = 'INSERT INTO public."Seasons"(imdb_id, season';
    if (season.Response == "True") {
        query += ", episode_count)";
        query += `VALUES (${id}, ${seasonNum},${season.Episodes.length})`;
    } else {
        query += `)VALUES (${id}, ${seasonNum})`;
    }
    query += "ON CONFLICT DO NOTHING;";
    try {
        let res = await client.query(query);
        return res;
    } catch (error) {
        console.log(error);
        console.log(season);
        console.log(query);
        throw error;
    }
}

async function pushEpisodeToDatabase(episode, season, show) {
    if (episode.Response == "False") {
        throw "No response";
    }
    let id = episode.seriesID;
    let episodeId = episode.imdbID;
    let date = convertTime(episode.Released);
    let plot = client.escapeLiteral(episode.Plot);
    let title = client.escapeLiteral(episode.Title);
    let query =
        'INSERT INTO public."Episodes"(imdb_id, episode, episode_imdb_id, summary, rating, season, date_released, name, posters)';
    query += `VALUES (${id}, ${episode.Episode}, ${episodeId}, ${plot}, ${episode.imdbRating}, ${episode.Season}, '${date}', ${title}, '{"${episode.Poster}"}')`;
    query += "ON CONFLICT DO NOTHING;";
    try {
        let res = await client.query(query);
        return res;
    } catch (error) {
        console.log(error);
        console.log(episode);
        console.log(query);
        throw error;
    }
}

async function syncShows() {
    let resp = await ezTv.getTorrents();

    for (let i = 1; true; i++) {
        //request the page
        let torrentsResp = await ezTv.getTorrents(i);

        //get the imdb ids of every torrent
        let ids = ezTv.getIdsFromTorrents(torrentsResp.torrents);

        //checking if the shows exist in the database
        let neids = await ezTv.checkIfIdsExist(ids);

        //push the non existant shows to database
        for (const id of neids) {
            await shows.imdbPushShowEverythingWithId(id);
        }

        //check if seasons of shows exist in database
        let neseasons = await ezTv.checkIfIdsExistSeason(torrentsResp.torrents);

        //push non existant seasons to database
        for (const torrent of neseasons) {
            await shows.imdbPushSeasonEverythingToDatabase(torrent);
        }

        //check if episodes exist in database

        //push non existant episodes to database

        //push every torrent to database

        //check the inserted count and stop if below 90
    }

    let ids = ezTv.getIdsFromTorrents(resp.torrents);
    let neids = await ezTv.checkIfIdsExist(ids);
    for (const id of neids) {
        let realId = `tt${id}`;
        realId = "tt0108778";
        console.log(realId);

        //request show data
        let show = await omdb.getByIdOrTitle({
            imdbId: realId,
            type: "series"
        });
        //push show to database
        let ga = await pushShowToDatabase(show);

        //request every season
        const sesCount = show.totalSeasons;
        for (let i = 10; i <= sesCount; i++) {
            let season = await omdb.getByIdOrTitle({
                imdbId: realId,
                type: "series",
                season: i
            });
            //push season to database
            await pushSeasonToDatabase(season, show, i);
            //request every episode
            for (const episode of season.Episodes) {
                let reqEpisode = await omdb.getByIdOrTitle({
                    imdbId: realId,
                    type: "series",
                    season: i,
                    episode: episode.Episode
                });
                //push episode to database
                await pushEpisodeToDatabase(reqEpisode);
            }
        }
        return;
    }
}
