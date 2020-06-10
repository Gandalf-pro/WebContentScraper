

function readLast() {
    try {
        let fileRead = fs.readFileSync("lastIndexes.json");
        let indexesObject = JSON.parse(fileRead);
        return indexesObject;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

function writeLast(movie, show) {
    let initial = readLast();
    let writeObject = {};
    if (movie) {
        writeObject["movie"] = movie;
    } else {
        writeObject["movie"] = initial.movie;
    }
    if (show) {
        writeObject["show"] = show;
    } else {
        writeObject["show"] = initial.show;
    }
    fs.writeFileSync("lastIndexes.json", JSON.stringify(writeObject));    
}



class Movies{

    Movies(yts,client) {
        this.yts = yts;
        this.client = client;
    }


    async pushMoviePages(page) {
        // console.log(page);
        let movies = await this.yts.getMovies(50, page);
        let movieCount = movies.movie_count;
        movies = movies.movies;
        let insertedMovieCount = 0;
        for (const movie of movies) {
            //Insert the movie data
            let query = this.yts.getInsertString(movie);
            let res;
            try {
                res = await this.client.query(query);
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
                        query = this.yts.getTorrentString(x, movie.imdb_code.replace("tt", ""));
                        res = await this.client.query(query);
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
    
    async pushAllMovies(sync,start = 1) {        
        let finish;
        let movieCount = await this.yts.getMovieCount();
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
            let response = await this.pushMoviePages(i);
            totalInsertion += response.insertedMovieCount;
            let str = `Page:${i} Pages Left:${finish - i} Inserted:${response.insertedMovieCount} Total Inserted:${totalInsertion}`;
            console.log(str);
            // console.log("Page:" + i + " Pages Left:" + (finish - i) + "Inserted:" + response.insertedMovieCount + " Total Inserted:" + totalInsertion);
            if (sync && response.insertedMovieCount < 40) {
                writeLast(1);
                return;
            }
            writeLast(i + 1);
        }
    }
    
    async syncMovies(initialPage) {
        await this.pushAllMovies(true,initialPage);
    }


}

module.exports = Movies;