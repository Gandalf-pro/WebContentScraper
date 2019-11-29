-- Table: public."Movies"
-- Table: public."MovieTorrents"

DROP TABLE IF EXISTS public."Movies";
DROP TABLE IF EXISTS public."MovieTorrents";

CREATE TABLE public."MovieTorrents"
(
    id          SERIAL PRIMARY KEY NOT NULL,
    imdb_id     integer NOT NULL,
    url			text,
	hash		text,
	quality		character varying(20),
	type		text,
	seeds		integer,
	peers		integer,
	size		text,
	size_bytes	BIGINT,
	date_uploaded	timestamp without time zone,
	date_uploaded_unix	bigint

);

CREATE TABLE public."Movies"
(
    yts_id integer,
    url text COLLATE pg_catalog."default",
    imdb_id integer NOT NULL,
    title text COLLATE pg_catalog."default",
    title_long text COLLATE pg_catalog."default",
    slug text COLLATE pg_catalog."default",
    year integer,
    rating integer,
    runtime integer,
    genres TEXT COLLATE pg_catalog."default",
    summary text COLLATE pg_catalog."default",
    yt_trailer_code text COLLATE pg_catalog."default",
    language text COLLATE pg_catalog."default",
    mpa_rating character varying(20) COLLATE pg_catalog."default",
    background_image text COLLATE pg_catalog."default",
    background_image_original text COLLATE pg_catalog."default",
    small_cover_image text COLLATE pg_catalog."default",
    medium_cover_image text COLLATE pg_catalog."default",
    large_cover_image text COLLATE pg_catalog."default",
    date_uploaded timestamp without time zone,
    date_uploaded_unix BIGINT,
    torrents INTEGER[],
    CONSTRAINT "Movies_pkey" PRIMARY KEY (imdb_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Movies"
    OWNER to postgres;