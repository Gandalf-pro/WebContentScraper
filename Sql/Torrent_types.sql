drop type if exists MovieTorrent;
drop type if exists ShowTorrent;

CREATE TYPE MovieTorrent AS (
	url			text,
	hash		text,
	quality		character varying(10),
	type		text,
	seeds		integer,
	peers		integer,
	size		text,
	size_bytes	integer,
	date_uploaded	timestamp without time zone,
	date_uploaded_unix	bigint
);

CREATE TYPE ShowTorrent AS(

)

ALTER TABLE public."Movies"
    ADD COLUMN torrent MovieTorrent;
