
DROP TABLE IF EXISTS public."ShowTorrents";
CREATE TABLE public."ShowTorrents"
(
    id          SERIAL PRIMARY KEY NOT NULL,
    imdb_id     text,
    episode_imdb_id text,
    torrent_url	text,
    magnet_url  text,
	hash		text,
    name        text,
    title       text,
	quality		character varying(20),
	seeds		integer,
	peers		integer,
    size_gb     FLOAT,
	size_bytes	BIGINT,
    date_uploaded timestamp without time zone,
    date_uploaded_unix BIGINT,
    season      INTEGER,
    episode     INTEGER

);

DROP TABLE IF EXISTS public."FullSeasonTorrents";
CREATE TABLE public."FullSeasonTorrents"
(
    id          SERIAL PRIMARY KEY NOT NULL,
    imdb_id     text NOT NULL,
    torrent_url	text,
    magnet_url  text,
	hash		text,
    name        text,
    quality		character varying(20),
    seeds		integer,
	peers		integer,
    size_gb     FLOAT,
	size_bytes	BIGINT,
    date_uploaded timestamp without time zone,
    date_uploaded_unix BIGINT,
    season      INTEGER
);

DROP TABLE IF EXISTS public."Episodes";
CREATE TABLE public."Episodes"(
    imdb_id         text,
    episode         INTEGER,
    episode_imdb_id text,
    torrents        INT[],
    summary         TEXT,
    rating          FLOAT,
    season          INTEGER,
    date_released   DATE,
    name            TEXT,
    posters         text[],
    
    CONSTRAINT "Episodes_pkey" PRIMARY KEY (imdb_id,episode,season)

);

DROP TABLE IF EXISTS public."Seasons";
CREATE TABLE public."Seasons"(
    imdb_id         text,
    season          INTEGER,
    episode_count   INTEGER,
    torrents        INTEGER[],
    episodes        INTEGER,

    CONSTRAINT "Seasons_pkey" PRIMARY KEY (imdb_id,season)

);

DROP TABLE IF EXISTS public."Shows";
CREATE TABLE public."Shows"(
    imdb_id             text,
    imdb_rating         FLOAT,
    title               text,
    posters             text[],
    latest_season       INTEGER,
    release_year        INTEGER,
    trailer             text,
    plot                text,


    CONSTRAINT "Shows_pkey" PRIMARY KEY (imdb_id)
);