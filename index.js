// const rp = require('request-promise');
// const $ = require('cheerio');
const mongoose = require("mongoose");

// mongoose.connect('localhost');
const YTS = require("./torrents/Movies/Yts");
const EzTv = require("./torrents/Shows/EzTv");
const yts = new YTS();
var ezTv;
const { Client } = require("pg");
const client = new Client({
    host: "localhost",
    user: "postgres",
    password: "god",
    database: "Shovie"
});

// const client = new Client({
//     host: "192.168.1.101",
//     user: "gandalf",
//     password: "god",
//     database: "shovie"
// });

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

async function ezz() {
    let resp = await ezTv.getTorrents();
    let ids = ezTv.getIdsFromTorrents(resp.torrents);
    let ga = await ezTv.checkIfIdsExist(ids);
    console.log(ga);
}

async function run() {
    await setup();
    // await syncMovies().catch(error => {
    //     console.log(error);
    // });

    ezTv = new EzTv({ client: client });
    await ezz();

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

